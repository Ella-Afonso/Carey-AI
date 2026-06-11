TOOL_SCHEMAS = {
    "search_general_guidance": {
        "description": "Search curated dementia guidance for evidence on a behaviour, symptom, safety concern, or caregiver question. Returns ranked passages with source citations.",
        "inputs": {"query": "string (required)", "top_k": "integer (default 3)"}
    },
    "search_patient_history": {
        "description": "Search the synthetic longitudinal patient history for previous observations matching a caregiver concern. Supports patient ID, time-of-day filtering, and recent-history filtering.",
        "inputs": {"patient_id": "string (required)", "query": "string (required)", "time_of_day": "string (optional)", "since_days": "integer (optional)", "top_k": "integer (default 5)"}
    },
    "log_new_observation": {
        "description": "Write a new structured caregiver observation into the synthetic patient log. This is an action tool.",
        "inputs": {"patient_id": "string (required)", "raw_note": "string (required)", "behaviour_tags": "list of strings (required)", "severity": "integer (required)", "timestamp": "string (optional)"}
    },
    "generate_clinician_summary": {
        "description": "Generate a structured GP-facing summary from recent patient-history entries. The summary is factual, concise, and based only on logged observations.",
        "inputs": {"patient_id": "string (required)", "since_days": "integer (default 30)"}
    },
    "gitlab_create_issue": {
        "description": "Create a new issue in the project GitLab repository.",
        "inputs": {"title": "string (required)", "description": "string (optional)"}
    }
}

MCP_SEARCH_TOOLS = {"search_general_guidance", "search_patient_history"}
LOCAL_ACTION_TOOLS = {"log_new_observation", "generate_clinician_summary"}
GITLAB_TOOLS = {"gitlab_create_issue"}

def get_tool_route(tool_name: str) -> str:
    if tool_name in MCP_SEARCH_TOOLS:
        return "mcp"
    if tool_name in GITLAB_TOOLS:
        return "gitlab"
    if tool_name in LOCAL_ACTION_TOOLS:
        return "local"
    return "unknown"
