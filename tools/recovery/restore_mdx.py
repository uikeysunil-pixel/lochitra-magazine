import json
import os

transcript_path = r'C:\Users\uikey\.gemini\antigravity-ide\brain\ba661a02-424e-4cc0-8c89-e9913f83bbdf\.system_generated\logs\transcript_full.jsonl'
blog_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog'

file_contents = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        for tc in data.get('tool_calls', []):
            if tc.get('name') == 'default_api:write_to_file' or tc.get('name') == 'default_api:replace_file_content':
                args = tc.get('args', {})
                target = args.get('TargetFile', '')
                if target.endswith('.mdx'):
                    basename = os.path.basename(target)
                    if 'CodeContent' in args:
                        file_contents[basename] = args['CodeContent']
                    elif 'ReplacementContent' in args:
                        # Too complex to reconstruct replace_file_content right now, we just want the initial write
                        pass

for basename, content in file_contents.items():
    if not content: continue
    path = os.path.join(blog_dir, basename)
    # Check if file is empty
    if os.path.exists(path) and os.path.getsize(path) == 0:
        with open(path, 'w', encoding='utf-8', newline='\n') as out:
            out.write(content.replace('\r\n', '\n'))
        print(f"Restored {basename}")
