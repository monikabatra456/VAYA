# scratch/inspect_step_4372.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 4365 and i <= 4415:
            data = json.loads(line)
            calls = data.get('tool_calls', [])
            for c in calls:
                if c.get('name') in ['edit_file', 'write_file']:
                    path = c.get('args', {}).get('Path', '')
                    if 'WonderWorld.tsx' in path:
                        sys.stdout.buffer.write(f"Line {i} tool: {c.get('name')}\n".encode('utf-8'))
                        tgt = c.get('args', {}).get('Target', '')
                        repl = c.get('args', {}).get('Replacement', '')
                        sys.stdout.buffer.write(b"TARGET:\n" + tgt.encode('utf-8', 'replace') + b"\n")
                        sys.stdout.buffer.write(b"REPLACEMENT:\n" + repl.encode('utf-8', 'replace') + b"\n")
                        sys.stdout.buffer.write(b"="*40 + b"\n")
