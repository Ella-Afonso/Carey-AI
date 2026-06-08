# Google Cloud ADC Setup
Use these instructions for Google Cloud setup and deployment.

Rules:
* Use Application Default Credentials, ADC, not Gemini API keys.
* Do not add GEMINI_API_KEY.
* Never commit secrets.
* Use GOOGLE_GENAI_USE_VERTEXAI=True.
* Use GOOGLE_CLOUD_PROJECT.
* Use GOOGLE_CLOUD_LOCATION=global.
* Use GCP_REGION=europe-west2.
* Prefer Cloud Run over VMs, Kubernetes, or Compute Engine for hackathon speed.
* When writing terminal commands for this user, use Windows PowerShell syntax.
