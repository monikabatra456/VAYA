# scratch/search_lights_history.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 3500 and i <= 4410:
            if 'ambientLight' in line:
                data = json.loads(line)
                calls = data.get('tool_calls', [])
                for c in calls:
                    if c.get('name') in ['edit_file', 'write_file'] and 'WonderWorld.tsx' in c.get('args', {}).get('Path', ''):
                        print(f"Step {i}:")
                        print("TARGET:", c.get('args', {}).get('Target', ''))
                        print("REPLACEMENT:", c.get('args', {}).get('Replacement', ''))
                        print("="*50)

