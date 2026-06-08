import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Read GCP environment variables
project = os.getenv("GOOGLE_CLOUD_PROJECT")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "global")

# Print helpful configuration message
print("==================================================")
print("  Caregiver AI Agent: Gemini ADC Connectivity Test ")
print("==================================================")

if not project:
    print("\n[ERROR] GOOGLE_CLOUD_PROJECT is missing from the environment/env variables!")
    print("Please set it in your .env file or shell:")
    print("  GOOGLE_CLOUD_PROJECT=your-gcp-project-id\n")
    print("Make sure you are authenticated with Google Cloud via Application Default Credentials:")
    print("  gcloud auth application-default login\n")
    sys.exit(1)

print(f"GCP Project:  {project}")
print(f"GCP Location: {location}")
print("Initializing google-genai client with vertexai=True...")

try:
    from google import genai
    
    # Initialize the client for Vertex AI using ADC
    client = genai.Client(vertexai=True, project=project, location=location)
    
    prompt = "Reply with exactly this sentence: Gemini ADC connection works for the caregiver agent."
    print(f"Sending prompt to model 'gemini-3.5-flash'...")
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt
    )
    
    print("\n[SUCCESS] Response received from Gemini:")
    print(f"--------------------------------------------------")
    print(response.text)
    print(f"--------------------------------------------------")
except ImportError:
    print("\n[ERROR] Could not import google-genai package.")
    print("Please run: pip install google-genai python-dotenv")
    sys.exit(1)
except Exception as e:
    print("\n[FAILURE] Connection to Gemini failed.")
    print(f"Details: {e}")
    print("\nTroubleshooting tips:")
    print("1. Run: gcloud auth application-default login")
    print("2. Ensure your GCP project has the Vertex AI API enabled.")
    print("3. Check if your ADC has access to project: " + project)
    sys.exit(1)
