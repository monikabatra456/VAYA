# scratch/read_lines_3740.py
with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        if line_num == 3740:
            idx = line.find('earthGeo')
            print(line[idx:idx+800])
            break
