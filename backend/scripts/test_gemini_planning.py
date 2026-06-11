import os
import sys
from dotenv import load_dotenv
from google import genai

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_adc():
    load_dotenv()
    print("=== GEMINI ADC VERTEX TEST ===")
    
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION")
    model_id = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    
    if not project or not location:
        print("FAIL: Missing GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION in .env")
        return

    try:
        # Vertex ADC initialization (No API Key)
        client = genai.Client(vertexai=True, project=project, location=location)
        response = client.models.generate_content(
            model=model_id,
            contents="Reply with exactly: Gemini ADC works"
        )
        print(f"PASS. Response received: {response.text}")
    except Exception as e:
        print(f"FAIL: Authentication or routing error: {str(e)}")

if __name__ == "__main__":
    test_adc()
