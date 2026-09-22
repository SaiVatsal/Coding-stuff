from ai_manager import AIManager
from memory_manager import MemoryManager
import time

def test_mirofish_integration():
    print("Initializing AIManager...")
    ai = AIManager()
    mem = MemoryManager("test_mirofish_memory.json")
    
    print("\n--- Testing MiroFish Local Invocation ---")
    query = "simulate opening a coffee shop"
    print(f"User: {query}")
    
    # Generate response
    response = ai.generate_response(mem, query)
    print(f"April: {response}")
    
    # Wait for background task to complete (or for 5 minutes maximum)
    print("\nWaiting for background prediction task...\n")
    for _ in range(300):
        time.sleep(1)
        # Simply keep the main thread alive. The daemon thread prints progress to console

if __name__ == "__main__":
    test_mirofish_integration()
