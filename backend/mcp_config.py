import os
from dotenv import load_dotenv

load_dotenv()

ELASTIC_MCP_URL = os.getenv("ELASTIC_MCP_URL")
ELASTIC_KIBANA_URL = os.getenv("ELASTIC_KIBANA_URL")

def validate_mcp_config():
    if not ELASTIC_MCP_URL:
        print("[WARNING] ELASTIC_MCP_URL is not set. Remote MCP agent routing will fail.")
    if not ELASTIC_KIBANA_URL:
        print("[WARNING] ELASTIC_KIBANA_URL is not set.")
