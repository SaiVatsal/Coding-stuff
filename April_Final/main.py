import os
import sys
from audio_manager import AudioManager
from security_manager import SecurityManager
from memory_manager import MemoryManager
from ai_manager import AIManager
from pc_manager import PCManager
from vision_manager import VisionManager
from planner_manager import PlannerManager

def enroll_new_user():
    print("Welcome to April AI Setup.")
    sm = SecurityManager()
    sm.enroll_user()
    print("Setup complete. You can now run the assistant.")
    sys.exit(0)

def route_command(command: str, audio: AudioManager, pc: PCManager, vision: VisionManager, planner: PlannerManager, memory: MemoryManager, ai: AIManager):
    """Routes the command to the correct module based on simple offline keywords."""
    cmd_lower = command.lower()
    
    # 1. PC Control - Applications
    if "open" in cmd_lower:
        app_name = cmd_lower.replace("open", "").strip()
        success, response = pc.open_application(app_name)
        audio.speak(response)
        return

    # 2. PC Control - Power/System
    if any(word in cmd_lower for word in ["shutdown", "restart", "sleep"]):
        success, response = pc.power_control(cmd_lower)
        audio.speak(response)
        return

    # 3. PC Control - Volume
    if "volume" in cmd_lower:
        success, response = pc.set_volume(cmd_lower.replace("volume", ""))
        audio.speak(response)
        return

    # 4. Vision - Take picture
    if "picture" in cmd_lower or "photo" in cmd_lower or "snapshot" in cmd_lower:
        success, response = vision.capture_snapshot()
        if success:
            audio.speak("I've taken a snapshot for you.")
        else:
            audio.speak("I was unable to access the camera.")
        return

    # 5. Vision - Emotion detection
    if "emotion" in cmd_lower or "how do i look" in cmd_lower or "face" in cmd_lower:
        response = vision.detect_emotion()
        audio.speak(response)
        return

    # 6. Planner - Add task
    if "add task" in cmd_lower or "remind me to" in cmd_lower:
        task = cmd_lower.replace("add task", "").replace("remind me to", "").strip()
        if task:
            success, response = planner.add_task(task)
            audio.speak(response)
        else:
            audio.speak("What task would you like me to add?")
        return

    # 7. Planner - View tasks
    if "view tasks" in cmd_lower or "my tasks" in cmd_lower or "what are my tasks" in cmd_lower:
        success, response = planner.view_tasks()
        audio.speak(response)
        return
        
    # 8. Planner - Mark complete
    if "complete task" in cmd_lower or "finish task" in cmd_lower:
        task = cmd_lower.replace("complete task", "").replace("finish task", "").strip()
        success, response = planner.mark_complete(task_str=task)
        audio.speak(response)
        return

    # Council Toggles
    if "enable council" in cmd_lower:
        ai.set_council_mode(True)
        audio.speak("Council mode activated. Multi-agent deliberation enabled.")
        return
    if "disable council" in cmd_lower:
        ai.set_council_mode(False)
        audio.speak("Council mode deactivated.")
        return
    if "enable autonomous" in cmd_lower:
        ai.set_autonomous_mode(True)
        audio.speak("Autonomous mode activated.")
        return
    if "disable autonomous" in cmd_lower:
        ai.set_autonomous_mode(False)
        audio.speak("Autonomous mode deactivated.")
        return

    # 9. Default Fallback Chat Engine (Memory / Rules)
    print("Routing to chat engine...")
    response = ai.generate_response(memory, command)
    audio.speak(response)

def run_assistant():
    print("Starting April AI Assistant (Offline)...")
    
    # Initialize all components locally
    audio = AudioManager(wake_word="april")
    security = SecurityManager()
    memory = MemoryManager()
    ai = AIManager()
    pc = PCManager()
    vision = VisionManager()
    planner = PlannerManager()
    
    # Check if user is enrolled (only if speaker recognition is enabled)
    if security.speaker_recognition_enabled and not os.path.exists(security.authorized_voice_path):
        print("No authorized user found. Please run with '--enroll' flag first.")
        sys.exit(1)

    print("April is active and listening...")
    
    while True:
        try:
            # 1. Listen for the wake word
            if audio.listen_for_wake_word():
                audio.speak("Yes?")
                
                # 2. Listen for command
                command = audio.listen_and_transcribe(save_path="temp_command.wav")
                
                if not command:
                    continue
                
                # 3. Verify speaker from the saved command audio
                is_authorized = security.verify_speaker("temp_command.wav")
                
                if not is_authorized:
                    audio.speak("I'm sorry, I don't recognize your voice. Access denied.")
                    continue
                
                # 4. Route command to appropriate offline module
                route_command(command, audio, pc, vision, planner, memory, ai)

        except KeyboardInterrupt:
            print("\nShutting down April...")
            break
        except Exception as e:
            print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--enroll":
        enroll_new_user()
    else:
        run_assistant()
