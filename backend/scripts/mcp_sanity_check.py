import asyncio
import os
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

# Utility to mask API key in logs
def mask_key(key: str) -> str:
    if not key or len(key) < 10: return "***"
    return f"{key[:4]}...{key[-4:]}"

async def run_sanity_check():
    mcp_url = os.getenv("ELASTIC_MCP_URL", "http://localhost:3000") # Replace with real URL in .env
    api_key = os.getenv("ELASTIC_API_KEY", "")
    
    print("=== Elastic MCP Remote Sanity Check ===")
    print(f"Target URL: {mcp_url}")
    print(f"Auth Key Status: {'Found' if api_key else 'MISSING'} (Masked: {mask_key(api_key)})")

    if not api_key:
        print("CRITICAL: ELASTIC_API_KEY is not set. Exiting.")
        return

    # Prepare subprocess parameters pointing exactly at npx -y mcp-remote
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "mcp-remote", mcp_url],
        env={**os.environ, "Authorization": f"ApiKey {api_key}"}
    )

    print("\n[1/3] Initializing npx subprocess & stdio transport...")
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                print("[2/3] Authenticated session established. Initializing tools...")
                await session.initialize()
                
                # Fetch Tools
                tools_response = await session.list_tools()
                print(f"\n[SUCCESS] Retrieved {len(tools_response.tools)} tools from remote Server:")
                for tool in tools_response.tools:
                    print(f" - {tool.name}: {tool.description[:60]}...")

                # Test Call Execution (Sandbox payload)
                print("\n[3/3] Executing test query against test-index...")
                try:
                    # Replace 'search_patient_history' with your exact actual tool name
                    result = await session.call_tool(
                        name="search_patient_history", 
                        arguments={"query": "confusion afternoon", "index": "test-index"}
                    )
                    print(f"[SUCCESS] Tool Execution Returned: {str(result)[:200]}...")
                except Exception as tool_e:
                    print(f"[HTTP/EXECUTION ERROR] Tool call failed. Remote managed-LLM code surfaced:")
                    print(str(tool_e))

    except Exception as e:
        print("\n[FATAL ERROR] Network fault or Authentication Rejection (e.g. 401/403):")
        print(str(e))

if __name__ == "__main__":
    # Apply global timeout so hackathon runners never freeze
    try:
        asyncio.run(asyncio.wait_for(run_sanity_check(), timeout=15.0))
    except asyncio.TimeoutError:
        print("\n[FATAL ERROR] Subprocess timed out. npx hung or the server is unresponsive.")
