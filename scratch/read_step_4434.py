# scratch/read_step_4434.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        step = obj.get('step_index', 0)
        if step == 4444: # around read_file of WonderWorld lines 725-850
            c = obj.get('content', '')
            print(c)
            break
