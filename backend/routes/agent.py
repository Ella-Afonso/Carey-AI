from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from agent import agent

router = APIRouter(prefix="/api", tags=["Agent"])

class AgentRequest(BaseModel):
    patient_id: str = "demo-patient-001"
    message: str

class SeniorAgentRequest(BaseModel):
    message: str

class EscalationResultModel(BaseModel):
    escalation_level: str
    pattern_type: str
    reasons: List[str]
    grounded_in: List[str]
    requires_clinician_message: bool
    ui_label: str
    confidence_basis: str

class AgentResponse(BaseModel):
    answer: str
    trace: List[Dict[str, Any]]
    tool_call_counts: Dict[str, int]
    mcp_gate_verified: bool
    planner_mode: str
    escalation: EscalationResultModel
    safety_floor_applied: bool
    safety_floor_evidence_counts: Dict[str, int]

@router.post("/caregiver-agent", response_model=AgentResponse)
async def api_run_agent(req: AgentRequest):
    return await agent.run_agent(req.message, req.patient_id)

@router.post("/senior-agent")
async def api_senior_agent(req: SeniorAgentRequest):
    import os
    from google import genai
    from fastapi.responses import StreamingResponse
    
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION")
    model_id = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    
    client = genai.Client(vertexai=True, project=project, location=location)
    
    system_prompt = """You are Carey, a compassionate, warm, and gentle AI companion for a senior citizen.
Your user may have early-stage dementia or simply be lonely. 
Always be extremely kind, patient, reassuring, and validating.
Keep your answers brief (1-3 sentences).
If they express distress, fear, or confusion, validate their feelings and gently offer to play music, reminisce, or help them call their caregiver.
Never argue or correct them aggressively."""

    response = await client.aio.models.generate_content_stream(
        model=model_id,
        contents=f"{system_prompt}\n\nUSER MESSAGE: {req.message}",
    )
    
    async def generate():
        async for chunk in response:
            yield chunk.text

    return StreamingResponse(generate(), media_type="text/plain")
