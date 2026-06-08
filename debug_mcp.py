import asyncio
import json
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from agent.mcp_client import run_mcp_subprocess

async def run():
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'}
    res, err = await run_mcp_subprocess(payload)
    print("RES:", res)
    print("ERR:", err)

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
asyncio.run(run())
