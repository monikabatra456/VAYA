# scratch/find_exact_commit.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'wonder_alpine_1920x1080' in line:
            print(f"Step {i}:")
            data = json.loads(line)
            print("created_at:", data.get('created_at'))
            print("source:", data.get('source'))
            print("type:", data.get('type'))

