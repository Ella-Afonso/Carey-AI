import json

transcript_path = r"C:\Users\ellab\.gemini\antigravity-ide\brain\4a224337-a7e6-41d3-b716-45bc53e2d418\.system_generated\logs\transcript.jsonl"
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if "ELASTICSEARCH_URL" in line:
            print(line[:1500])
