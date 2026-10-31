# scratch/reconstruct_baked.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in [4472, 5042]:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                content = c.get('args', {}).get('Content', '')
                if content:
                    print(f"Found content in step {i}, length: {len(content)}")
                    with open('scratch/build_baked_earth.py', 'w', encoding='utf-8') as out:
                        out.write(content)
                    print("Wrote to scratch/build_baked_earth.py successfully!")
                    break

