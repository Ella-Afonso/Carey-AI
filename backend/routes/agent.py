from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from agent import agent

router = APIRouter(prefix="/api", tags=["Agent"])

class AgentRequest(BaseModel):
    patient_id: str = "demo-patient-001"
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
