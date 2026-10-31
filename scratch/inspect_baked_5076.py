# scratch/inspect_baked_5076.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in [5076, 5078]:
            data = json.loads(line)
            content = data.get('content', '')
            sys.stdout.buffer.write(f"=== STEP {i} ===\n".encode('utf-8'))
            sys.stdout.buffer.write(content[:3000].encode('utf-8', 'replace'))
            sys.stdout.buffer.write(b"\n")

