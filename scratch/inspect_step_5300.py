# scratch/inspect_step_5300.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 5280 and i <= 5303:
            data = json.loads(line)
            calls = data.get('tool_calls', [])
            for c in calls:
                sys.stdout.buffer.write(f"Step {i}: {c.get('name')}\n".encode('utf-8'))
                for k, v in c.get('args', {}).items():
                    if k in ['Path', 'CommandLine']:
                        sys.stdout.buffer.write(f"  {k}: {v}\n".encode('utf-8'))
                    elif k in ['Target', 'Replacement']:
                        sys.stdout.buffer.write(f"  {k}: {v[:100]}...\n".encode('utf-8'))

