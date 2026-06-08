import json

transcript_path = r"C:\Users\ellab\.gemini\antigravity-ide\brain\4a224337-a7e6-41d3-b716-45bc53e2d418\.system_generated\logs\transcript.jsonl"
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        if '"step_index":409' in line:
            print("Found step 409!")
            data = json.loads(line)
            print(data.get('content', ''))
            print("---")
            if 'tool_calls' in data:
                print(data['tool_calls'])
