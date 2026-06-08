---
name: gcp-deployer
description: >-
  Build and deploy backend and frontend services of Caregiver AI Agent to Google
  Cloud Run.
---

# Google Cloud Run Deployment Skill

## Overview
This skill provides instructions for building Docker containers and deploying the Next.js frontend and FastAPI backend to Google Cloud Run. It enforces the use of Application Default Credentials (ADC) and strictly forbids hardcoded API keys.

## Quick Start
To deploy services:
1.  Authenticate with GCP: `gcloud auth login` and `gcloud auth application-default login`.
2.  Set the active project: `gcloud config set project your-gcp-project-id`.
3.  Build and deploy using Google Cloud Build or local Docker daemon.

## Deployment Workflows

### 1. Build and Deploy Backend
Deploy the FastAPI backend to Cloud Run, passing the necessary environment variables:
```powershell
# Set variables
$PROJECT_ID = "your-gcp-project-id"
$REGION = "europe-west2"

# Deploy to Cloud Run
gcloud run deploy caregiver-backend `
  --source ./backend `
  --region $REGION `
  --project $PROJECT_ID `
  --set-env-vars="GOOGLE_GENAI_USE_VERTEXAI=True,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=global,GCP_REGION=$REGION" `
  --allow-unauthenticated
```

### 2. Build and Deploy Frontend
Deploy the Next.js frontend to Cloud Run:
```powershell
gcloud run deploy caregiver-frontend `
  --source ./frontend `
  --region $REGION `
  --project $PROJECT_ID `
  --allow-unauthenticated
```

## Common Mistakes
*   **Missing Env Vars on Cloud Run**: Ensure that `GOOGLE_GENAI_USE_VERTEXAI=True` and `GOOGLE_CLOUD_PROJECT` are explicitly set in the Cloud Run service environment. If they are missing, Vertex AI calls will fail.
*   **Using GEMINI_API_KEY**: Never add a `GEMINI_API_KEY` env var to Cloud Run or the source repository. Always rely on IAM roles and ADC.
*   **Authentication Mismatches**: Ensure that the Cloud Run service account has the necessary role (`Vertex AI User`) to execute Gemini calls.
