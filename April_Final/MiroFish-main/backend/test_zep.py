import os
from zep_cloud.client import Zep
from dotenv import load_dotenv

load_dotenv()

zep_key = os.getenv('ZEP_API_KEY')
print(f'Testing ZEP_API_KEY: {zep_key[:10]}... Length: {len(zep_key)}')

try:
    client = Zep(api_key=zep_key)
    # Check if we can fetch graphs or add a node
    print(client.graph.node.get(uuid_='12345'))
except Exception as e:
    print(f'ERROR TYPE: {type(e)}')
    print(f'ERROR: {e}')
