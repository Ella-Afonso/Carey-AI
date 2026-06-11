import os
import asyncio
import json
import time
from dotenv import load_dotenv

load_dotenv()
GITLAB_PERSONAL_ACCESS_TOKEN = os.getenv("GITLAB_PERSONAL_ACCESS_TOKEN")
GITLAB_API_URL = os.getenv("GITLAB_API_URL", "https://gitlab.com/api/v4")
GITLAB_PROJECT_PATH = os.getenv("GITLAB_PROJECT_PATH")

MCP_CALL_TIMEOUT = 45

async def run_gitlab_mcp_subprocess(payload: dict, timeout: int = 45):
    """Executes the GitLab MCP node subprocess via stdio."""
    if not GITLAB_PERSONAL_ACCESS_TOKEN:
        return None, "Missing GITLAB_PERSONAL_ACCESS_TOKEN in environment."

    # Copy env to pass to subprocess
    env = os.environ.copy()
    env["GITLAB_PERSONAL_ACCESS_TOKEN"] = GITLAB_PERSONAL_ACCESS_TOKEN
    env["GITLAB_API_URL"] = GITLAB_API_URL

    cmd = "npx -y @modelcontextprotocol/server-gitlab"
    
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        
        proc.stdin.write((json.dumps(payload) + "\n").encode())
        await proc.stdin.drain()

        # Read stdout line by line to get the JSON response
        while True:
            line = await asyncio.wait_for(proc.stdout.readline(), timeout=timeout)
            if not line:
                break
            line_str = line.decode().strip()
            if line_str.startswith("{"):
                try:
                    proc.kill()
                except:
                    pass
                return json.loads(line_str), None
                
        try:
            proc.kill()
        except:
            pass
        return None, "GitLab MCP execution failed to return JSON."
        
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except:
            pass
        return None, "GitLab MCP subprocess timed out."
    except Exception as e:
        return None, f"Execution failed: {str(e)}"


async def call_gitlab_tool(tool_name: str, arguments: dict):
    """Call a tool specifically on the GitLab MCP server."""
    start_time = time.time()
    payload = {
        "jsonrpc": "2.0", 
        "id": 1, 
        "method": "tools/call", 
        "params": {"name": tool_name, "arguments": arguments}
    }
    
    res, err = await run_gitlab_mcp_subprocess(payload, timeout=MCP_CALL_TIMEOUT)
    duration_ms = int((time.time() - start_time) * 1000)
    
    response_obj = {
        "tool_name": tool_name,
        "arguments": arguments,
        "raw_result": None,
        "normalised_results": [],
        "called_via_mcp": False,
        "success": False,
        "error": err,
        "duration_ms": duration_ms
    }

    if err:
        return response_obj

    if res.get("error"):
        response_obj["error"] = str(res["error"])
        return response_obj

    response_obj["called_via_mcp"] = True
    response_obj["success"] = True
    
    raw_content = res.get("result", {}).get("content", [])
    response_obj["raw_result"] = raw_content
    
    # Normally we extract text content. For gitlab creating an issue, we just return the link
    results = []
    if raw_content and isinstance(raw_content, list):
        for c in raw_content:
            if c.get("type") == "text":
                results.append({"text": c.get("text")})

    response_obj["normalised_results"] = results
    return response_obj
