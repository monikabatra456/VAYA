# scratch/inspect_three_5292.py
import json, sys

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i in range(5085, 5295):
        line = f.readline() # we can seek or iterate
        # let's iterate properly

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in [5089, 5093]:
            data = json.loads(line)
            for c in data.get('tool_calls', []):
                sys.stdout.buffer.write(f"=== STEP {i} ===\n".encode('utf-8'))
                tgt = c.get('args', {}).get('Target', '')
                repl = c.get('args', {}).get('Replacement', '')
                sys.stdout.buffer.write(b"TARGET:\n" + tgt.encode('utf-8', 'replace') + b"\n")
                sys.stdout.buffer.write(b"REPLACEMENT:\n" + repl.encode('utf-8', 'replace') + b"\n")

