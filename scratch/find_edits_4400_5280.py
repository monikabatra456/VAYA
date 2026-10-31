# scratch/find_edits_4400_5280.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 4400 and i <= 5280:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                name = c.get('name')
                path = c.get('args', {}).get('Path', '')
                cmd = c.get('args', {}).get('CommandLine', '')
                if 'WonderWorld' in path or 'wonder.css' in path or 'build_' in path or 'build_' in cmd:
                    sys.stdout.buffer.write(f"Step {i} ({name}): path={path} cmd={cmd[:80]}\n".encode('utf-8'))

