import os
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

class AIProviderFactory:
    @staticmethod
    def get_provider(provider_name: str):
        if provider_name == "openai":
            return ChatOpenAI(model="gpt-4o", temperature=0.7)
        elif provider_name == "anthropic":
            return ChatAnthropic(model="claude-3-opus-20240229", temperature=0.7)
        elif provider_name == "gemini":
            return ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.7)
        else:
            raise ValueError(f"Unknown provider: {provider_name}")

class CoachingAgent:
    def __init__(self, provider_name: str = "openai"):
        self.llm = AIProviderFactory.get_provider(provider_name)
    
    def generate_feedback(self, context: str, user_answer: str, question: str):
        system_prompt = f"""You are an expert interview coach. 
You are grounded in the following user context (resume/job description):
{context}

Provide a short, constructive feedback on the user's answer to the question.
Include:
1. STAR structure advice if behavioral
2. Key technical concepts if technical
3. Common mistakes to avoid
4. Confidence score (0-100)"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Question: {question}\nUser Answer: {user_answer}")
        ]
        
        response = self.llm.invoke(messages)
        return response.content

