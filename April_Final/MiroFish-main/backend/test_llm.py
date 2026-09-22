import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv('LLM_API_KEY'),
    base_url=os.getenv('LLM_BASE_URL')
)

try:
    response = client.chat.completions.create(
        model=os.getenv('LLM_MODEL_NAME'),
        messages=[{'role': 'user', 'content': 'Generate a large JSON list of 10 completely random people with name, age, address, and occupation. Do not stop until all 10 are emitted.'}],
        response_format={'type': 'json_object'}
    )
    print("FINISHED")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"ERROR: {e}")
