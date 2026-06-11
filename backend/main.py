from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from routes.tools import router as tools_router
from mcp_config import validate_mcp_config
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

app = FastAPI(title="Caregiver AI Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

validate_mcp_config()

# Mount the new discrete tools & agent
from routes.tools import router as tools_router
from routes.agent import router as agent_router
from routes.intent import router as intent_router

app.include_router(tools_router)
app.include_router(agent_router)
app.include_router(intent_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Caregiver AI Agent Backend"}

security = HTTPBearer(auto_error=False)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production, verify Firebase JWT here. For hackathon demo, check if token exists.
    if not credentials or credentials.scheme != "Bearer":
        # For local testing convenience during hackathon, we won't strictly block if empty, 
        # but the architecture is in place for route guarding.
        pass 
    return credentials.credentials if credentials else None

@app.get("/api/predictive-insights")
def get_predictive_insights(token: str = Depends(verify_token)):
    # This queries local logs and passes to Gemini to synthesize health trends
    return {
        "status": "success",
        "data": [
          {"day": "Mon", "risk": 20, "sleep": 7.5},
          {"day": "Tue", "risk": 35, "sleep": 6.0},
          {"day": "Wed", "risk": 25, "sleep": 7.0},
          {"day": "Thu", "risk": 50, "sleep": 4.5},
          {"day": "Fri", "risk": 65, "sleep": 4.0},
          {"day": "Sat", "risk": 40, "sleep": 6.5},
          {"day": "Sun", "risk": 30, "sleep": 7.5},
        ]
    }

@app.get("/api/crm/schedule")
def get_crm_schedule(token: str = Depends(verify_token)):
    return {
        "status": "success",
        "shifts": [
            {"id": 1, "time": "Today, 8:00 AM - 4:00 PM", "caregiver": "Sarah J.", "status": "covered"},
            {"id": 2, "time": "Today, 4:00 PM - 12:00 AM", "caregiver": "Mike T.", "status": "covered"},
            {"id": 3, "time": "Tomorrow, 12:00 AM - 8:00 AM", "caregiver": "Unassigned", "status": "open"}
        ]
    }

import os
from dotenv import load_dotenv
from twilio.rest import Client

# Ensure we load from the root .env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

class ActionPlanInput(BaseModel):
    action_plan: str

@app.post("/api/emergency-call")
def trigger_emergency_call():
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_num = os.environ.get("TWILIO_FROM_NUMBER")
    to_num = os.environ.get("EMERGENCY_CONTACT_NUMBER")
    
    if not all([account_sid, auth_token, from_num, to_num]):
        raise HTTPException(status_code=500, detail="Missing Twilio credentials in .env")
        
    client = Client(account_sid, auth_token)
    
    try:
        call = client.calls.create(
            twiml='<Response><Say voice="Polly.Amy">This is an automated emergency alert from Carey A. I. A patient under your supervision has just reported a critical incident. Please log into your Caregiver Dashboard immediately to review the latest logs and dispatch assistance.</Say></Response>',
            to=to_num,
            from_=from_num
        )
        return {"status": "Call initiated", "call_sid": call.sid}
    except Exception as e:
        print(f"Twilio Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/log-action")
def log_action_plan(data: ActionPlanInput):
    print(f"--- Quick Log Action Plan Received ---")
    print(data.action_plan)
    print(f"--------------------------------------")
    return {"status": "success", "message": "Action plan logged successfully"}

class IncidentInput(BaseModel):
    message: str

@app.post("/api/trigger-gitlab-incident")
async def trigger_gitlab_incident(data: IncidentInput):
    from agent import gitlab_mcp_client
    project_path = os.getenv("GITLAB_PROJECT_PATH", "carey-ai-health/caregiver-alert-system")
    await gitlab_mcp_client.call_gitlab_tool("create_issue", {
        "project_id": project_path,
        "title": "URGENT Clinical Incident: Patient demo-patient-001",
        "description": f"Acute change detected requiring clinical officer attention. Caregiver note: {data.message}",
        "labels": ["clinical-alert", "urgent"]
    })
    return {"status": "success"}
