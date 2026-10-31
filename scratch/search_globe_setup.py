# scratch/search_globe_setup.py
with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        if 'texLoader' in line and 'earthGeo' in line:
            print(f"Found on line {line_num}")
            idx = line.find('const texLoader')
            print(line[idx:idx+1500])
            print("="*60)
