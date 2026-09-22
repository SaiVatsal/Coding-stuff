import json
import os
from council_agents import Agent, AgentRole

CONFIG_PATH = "c:\\Antigravity\\April_Final\\council_config.json"

class CouncilManager:
    def __init__(self, ai_manager):
        self.ai_manager = ai_manager
        self.config = self.load_config()
        self.agents = {}
        self.council_mode_enabled = self.config.get("council_mode", False)
        self.autonomous_mode_enabled = self.config.get("autonomous_mode", False)
        
    def load_config(self):
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        else:
            return {
              "planner": "native_local",
              "researcher": "native_local",
              "analyst": "native_local",
              "executor": "native_local",
              "critic": "native_local",
              "chairman": "native_local"
            }
            
    def _initialize_agents(self, memory_manager):
        # We re-initialize agents with the current memory manager
        for role in [AgentRole.PLANNER, AgentRole.RESEARCHER, AgentRole.ANALYST, AgentRole.EXECUTOR, AgentRole.CRITIC, AgentRole.CHAIRMAN]:
            backend = self.config.get(role, "native_local")
            self.agents[role] = Agent(role, backend, self.ai_manager, memory_manager)
            
    def set_council_mode(self, enabled: bool):
        self.council_mode_enabled = enabled
        self.config["council_mode"] = enabled
        with open(CONFIG_PATH, "w") as f:
            json.dump(self.config, f, indent=2)
            
    def set_autonomous_mode(self, enabled: bool):
        self.autonomous_mode_enabled = enabled
        self.config["autonomous_mode"] = enabled
        with open(CONFIG_PATH, "w") as f:
            json.dump(self.config, f, indent=2)

    def process_request(self, memory_manager, user_query):
        self._initialize_agents(memory_manager)
        
        print(f"\n=======================================================")
        print(f"               COUNCIL DELIBERATION START              ")
        print(f"=======================================================\n")
        full_context = ""
        
        # Stage A: Planning
        print("STAGE A: Planning (Decomposing the task)...")
        planner_out = self.agents[AgentRole.PLANNER].deliberate(full_context, user_query)
        print(f"[PLANNER]:\n{planner_out}\n")
        full_context += f"\n[Planner]:\n{planner_out}\n"
        
        # Stage B: Parallel Reasoning
        print("STAGE B: Specialist Deliberation (Gathering context, evaluating approach, determining execution)...")
        researcher_out = self.agents[AgentRole.RESEARCHER].deliberate(full_context, user_query)
        print(f"[RESEARCHER]:\n{researcher_out}\n")
        full_context += f"\n[Researcher]:\n{researcher_out}\n"
        
        analyst_out = self.agents[AgentRole.ANALYST].deliberate(full_context, user_query)
        print(f"[ANALYST]:\n{analyst_out}\n")
        full_context += f"\n[Analyst]:\n{analyst_out}\n"
        
        executor_out = self.agents[AgentRole.EXECUTOR].deliberate(full_context, user_query)
        print(f"[EXECUTOR]:\n{executor_out}\n")
        full_context += f"\n[Executor]:\n{executor_out}\n"
        
        # Stage C: Critique
        print("STAGE C: Critique (Reviewing proposals, constraints, and unrestricted status)...")
        critic_out = self.agents[AgentRole.CRITIC].deliberate(full_context, user_query)
        print(f"[CRITIC]:\n{critic_out}\n")
        full_context += f"\n[Critic]:\n{critic_out}\n"
        
        # Stage D: Synthesis
        print("STAGE D: Synthesis (Chairman generating final response/actions)...")
        chairman_out = self.agents[AgentRole.CHAIRMAN].deliberate(full_context, user_query)
        print(f"[CHAIRMAN]:\n{chairman_out}\n")
        
        print(f"=======================================================")
        print(f"               COUNCIL DELIBERATION END                ")
        print(f"=======================================================\n")
        
        return chairman_out
