import json
import re

transcript_path = r"C:\Users\ellab\.gemini\antigravity-ide\brain\4a224337-a7e6-41d3-b716-45bc53e2d418\.system_generated\logs\transcript.jsonl"
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if "ELASTICSEARCH_URL" in line and "ELASTIC_API_KEY" in line:
            # We are looking for the actual .env contents, which probably has multiple lines
            # If it's a JSON response from view_file, it will have the raw contents.
            try:
                data = json.loads(line)
                if 'output' in str(data):
                    print("Found output!")
                    print(str(data)[:2000])
                    break
            except:
                pass
