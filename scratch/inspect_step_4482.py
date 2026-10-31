# scratch/inspect_step_4482.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 4482:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                print("TARGET:", c.get('args', {}).get('Target', ''))
                print("="*40)
                print("REPLACEMENT:", c.get('args', {}).get('Replacement', ''))

