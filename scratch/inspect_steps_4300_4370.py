# scratch/inspect_steps_4300_4370.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 4300 and i <= 4370:
            data = json.loads(line)
            calls = data.get('tool_calls', [])
            for c in calls:
                print(f"Step {i}: {c.get('name')}")
                cmd = c.get('args', {}).get('CommandLine', '')
                if cmd:
                    print("CMD:", cmd[:150])
                path = c.get('args', {}).get('Path', '')
                if path:
                    print("PATH:", path)

