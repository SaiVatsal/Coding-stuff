import os
import subprocess
import pyautogui

class PCManager:
    def __init__(self):
        pass

    def open_application(self, app_name: str):
        """Opens common Windows applications."""
        app_name = app_name.lower().strip()
        print(f"[PC] Trying to open {app_name}")
        
        apps = {
            "notepad": "notepad.exe",
            "calculator": "calc.exe",
            "browser": "start msedge",
            "chrome": "start chrome",
            "edge": "start msedge",
            "explorer": "explorer.exe",
            "cmd": "start cmd",
            "command prompt": "start cmd",
            "settings": "start ms-settings:"
        }
        
        if app_name in apps:
            os.system(apps[app_name])
            return True, f"Opened {app_name}"
        else:
            return False, f"I don't know how to open {app_name} yet."

    def set_volume(self, level: str):
        """Adjusts the system volume utilizing media keys via pyautogui."""
        level = level.lower().strip()
        print(f"[PC] Adjusting volume: {level}")
        
        # Press the volume up/down key multiple times for noticeable difference
        if level in ["up", "increase", "higher"]:
            for _ in range(5):
                pyautogui.press("volumeup")
            return True, "Volume increased."
        elif level in ["down", "decrease", "lower"]:
            for _ in range(5):
                pyautogui.press("volumedown")
            return True, "Volume decreased."
        elif level in ["mute", "silence"]:
            pyautogui.press("volumemute")
            return True, "Volume muted."
        else:
            return False, "I couldn't understand the volume command."

    def power_control(self, action: str):
        """Executes PC power commands (sleep, restart, shutdown)."""
        action = action.lower().strip()
        print(f"[PC] Power action: {action}")
        
        if "sleep" in action:
            # Puts Windows to sleep
            os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
            return True, "Going to sleep mode."
        elif "restart" in action:
            os.system("shutdown /r /t 5")
            return True, "Restarting the computer in 5 seconds."
        elif "shutdown" in action or "turn off" in action:
            os.system("shutdown /s /t 5")
            return True, "Shutting down the computer in 5 seconds."
        else:
            return False, "Power command not recognized."

if __name__ == "__main__":
    pcm = PCManager()
    print("Testing PC Manager...")
    # Uncomment to test
    # pcm.open_application("notepad")
    # pcm.set_volume("up")
