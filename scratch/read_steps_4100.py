# scratch/read_steps_4100.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        step = obj.get('step_index', 0)
        if step in [4102, 4147, 4153, 4197, 4220]:
            tc = obj.get('tool_calls', [])
            for call in tc:
                if call.get('name') == 'edit_file':
                    print(f"=== Step {step} ===")
                    print(call['args'].get('Replacement', '')[:1000])
                    print("="*60)
