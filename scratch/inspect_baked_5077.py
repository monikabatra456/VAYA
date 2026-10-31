# scratch/inspect_baked_5077.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in [5075, 5077]:
            data = json.loads(line)
            # check content
            print(f"=== STEP {i} ===")
            content = data.get('content', '')
            print(content[:1500])

