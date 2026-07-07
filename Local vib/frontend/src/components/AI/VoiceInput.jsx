import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore.js';

export default function VoiceInput({ onTranscript }) {
  const store = useStore();
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const isWhisperEnabled = store.settings.whisperApiEnabled;
  const isPushToTalk = store.settings.voiceMode === 'push-to-talk';

  const startWebSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setRecording(true);
    };

    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      onTranscript(text);
    };

    rec.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      stopRecording();
    };

    rec.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
    return true;
  };

  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Stop all track media streams
        stream.getTracks().forEach(track => track.stop());

        // Upload to backend Whisper API
        setTranscribing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.wav');

        try {
          const res = await fetch('/api/ai/whisper', {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              onTranscript(data.text);
            }
          } else {
            console.error('Whisper API conversion failed.');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('MediaRecorder start failed:', err);
      alert('Unable to access microphone.');
    }
  };

  const startRecording = () => {
    if (isWhisperEnabled) {
      startWhisperRecording();
    } else {
      const success = startWebSpeech();
      if (!success) {
        // Fallback to media recorder upload if browser doesn't support WebSpeech
        console.warn('Web Speech API unsupported. Trying Whisper fallback...');
        startWhisperRecording();
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handleClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (transcribing) {
    return (
      <button disabled className="p-1.5 text-text-secondary animate-spin">
        <Loader size={13} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={recording ? 'Stop listening' : 'Start voice typing'}
      className={`p-1.5 rounded-full transition cursor-pointer ${
        recording 
          ? 'bg-error-custom text-white animate-pulse' 
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
      }`}
    >
      {recording ? <MicOff size={13} /> : <Mic size={13} />}
    </button>
  );
}
