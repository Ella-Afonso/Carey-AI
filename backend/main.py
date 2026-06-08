from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes.tools import router as tools_router
from mcp_config import validate_mcp_config
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

app = FastAPI(title="Caregiver AI Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://10.130.231.6:3000",
        "http://10.130.231.6:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

validate_mcp_config()

# Mount the new discrete tools & agent
from routes.tools import router as tools_router
from routes.agent import router as agent_router

app.include_router(tools_router)
app.include_router(agent_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Caregiver AI Agent Backend"}

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
            twiml='<Response><Say voice="Polly.Amy">Emergency Alert. The Caregiver A. I. has detected an acute escalation for the patient. Please review the patient logs immediately.</Say></Response>',
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
