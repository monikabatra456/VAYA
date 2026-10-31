import json

with open(r'C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    data = json.loads(line)
    if data.get('source') == 'USER_EXPLICIT':
        print("FOUND USER MESSAGE:")
        print("step_index:", data.get('step_index'))
        print("content:", data.get('content'))
        print("media:", data.get('media'))
        break

