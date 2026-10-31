# scratch/inspect_step_4308_earthsrc.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i == 4308:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                content = c.get('args', {}).get('Content', '')
                idx1 = content.find('earthSrc')
                snippet = content[idx1-100:idx1+200]
                sys.stdout.buffer.write(snippet.encode('utf-8'))

