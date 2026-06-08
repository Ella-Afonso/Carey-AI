# Caregiver AI Agent

A bilingual cognitive triage companion for dementia family caregivers. 
Built for the Google Cloud Rapid Agent Hackathon.

## Architecture
Caregiver UI (Next.js) -> FastAPI -> Gemini Planner (via ADC) -> Elastic MCP Server -> Data Indices

## Setup Workflow (Windows PowerShell)
1. **GCP Auth:** `gcloud auth application-default login`
2. **Backend:**
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Frontend:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
