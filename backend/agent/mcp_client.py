import os
import asyncio
import json
import time
from dotenv import load_dotenv
from agent import elastic_client

load_dotenv()
ELASTIC_MCP_URL = os.getenv("ELASTIC_MCP_URL")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")

GUIDANCE_ENRICH_LIMIT = 3
MCP_CALL_TIMEOUT = 10

_doc_cache = {}

async def run_mcp_subprocess(payload: dict, timeout: int = 15):
    """Executes the MCP node subprocess with strict timeouts to prevent zombie processes."""
    if not ELASTIC_MCP_URL or not ELASTIC_API_KEY:
        return None, "Missing MCP URL or API Key."

    cmd = f'npx -y mcp-remote {ELASTIC_MCP_URL} --header "Authorization:ApiKey {ELASTIC_API_KEY}"'
    
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        proc.stdin.write((json.dumps(payload) + "\n").encode())
        await proc.stdin.drain()

        # Read stdout line by line to get the JSON response without closing stdin
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
        return None, "MCP execution failed to return JSON."
        
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except:
            pass
        return None, "MCP subprocess timed out."
    except Exception as e:
        return None, f"Execution failed: {str(e)}"

def enrich_results(tool_name: str, raw_results: list) -> list:
    """THE FIX: Retrieves beautiful citation metadata for opaque IDs returned by MCP."""
    enriched = []
    for item in raw_results:
        doc_id = item.get("id") or item.get("_id") or item.get("doc_id")
        
        if tool_name == "search_general_guidance" and doc_id:
            try:
                es_doc = elastic_client.es.get(index="dementia_kb", id=doc_id)["_source"]
                enriched.append({
                    "doc_id": doc_id,
                    "title": es_doc.get("title", "Guidance Document"),
                    "content": item.get("snippet", es_doc.get("content")),
                    "source": es_doc.get("source", "NHS/NICE"),
                    "url": es_doc.get("url", "#"),
                    "score": item.get("score")
                })
            except:
                enriched.append(item) 
        
        elif tool_name == "search_patient_history" and doc_id:
            try:
                es_doc = elastic_client.es.get(index="patient_log", id=doc_id)["_source"]
                enriched.append({
                    "entry_id": doc_id,
                    "timestamp": es_doc.get("timestamp"),
                    "time_of_day": es_doc.get("time_of_day"),
                    "raw_note": item.get("snippet", es_doc.get("raw_note")),
                    "behaviour_tags": es_doc.get("behaviour_tags"),
                    "severity": es_doc.get("severity")
                })
            except:
                enriched.append(item)
        else:
            enriched.append(item)
            
    return enriched

def _extract_full_document(raw_response):
    if not raw_response or not raw_response.get("success"):
        return None
    raw_content = raw_response.get("raw_result", [])
    for c in raw_content:
        if c.get("type") == "text":
            try:
                parsed = json.loads(c.get("text", "{}"))
                return parsed.get("_source") or parsed
            except:
                return None
    return None

def _raw_payload(doc_id):
    return {
        "jsonrpc": "2.0", 
        "id": 99, 
        "method": "tools/call", 
        "params": {"name": "platform_core_get_document_by_id", "arguments": {"id": doc_id, "index": "dementia_kb"}}
    }

async def enrich_guidance_citations(records):
    to_enrich = records[:GUIDANCE_ENRICH_LIMIT]
    
    async def fetch_doc(record):
        doc_id = record.get("id") or record.get("_id") or record.get("doc_id")
        if not doc_id:
            return record
            
        if doc_id in _doc_cache:
            record.update(_doc_cache[doc_id])
            return record
            
        max_retries = 2
        for attempt in range(max_retries):
            try:
                res, err = await run_mcp_subprocess(_raw_payload(doc_id), timeout=MCP_CALL_TIMEOUT)
                if not err and res:
                    content = res.get("result", {}).get("content", [])
                    for c in content:
                        if c.get("type") == "text":
                            try:
                                parsed = json.loads(c.get("text", "{}"))
                                es_doc = parsed.get("_source") or parsed
                                if es_doc:
                                    enrichment_data = {
                                        "title": es_doc.get("title", "Guidance Document"),
                                        "source": es_doc.get("source", "NHS/NICE"),
                                        "url": es_doc.get("url", "#"),
                                        "licence": es_doc.get("licence", "Unknown"),
                                        "topic_tags": es_doc.get("topic_tags", []),
                                        "citation_enriched": True
                                    }
                                    if enrichment_data.get("source") and enrichment_data.get("url"):
                                        _doc_cache[doc_id] = enrichment_data
                                        record.update(enrichment_data)
                                        return record
                            except:
                                pass
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                return record
            except Exception:
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                return record
        return record
            
    tasks = [fetch_doc(r) for r in to_enrich]
    enriched = await asyncio.gather(*tasks)
    return [e for e in enriched if e is not None and e.get("source") and e.get("url")]


async def list_tools():
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    res, err = await run_mcp_subprocess(payload, timeout=10)
    if err:
        return [], False, err
    return res.get("result", {}).get("tools", []), True, None

async def call_tool(tool_name: str, arguments: dict):
    start_time = time.time()
    payload = {
        "jsonrpc": "2.0", 
        "id": 2, 
        "method": "tools/call", 
        "params": {"name": tool_name, "arguments": arguments}
    }
    
    res, err = await run_mcp_subprocess(payload, timeout=20)
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

    response_obj["called_via_mcp"] = True
    response_obj["success"] = True
    
    raw_content = res.get("result", {}).get("content", [])
    response_obj["raw_result"] = raw_content
    
    if raw_content and isinstance(raw_content, list):
        parsed = []
        for c in raw_content:
            if c.get("type") == "text":
                try:
                    parsed.extend(json.loads(c.get("text", "[]")))
                except:
                    pass
                    
        if tool_name == "search_general_guidance" and response_obj["called_via_mcp"]:
            response_obj["normalised_results"] = enrich_results(tool_name, parsed)
        else:
            response_obj["normalised_results"] = enrich_results(tool_name, parsed)

    return response_obj
