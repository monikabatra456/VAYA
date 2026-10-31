# scratch/inspect_step_4425.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 4410 and i <= 4445:
            data = json.loads(line)
            calls = data.get('tool_calls', [])
            for c in calls:
                if c.get('name') in ['run_command']:
                    cmd = c.get('args', {}).get('CommandLine', '')
                    sys.stdout.buffer.write(f"Line {i} cmd: {cmd[:150]}\n".encode('utf-8'))

