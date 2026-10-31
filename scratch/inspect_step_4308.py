# scratch/inspect_step_4308.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 4308:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                content = c.get('args', {}).get('Content', '')
                print("Length of content:", len(content))
                idx = content.find('earthMat')
                print("idx of earthMat:", idx)
                if idx != -1:
                    print(content[idx-100:idx+800])
