from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from agent import elastic_client
from datetime import datetime, timezone

router = APIRouter(prefix="/tools", tags=["Agent Tools"])

class GuidanceQuery(BaseModel):
    query: str
    top_k: int = 3

class PatientHistoryQuery(BaseModel):
    patient_id: str
    query: str
    time_of_day: Optional[str] = None
    since_days: Optional[int] = None
    top_k: int = 5

class ObservationLog(BaseModel):
    patient_id: str
    raw_note: str
    behaviour_tags: List[str]
    severity: int
    timestamp: Optional[str] = None

class SummaryRequest(BaseModel):
    patient_id: str
    since_days: int = 30

@router.post("/search_general_guidance")
def api_search_guidance(req: GuidanceQuery):
    try:
        results = elastic_client.search_general_guidance(req.query, req.top_k)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search_patient_history")
def api_search_patient_history(req: PatientHistoryQuery):
    try:
        results = elastic_client.search_patient_history(req.patient_id, req.query, req.time_of_day, req.since_days, req.top_k)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/log_new_observation")
def api_log_observation(req: ObservationLog):
    try:
        res = elastic_client.log_new_observation(req.patient_id, req.raw_note, req.behaviour_tags, req.severity, req.timestamp)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_clinician_summary")
def api_generate_summary(req: SummaryRequest):
    try:
        res = elastic_client.generate_clinician_summary(req.patient_id, req.since_days)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

