# scratch/find_earlier_lighting.py
with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        if line_num in [3740, 3994]:
            print(f"=== Line {line_num} ===")
            for word in ['ambientLight', 'sunLight', 'rimMat', 'earthMat']:
                idx = line.find(word)
                if idx != -1:
                    print(f"[{word}]:", line[max(0, idx-50):min(len(line), idx+250)])
                    print("-"*40)
