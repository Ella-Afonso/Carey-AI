import os
import sys
from dotenv import load_dotenv

load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
region = "us-central1"
# Test standard version formats for Gemini 3 line
models = [
    "gemini-3.5-flash",
    "gemini-3.5-pro",
    "gemini-3.1-pro",
    "gemini-3.1-flash",
    "gemini-3.0-pro",
    "gemini-3.0-flash",
    "gemini-3-pro",
    "gemini-3-flash",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview"
]

print(f"GCP Project: {project}")

from google import genai

client = genai.Client(vertexai=True, project=project, location=region)

for model in models:
    try:
        print(f"Trying model '{model}' in {region}...")
        response = client.models.generate_content(
            model=model,
            contents="Say hello"
        )
        print(f"[SUCCESS] Model {model} worked! Response: {response.text.strip()}")
        sys.exit(0)
    except Exception as e:
        print(f"  Failed for model {model}: {e}")

print("All Gemini 3 model strings failed.")
