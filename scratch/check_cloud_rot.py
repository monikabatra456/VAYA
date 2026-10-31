# scratch/check_cloud_rot.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 4308:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                content = c.get('args', {}).get('Content', '')
                print("cloudMesh.rotation in 4308:", 'cloudMesh.rotation' in content)
                print("cloudShadowMesh.rotation in 4308:", 'cloudShadowMesh.rotation' in content)

