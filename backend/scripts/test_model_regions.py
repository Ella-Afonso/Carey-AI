import os
import sys
from dotenv import load_dotenv

load_dotenv()

project = os.getenv("GOOGLE_CLOUD_PROJECT")
regions = ["us-central1", "europe-west2", "europe-west3", "us-east4"]
models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-3"]

print(f"GCP Project: {project}")

from google import genai

for region in regions:
    print(f"\n--- Testing region: {region} ---")
    try:
        client = genai.Client(vertexai=True, project=project, location=region)
        for model in models:
            try:
                print(f"Trying model: {model}...")
                response = client.models.generate_content(
                    model=model,
                    contents="Say hello"
                )
                print(f"[SUCCESS] Region {region} + Model {model} worked! Response: {response.text.strip()}")
                sys.exit(0)
            except Exception as e:
                print(f"  Failed for model {model}: {e}")
    except Exception as e:
        print(f"  Failed to initialize client for region {region}: {e}")
