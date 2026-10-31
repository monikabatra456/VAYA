# scratch/search_exact_step.py
import json

with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        step = obj.get('step_index', 0)
        # Search steps around 3500-4300 where WonderWorld was edited
        if 3500 <= step <= 4300:
            tc = obj.get('tool_calls', [])
            for call in tc:
                if call.get('name') == 'edit_file' and 'WonderWorld.tsx' in call.get('args', {}).get('Path', ''):
                    print(f"--- Step {step} edited WonderWorld.tsx ---")
                    repl = call['args'].get('Replacement', '')
                    if 'AmbientLight' in repl or 'earthMat' in repl or 'rimGeo' in repl:
                        print(repl[:1200])
                        print("=" * 60)
