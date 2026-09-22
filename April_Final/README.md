# April - Offline Personal AI Assistant

"I am April, your personal AI assistant."

April has been upgraded to a fully offline, lightweight personal assistant. It is optimized to run on low-end laptops (<= 8GB RAM) without requiring any internet connection or cloud API keys.

## Features
- **Offline Voice Interaction:** Uses `Vosk` for fast, lightweight speech-to-text without the internet, and Windows' built-in `pyttsx3` for highly responsive text-to-speech.
- **Hybrid Chat Engine:** Dynamically routes your queries:
  - **Online:** Uses Google Gemini for all complex answers and council execution, completely unrestricted.
  - **Rules:** If offline, uses an ultra-lightweight rule-based fallback system.
- **PC Control:** Tell April to open applications (Notepad, Calculator, Browser), change volume, or shutdown/sleep your PC.
- **Webcam Vision:** Can capture snapshots and perform basic lightweight emotion detection via your webcam.
- **Smart Planner:** Voice-activated daily task management (add tasks, view tasks, complete tasks).
- **Auto-Learning Memory:** Automatically extracts facts (e.g., "my favorite color is blue") and retrieves them later.
- **Biometric Security:** Responds ONLY to the authorized user's voice print.

---

## Setup Instructions

### 1. Prerequisites
You will need Python 3.9+ and some system-level audio dependencies. A working microphone and webcam are required.
You will also need to download a offline speech model for Vosk.

### 2. Requirements for Chat Engine
- **Online Setup (Gemini):** Add your Google API key to a `.env` file (`GEMINI_API_KEY=your_key`). April's AI capabilities are now exclusively powered by Gemini.

### 3. Download Offline Speech Model
1. Go to https://alphacephei.com/vosk/models
2. Download a small English model (e.g., `vosk-model-small-en-us-0.15`)
3. Extract the downloaded zipped folder into the root directory of this project and rename it to **`model`**.

### 3. Installation
Install the required Python dependencies:

```bash
# Strongly recommended: Create a virtual environment
python -m venv venv
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 4. Enroll Your Voice (CRITICAL)
Before April will respond to you, you must enroll your voice so she knows who is authorized.

Run the setup script:
```bash
python main.py --enroll
```
When prompted, speak naturally for about 5 seconds (e.g., "I am the authorized user of April."). Your voice print will be saved securely.

### 5. Running April
Once enrolled, you can start the assistant loop:
```bash
python main.py
```
- Wait until it says "April is active and listening..."
- Say "**April**"
- Wait for her to respond "**Yes?**"
- Speak your command:
  - "Open notepad"
  - "Take a picture"
  - "How do I look?" (Emotion detection)
  - "Add task finish the report"
  - "View my tasks"
  - "My favorite food is pizza"

## Troubleshooting for Low-End Laptops
- **Vosk Errors:** Ensure the `model` folder is placed precisely in the root directory where `main.py` is run.
- **SpeechBrain Performance:** If speaker recognition takes too long initially, it's because PyTorch is loading. The first cache hit takes a moment, but subsequent comparisons should be faster.
- **Microphone Issues:** Check if Windows privacy settings are allowing microphone access for Python apps.
