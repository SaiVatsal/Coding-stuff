import sys
import wave
import json
import threading
import queue

import pyttsx3
import vosk
import sounddevice as sd
import numpy as np


class AudioManager:
    def __init__(self, wake_word="april"):
        self.wake_word = wake_word.lower()

        # Initialize pyttsx3 for offline TTS
        self.engine = pyttsx3.init()
        self._setup_voice()

        # Initialize Vosk for offline STT
        # Requires a vosk model folder named "model" in the project root.
        # Download a small model from: https://alphacephei.com/vosk/models
        vosk.SetLogLevel(-1)
        try:
            self.model = vosk.Model("vosk-model-en-us-0.22-lgraph")
            print("Vosk model loaded successfully.")
        except Exception:
            print("WARNING: Vosk 'model' folder not found.")
            print("Download a small EN model from https://alphacephei.com/vosk/models")
            print("and extract it to a folder named 'model' in this directory.")
            sys.exit(1)

        self.sample_rate = 16000

        # FIX 4: One recognizer per job — created fresh each time to avoid
        # state pollution between wake-word and command sessions.
        # (Removed self.recognizer; use _new_recognizer() instead.)

    def _new_recognizer(self) -> vosk.KaldiRecognizer:
        """Return a fresh KaldiRecognizer so state never leaks between sessions."""
        return vosk.KaldiRecognizer(self.model, self.sample_rate)

    # ── TTS ─────────────────────────────────────────────────────────────────────

    def _setup_voice(self):
        """Configures the pyttsx3 voice properties."""
        voices = self.engine.getProperty("voices")
        if len(voices) > 1:
            self.engine.setProperty("voice", voices[1].id)
        else:
            self.engine.setProperty("voice", voices[0].id)
        self.engine.setProperty("rate", 170)
        self.engine.setProperty("volume", 1.0)

    def speak(self, text: str):
        """Speak text using pyttsx3 offline TTS (blocking)."""
        print(f"April: {text}")
        self.engine.say(text)
        self.engine.runAndWait()

    # ── Microphone helpers ───────────────────────────────────────────────────────

    def _find_best_microphone(self):
        """Find the best available microphone device index."""
        try:
            devices = sd.query_devices()
            # Prefer a WASAPI microphone for better quality on Windows
            for i, device in enumerate(devices):
                if device["max_input_channels"] > 0:
                    name = str(device.get("name", "")).lower()
                    if "microphone" in name and "wasapi" in name:
                        return i
            # Fall back to the first device that accepts input
            for i, device in enumerate(devices):
                if device["max_input_channels"] > 0:
                    return i
        except Exception as e:
            print(f"Error finding microphone: {e}")
        return None

    # ── Wake-word detection ──────────────────────────────────────────────────────

    def listen_for_wake_word(self) -> bool:
        """Listen continuously until the wake word is detected."""
        print(f"Listening for wake word: '{self.wake_word}'...")

        mic_device = self._find_best_microphone()
        if mic_device is None:
            print("No microphone found! Check your audio settings.")
            return False
        print(f"Using microphone device {mic_device}")

        # FIX 4: fresh recognizer for wake-word session
        recognizer = self._new_recognizer()

        while True:
            try:
                # FIX 3: record a short chunk, then squeeze to 1-D before tobytes()
                audio_data = sd.rec(
                    int(self.sample_rate * 0.5),
                    samplerate=self.sample_rate,
                    channels=1,
                    dtype=np.int16,
                    device=mic_device,
                )
                sd.wait()

                # audio_data shape is (N, 1) — flatten to (N,) for Vosk
                data = np.squeeze(audio_data).tobytes()  # FIX 3

                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "").lower()
                    if text:
                        print(f"Heard: {text}")
                    if self.wake_word in text:
                        print("Wake word detected!")
                        return True
                else:
                    partial = json.loads(recognizer.PartialResult())
                    partial_text = partial.get("partial", "")
                    if partial_text:
                        print(f"Partial: {partial_text}")

            except Exception as e:
                print(f"Error during wake word detection: {e}")
                continue

    # ── Command transcription ────────────────────────────────────────────────────

    def listen_and_transcribe(self, save_path="temp_command.wav") -> str:
        """
        Listen for a voice command, transcribe it with Vosk, and save the audio.

        Uses an InputStream + queue for true real-time chunk processing with
        silence-based auto-stop — fixes the frozen-array bug in the original.
        """
        print("Listening for command...")

        mic_device = self._find_best_microphone()

        # FIX 4: fresh recognizer so wake-word state doesn't bleed in
        recognizer = self._new_recognizer()

        # FIX 2 + 5: use a queue-backed InputStream for genuine real-time processing
        audio_queue: queue.Queue = queue.Queue()

        def audio_callback(indata, frames_count, time_info, status):
            """Called by sounddevice on each audio chunk — runs in a separate thread."""
            if status:
                print(f"[audio] {status}")
            # FIX 3: indata is (N, 1); squeeze to 1-D before queuing
            audio_queue.put(np.squeeze(indata.copy()).tobytes())

        chunk_frames   = 4000          # ~0.25 s per chunk at 16 kHz
        max_seconds    = 15            # FIX 1: was 2000 (33 min!) — now a sane limit
        silence_limit  = 30            # consecutive silent chunks before stopping
        silence_count  = 0
        has_spoken     = False
        command_text   = ""
        all_frames     = []            # FIX 7: collect frames from the STREAM, not a pre-allocated array

        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype=np.int16,
            blocksize=chunk_frames,
            device=mic_device,
            callback=audio_callback,
        ):
            total_chunks = int(self.sample_rate * max_seconds / chunk_frames)

            for _ in range(total_chunks):
                try:
                    data = audio_queue.get(timeout=1.0)
                except queue.Empty:
                    continue

                all_frames.append(data)  # FIX 7: real audio, not silence

                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "")
                    if text:
                        command_text += text + " "
                        has_spoken = True
                        silence_count = 0
                    else:
                        if has_spoken:
                            silence_count += 1
                else:
                    partial = json.loads(recognizer.PartialResult())
                    if partial.get("partial", ""):
                        silence_count = 0  # still hearing something

                # FIX 5: silence detection now works on real audio data
                if has_spoken and silence_count > silence_limit:
                    break

        # Pick up any trailing words Vosk hasn't flushed yet
        final = json.loads(recognizer.FinalResult())
        if final.get("text", ""):
            command_text += final["text"]

        command_text = command_text.strip()
        print(f"User: {command_text}")

        # Save the recorded audio to a WAV file (FIX 7: contains real audio now)
        if all_frames:
            with wave.open(save_path, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)   # int16 = 2 bytes
                wf.setframerate(self.sample_rate)
                wf.writeframes(b"".join(all_frames))

        return command_text


# ── Quick test ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    am = AudioManager()
    if am.listen_for_wake_word():
        am.speak("Hello! I am April.")
        command = am.listen_and_transcribe()
        if command:
            am.speak(f"You said: {command}")