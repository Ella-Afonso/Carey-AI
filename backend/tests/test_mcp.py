from agent.mcp_client import list_tools

async def test_mcp_connectivity():
    tools, success, error = await list_tools()
    assert success is True, f"MCP connection failed: {error}"
    
    tool_names = [t.get("name") for t in tools]
    assert "search_general_guidance" in tool_names, "search_general_guidance missing from MCP tools"
    assert "search_patient_history" in tool_names, "search_patient_history missing from MCP tools"
