import json, os, glob
for t in glob.glob(r'C:\Users\uikey\.gemini\antigravity-ide\brain\*\.system_generated\logs\transcript_full.jsonl'):
    try:
        lines = open(t, 'r', encoding='utf-8').readlines()
        for idx, line in enumerate(lines):
            if 'luma-dream-machine-review' in line.lower() or 'luma dream machine review' in line.lower():
                try:
                    data = json.loads(line)
                    c = data.get('content', '')
                    if len(c) > 4000:
                        print(f"Session {os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(t))))} - Line {idx}: Content len {len(c)}")
                except:
                    pass
    except:
        pass
