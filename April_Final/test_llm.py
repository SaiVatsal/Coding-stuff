from ai_manager import AIManager
from memory_manager import MemoryManager

def test_local_model():
    print("Initializing AIManager...")
    ai = AIManager()
    
    print("Initializing MemoryManager...")
    mem = MemoryManager()
    
    print("\n--- Testing Local Model Inference ---")
    query = "Hello April, are you running entirely offline?"
    print(f"User: {query}")
    
    # We force the call to skip council and testing standard offline capability
    ai.generate_response(mem, query, query)
    
    print("\nTest completed.")

if __name__ == "__main__":
    test_local_model()
