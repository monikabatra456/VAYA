# scratch/find_approved_lights.py
with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        if 'ambientLight' in line and 'sunLight' in line:
            # Let's print occurrences
            print(f"Line {line_num}:")
            # find snippet
            idx = line.find('ambientLight')
            while idx != -1:
                start = max(0, idx - 100)
                end = min(len(line), idx + 400)
                print(line[start:end])
                print("-" * 50)
                idx = line.find('ambientLight', idx + 100)
