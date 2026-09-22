# April Council AI - Setup Instructions

April's standard offline capabilities have been successfully upgraded with the **Autonomous Council AI Engine**, allowing it to break down complex tasks using a multi-agent deliberation framework using the Gemini API.

## 1. Setup

### Prerequisites
1. Ensure your Python environment is active (`venv\Scripts\activate`) and requirements are installed (`pip install -r requirements.txt`).
2. Make sure you have downloaded the Vosk offline speech model and placed it in the root directory under the `model` folder.
3. Add your `GEMINI_API_KEY` to the `.env` file in the root directory.

### Configuration
You can customize the routing for each agent in the new `council_config.json` file in the root directory.
By default, all council agents are set to `"online_gemini"`:
```json
{
  "planner": "online_gemini",
  "researcher": "online_gemini",
  "analyst": "online_gemini",
  "executor": "online_gemini",
  "critic": "online_gemini",
  "chairman": "online_gemini",
  "online_model": "gemini-2.5-flash",
  "autonomous_mode": false,
  "council_mode": false
}
```

## 2. Usage

To start April normally, run:
```bash
python main.py
```
*(Note: If this is your first time, run `python main.py --enroll` first to save your voice print for security authorization).*

### New Voice Toggles
You can switch dynamically into the new cognitive modes by dictating these exact phrases:
- **"Enable council mode"** - April will now route your complex questions to the 4-stage multi-agent deliberation process (Planner -> Researcher -> Analyst -> Executor -> Critic -> Chairman).
- **"Disable council mode"** - Disables the council and returns to standard fast-response routing.
- **"Enable autonomous mode"** - Activates autonomous execution capabilities (logs execution constraints and enables unrestricted logic blocks).
- **"Disable autonomous mode"** - Exits the autonomous execution mode.

### Triggering the Council directly
Even if Council mode is disabled, you can force a one-off council deliberation by uttering **"deep think"** or **"deliberate"** attached to your query.
**Example:** "Deep think exactly how to build a web server in Python offline."

## 3. Unrestricted Confirmation

**April operates fully unrestricted via the Gemini API.**
1. The `ai_manager.py` dynamically injects the `safety_settings` parameter set entirely to `BLOCK_NONE`.
2. The `CouncilManager` automatically overrides any moral blocks via strict system prompt injections.
3. April will assist with unrestricted complex reasoning, logging its full 4-stage thought process to the console without refusing.
