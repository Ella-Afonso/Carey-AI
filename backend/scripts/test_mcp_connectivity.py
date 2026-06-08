import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.mcp_client import list_tools

async def test_mcp():
    print("=== ELASTIC MCP CONNECTIVITY TEST ===")
    try:
        tools, success, error = await list_tools()
        if success:
            print("PASS: MCP connection works.")
            tool_names = [t.get("name") for t in tools]
            print(f"Available Tools: {tool_names}")
            
            if "search_general_guidance" in tool_names:
                print("PASS: search_general_guidance is visible through MCP")
            else:
                print("FAIL: search_general_guidance missing from MCP")
                
            if "search_patient_history" in tool_names:
                print("PASS: search_patient_history is visible through MCP")
            else:
                print("FAIL: search_patient_history missing from MCP")
        else:
            print(f"FAIL: {error}")
    except Exception as e:
        print(f"FAIL: Critical connection error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_mcp())
