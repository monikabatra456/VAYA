# scratch/find_texture_source.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 3500 and i <= 4410:
            if 'earth' in line and ('.jpg' in line or '.png' in line or '.webp' in line):
                data = json.loads(line)
                calls = data.get('tool_calls', [])
                for c in calls:
                    cmd = c.get('args', {}).get('CommandLine', '')
                    path = c.get('args', {}).get('Path', '')
                    if 'earth' in cmd or 'earth' in path:
                        print(f"Step {i} ({c.get('name')}): {cmd or path}")

