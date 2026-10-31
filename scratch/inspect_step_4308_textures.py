# scratch/inspect_step_4308_textures.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 4308:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                content = c.get('args', {}).get('Content', '')
                idx1 = content.find('const texLoader = new THREE.TextureLoader();')
                idx2 = content.find('const earthMesh = new THREE.Mesh')
                snippet = content[idx1:idx2]
                sys.stdout.buffer.write(snippet.encode('utf-8'))

