import os
import sys
from dotenv import load_dotenv

load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
regions = ["us-central1", "us-east4", "europe-west1", "europe-west2", "europe-west3", "global"]
model = "gemini-3.5-flash"

print(f"GCP Project: {project}")

from google import genai

for region in regions:
    print(f"\n--- Testing region {region} for model {model} ---")
    try:
        client = genai.Client(vertexai=True, project=project, location=region)
        response = client.models.generate_content(
            model=model,
            contents="Say hello"
        )
        print(f"[SUCCESS] Region {region} + Model {model} worked! Response: {response.text.strip()}")
        sys.exit(0)
    except Exception as e:
        print(f"  Failed for model {model}: {e}")

print("All regions failed for gemini-3.5-flash")
