# scratch/find_img_good_setup.py
with open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f):
        if 'wonder_world_1920x1080_idle.png' in line:
            print(f"Mentioned in line {line_num}")

