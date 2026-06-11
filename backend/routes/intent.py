from fastapi import APIRouter
from pydantic import BaseModel
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class IntentRequest(BaseModel):
    message: str

@router.post("/analyze-intent")
async def analyze_intent(req: IntentRequest):
    try:
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION")
        model_id = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        client = genai.Client(vertexai=True, project=project, location=location)
        
        prompt = f"""
        Analyze the following message from a senior citizen to their care companion AI.
        Does the message imply physical distress, falling, severe pain, severe confusion, a medical emergency, fear, or trouble swallowing/choking?
        Message: "{req.message}"
        
        Respond ONLY with a valid JSON object containing a single boolean key 'is_distress':
        {{"is_distress": true}} or {{"is_distress": false}}
        """
        response = client.models.generate_content(model=model_id, contents=prompt)
        text = response.text.strip().lower()
        is_distress = "true" in text
        return {"is_distress": is_distress}
    except Exception as e:
        print(f"Error analyzing intent: {e}")
        return {"is_distress": False}
