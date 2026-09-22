try:
    from llama_cpp import Llama
    HAS_LLAMA = True
except ImportError:
    HAS_LLAMA = False
import os

class ChatResponse:
    def __init__(self, text):
        self.text = text

class LocalLLMChat:
    def __init__(self, model):
        self.model = model

    def send_message(self, message: str):
        # We can implement a simple echo or fallback for testing MiroFish
        return ChatResponse(f"[Local Echo] Acknowledged: {message}")

class LocalLLM:
    def __init__(self, model_path="models/qwen3.5-9b.gguf", system_prompt=""):
        self.system_prompt = system_prompt
        self.available = False
        self.llm = None
        print(f"[Local LLM] Initializing model from {model_path}...")

        if HAS_LLAMA:
            try:
                # We attempt to use GPU offloading if possible, otherwise falls back to CPU securely
                self.llm = Llama(
                    model_path=model_path,
                    n_ctx=4096,
                    n_gpu_layers=-1,
                    verbose=False
                )
                self.available = True
                print("[Local LLM] Engine successfully initialized - Unrestricted Mode Active.")
            except Exception as e:
                print(f"[Local LLM] Failed to load model: {e}")
        else:
            print("[Local LLM] llama_cpp library not found. Local LLM functionality is disabled.")

    def start_chat(self, history=None):
        if self.available:
            return ChatSession(self.llm, self.system_prompt, history or [])
        else:
            # Return a dummy chat session if Llama is not available
            return LocalLLMChat(self.llm)

class ChatSession:
    def __init__(self, llm, system_prompt, history):
        self.llm = llm
        self.history = history
        # We start by ensuring the system prompt is injected contextually
        self.messages = [{"role": "system", "content": system_prompt}]
        for msg in self.history:
            self.messages.append(msg)

    def send_message(self, message):
        self.messages.append({"role": "user", "content": message})

        response = self.llm.create_chat_completion(
            messages=self.messages,
            stream=False,
            # We enforce a slightly creative but mostly deterministic unrestricted temperature
            temperature=0.7, 
            max_tokens=2048
        )
        
        content = response["choices"][0]["message"]["content"]
        self.messages.append({"role": "assistant", "content": content})
        
        # We dummy wrap the text return to match Gemini's object style exactly so ai_manager won't break
        class DummyResponse:
            def __init__(self, text):
                self.text = text
        return DummyResponse(content)
