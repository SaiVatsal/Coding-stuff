import os
import wave
import sounddevice as sd
import numpy as np
import torchaudio

class SecurityManager:
    def __init__(self, authorized_voice_path="authorized_voice.wav"):
        self.authorized_voice_path = authorized_voice_path
        self.verifier = None
        self.speaker_recognition_enabled = False
        
        # Try to load the pre-trained Speaker Recognition model from SpeechBrain
        try:
            print("Loading Speaker Recognition Model (this might take a moment on first run)...")
            from speechbrain.inference.speaker import SpeakerRecognition
            self.verifier = SpeakerRecognition.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb", 
                savedir="pretrained_models/spkrec-ecapa-voxceleb"
            )
            self.speaker_recognition_enabled = True
            print("Speaker Recognition Model loaded successfully.")
        except Exception as e:
            print(f"Warning: Could not load Speaker Recognition Model ({str(e)[:80]}...)")
            print("Continuing without speaker verification. All voice commands will be accepted.")
            self.speaker_recognition_enabled = False

    def record_audio(self, filename, duration=5, rate=16000, chunk=1024):
        """Records audio from the microphone and saves it to a WAV file."""
        print(f"Recording for {duration} seconds... Please speak now.")
        
        # Record audio using sounddevice
        audio_data = sd.rec(int(rate * duration), samplerate=rate, channels=1, dtype=np.int16)
        sd.wait()
        
        print("Recording complete.")

        wf = wave.open(filename, 'wb')
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 2 bytes for int16
        wf.setframerate(rate)
        wf.writeframes(audio_data.tobytes())
        wf.close()

    def enroll_user(self):
        """Records the authorized user's voice to use as a baseline."""
        print("=== User Enrollment ===")
        print("Please say something like: 'I am the authorized user of April.'")
        self.record_audio(self.authorized_voice_path, duration=5)
        print(f"Voice enrolled successfully. Saved to {self.authorized_voice_path}.")

    def verify_speaker(self, test_audio_path) -> bool:
        """Compares a test audio file against the enrolled authorized user's voice."""
        # If speaker recognition is not available, allow all commands
        if not self.speaker_recognition_enabled:
            return True
            
        if not os.path.exists(self.authorized_voice_path):
            print("Warning: No authorized voice profile found. Please enroll first.")
            return False
            
        if not os.path.exists(test_audio_path):
            return False

        try:
            # Compute similarity between the two audio files
            score, prediction = self.verifier.verify_files(self.authorized_voice_path, test_audio_path)
            
            # prediction is a tensor containing True/False. We extract the boolean value.
            # score is the cosine similarity score.
            is_match = prediction.item()
            similarity = score.item()
            
            print(f"[Security] Speaker match: {is_match} (Score: {similarity:.2f})")
            return is_match
        except Exception as e:
            print(f"[Security] Error verifying speaker: {e}")
            return True  # Allow by default if verification fails

if __name__ == "__main__":
    # Test block
    sm = SecurityManager()
    
    choice = input("Do you want to (E)nroll or (V)erify? [E/V]: ").strip().upper()
    if choice == 'E':
        sm.enroll_user()
    elif choice == 'V':
        print("Recording test audio...")
        sm.record_audio("test_sample.wav", duration=3)
        result = sm.verify_speaker("test_sample.wav")
        if result:
            print("Access GRANTED. Voice recognized.")
        else:
            print("Access DENIED. Voice not recognized.")
    else:
        print("Invalid choice.")
