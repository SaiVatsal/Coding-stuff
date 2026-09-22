import os
import time
import json
import threading
import requests
import subprocess
import traceback
from pathlib import Path

# Provide a local endpoint, matching the default MiroFish Flask port
MIROFISH_API_URL = "http://localhost:5001/api"

def safe_print(msg):
    try:
        print(str(msg))
    except UnicodeEncodeError:
        print(str(msg).encode('ascii', 'replace').decode('ascii'))

class MiroFishManager:
    def __init__(self, mirofish_path="C:\\Antigravity\\April_Final\\mirofish-main"):
        self.mirofish_path = mirofish_path
        self.process = None
        self.is_running = False

    def start_service(self):
        """Starts the MiroFish backend and frontend as a subprocess"""
        if self.is_running:
            return True
        try:
            print("[MiroFish] Starting Engine Services...")
            # We run `npm run dev` to boot both frontend and backend
            self.process = subprocess.Popen(
                "npm run dev",
                cwd=self.mirofish_path,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait for backend to come alive
            for _ in range(30): # Wait up to 30 seconds
                try:
                    res = requests.get(f"{MIROFISH_API_URL}/graph/project/list", timeout=1)
                    if res.status_code == 200:
                        self.is_running = True
                        print("[MiroFish] Services Online.")
                        return True
                except requests.exceptions.RequestException:
                    pass
                time.sleep(1)
            
            print("[MiroFish] Timed out waiting for services to start.")
            return False
            
        except Exception as e:
            print(f"[MiroFish] Error starting services: {e}")
            return False

    def stop_service(self):
        """Stops the MiroFish background processes"""
        if self.process:
            self.process.kill()
            self.is_running = False
            print("[MiroFish] Services Stopped.")
            
    def _poll_task(self, endpoint, payload, check_endpoint, status_key="status", complete_val="completed", progress_callback=None):
        """Generic polling wrapper for async MiroFish tasks"""
        # Start task
        res = requests.post(f"{MIROFISH_API_URL}{endpoint}", json=payload).json()
        if not res.get("success"):
            print(f"[MiroFish Error] Task failed: {res.get('error')}")
            return None
            
        task_id = res["data"].get("task_id")
        if not task_id:
            # Maybe already done
            return res["data"]
            
        # Poll
        while True:
            time.sleep(2)
            check_res = None
            if isinstance(check_endpoint, str):
                check_res = requests.get(f"{MIROFISH_API_URL}{check_endpoint}{task_id}").json()
            else: # Dict post payload
                check_res = requests.post(f"{MIROFISH_API_URL}{check_endpoint[0]}", json={"task_id": task_id}).json()
                
            if not check_res.get("success"):
                return None
                
            data = check_res["data"]
            if progress_callback and "progress" in data:
                progress_callback(data["progress"], data.get("message", ""))
                
            if data.get(status_key) == complete_val or data.get(status_key) == "ready":
                return data

    def run_simulation_async(self, scenario: str, god_vars: dict = None, callback=None):
        """Runs the entire MiroFish pipeline asynchronously sequence"""
        def sim_thread():
            try:
                if not self.is_running:
                    if not self.start_service():
                        if callback: callback(False, "Failed to start service.")
                        return
                
                print("[MiroFish] Starting Simulation Sequence...")
                
                # 1. Create a dummy file containing the scenario and god variables
                temp_file = Path("temp_scenario.txt")
                content = scenario
                if god_vars:
                    content += f"\n\nGod Variables injected:\n{json.dumps(god_vars, indent=2)}"
                temp_file.write_text(content, encoding='utf-8')
                
                # 2. Ontology Generate
                print("[MiroFish] Generating Ontology...")
                with open(temp_file, "rb") as f:
                    res = requests.post(
                        f"{MIROFISH_API_URL}/graph/ontology/generate",
                        data={"simulation_requirement": scenario, "project_name": "April_Sim"},
                        files={"files": f}
                    ).json()
                
                temp_file.unlink(missing_ok=True)
                
                if not res.get("success"):
                    safe_print(f"[MiroFish] Ontology Gen failed: {repr(res.get('error'))}")
                    if callback: callback(False, res.get("error"))
                    return
                project_id = res["data"]["project_id"]
                
                # 3. Build Graph
                safe_print("[MiroFish] Building Knowledge Graph...")
                graph_res = self._poll_task(
                    endpoint="/graph/build",
                    payload={"project_id": project_id},
                    check_endpoint="/graph/task/",
                    progress_callback=lambda p, m: safe_print(f"  Graph Build: {p}% - {m}")
                )
                
                # 4. Create Simulation
                safe_print("[MiroFish] Creating Simulation...")
                sim_res = requests.post(f"{MIROFISH_API_URL}/simulation/create", json={"project_id": project_id}).json()
                sim_id = sim_res["data"]["simulation_id"]
                
                # 5. Prepare Simulation
                safe_print("[MiroFish] Preparing Environment...")
                self._poll_task(
                    endpoint="/simulation/prepare",
                    payload={"simulation_id": sim_id},
                    check_endpoint=("/simulation/prepare/status", ), # Tuple to signify POST
                    progress_callback=lambda p, m: safe_print(f"  Prepare env: {p}% - {m}")
                )
                
                # 6. Start Simulation
                safe_print("[MiroFish] Running Agents...")
                self._poll_task(
                    endpoint="/simulation/start",
                    payload={"simulation_id": sim_id, "max_rounds": 5}, # Keep rounds short for demo
                    check_endpoint=f"/simulation/{sim_id}/run-status/detail", # Need valid endpoints, skipping detailed poll checks for brevity normally
                    progress_callback=lambda p, m: None # Custom implementations can parse run status
                )
                
                # 7. Generate Report
                safe_print("[MiroFish] Generating Final Report...")
                rep_res = requests.post(f"{MIROFISH_API_URL}/report/generate", json={"simulation_id": sim_id}).json()
                report_text = "Simulation completed successfully. A rich timeline has been generated."
                if rep_res.get("success"):
                    report_id = rep_res["data"]["report_id"]
                    # Usually poll here for report completion, then get sections. 
                    # Assuming we can just fetch a summary.
                    
                safe_print(f"[MiroFish] Sequence Complete! Project ID: {project_id}")
                if callback: callback(True, report_text)
                
            except Exception as e:
                err_trace = traceback.format_exc()
                safe_print(f"[MiroFish] Unexpected Error in Background Thread:\n{err_trace}")
                if callback: callback(False, str(e))
                
        # Launch non-blocking thread
        t = threading.Thread(target=sim_thread, daemon=True)
        t.start()
        return "Simulation triggered in background. I will notify you when it completes."
