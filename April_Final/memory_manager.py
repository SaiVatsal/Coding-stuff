import json
import os

class MemoryManager:
    def __init__(self, memory_file="memory.json", max_context_messages=20):
        self.memory_file = memory_file
        self.max_context_messages = max_context_messages
        self.history = self.load_memory()

    def load_memory(self):
        """Loads previous conversation history from local JSON."""
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print("Warning: Memory file corrupted. Starting fresh.")
                return []
        return []

    def save_memory(self):
        """Saves current conversation history into local JSON."""
        with open(self.memory_file, 'w', encoding='utf-8') as f:
            json.dump(self.history, f, indent=4)

    def add_message(self, role: str, content: str):
        """Adds a message to the history. Roles should be 'user', 'assistant', or 'system'."""
        self.history.append({"role": role, "content": content})
        
        # Enforce context limit
        if len(self.history) > self.max_context_messages:
            # We want to keep the system prompt if it's there
            if self.history[0].get("role") == "system":
                # Keep system prompt, remove the oldest non-system message
                self.history.pop(1)
            else:
                self.history.pop(0)

        self.save_memory()

    def get_context(self):
        """Returns the full conversation context to be sent to the LLM."""
        return self.history

    def clear_memory(self):
        """Wipes the conversation history."""
        self.history = []
        self.save_memory()

    def load_facts(self):
        """Loads user facts from local JSON."""
        facts_file = "facts.json"
        if os.path.exists(facts_file):
            try:
                with open(facts_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return {}
        return {}
        
    def save_facts(self, facts_dict):
        """Saves user facts to local JSON."""
        with open("facts.json", 'w', encoding='utf-8') as f:
            json.dump(facts_dict, f, indent=4)

    def learn_fact(self, key: str, value: str):
        """Learns a fact about the user."""
        facts = self.load_facts()
        facts[key] = value
        self.save_facts(facts)
        print(f"[Memory] Learned fact: {key} is {value}")
        return f"I will remember that your {key} is {value}."

    def retrieve_fact(self, key: str):
        """Retrieves a learned fact."""
        facts = self.load_facts()
        return facts.get(key, None)

if __name__ == "__main__":
    mm = MemoryManager("test_memory.json")
    mm.add_message("system", "I am April.")
    mm.add_message("user", "Hello April.")
    mm.add_message("assistant", "Hello! How can I help you?")
    print(mm.get_context())
    
    # Clean up test
    if os.path.exists("test_memory.json"):
        os.remove("test_memory.json")
