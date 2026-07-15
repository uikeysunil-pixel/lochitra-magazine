import json
import os
import re

transcript_path = r'C:\Users\uikey\.gemini\antigravity-ide\brain\ba661a02-424e-4cc0-8c89-e9913f83bbdf\.system_generated\logs\transcript_full.jsonl'
blog_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog'

file_contents = {}
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        for tc in data.get('tool_calls', []):
            if tc.get('name') in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                args_raw = tc.get('args', {})
                if isinstance(args_raw, str):
                    try:
                        args = json.loads(args_raw)
                    except:
                        args = {}
                else:
                    args = args_raw
                
                target = args.get('TargetFile', '')
                if target:
                    basename = os.path.basename(target)
                    if basename == 'how-to-create-youtube-videos-with-ai.mdx':
                        if 'CodeContent' in args:
                            file_contents[basename] = args['CodeContent']

if 'how-to-create-youtube-videos-with-ai.mdx' in file_contents:
    content = file_contents['how-to-create-youtube-videos-with-ai.mdx']
    # Remove HTML comments to pass MDX v2 validation
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    path = os.path.join(blog_dir, 'how-to-create-youtube-videos-with-ai.mdx')
    with open(path, 'w', encoding='utf-8', newline='\n') as out:
        out.write(content.replace('\r\n', '\n'))
    print("Successfully restored how-to-create-youtube-videos-with-ai.mdx without HTML comments.")
else:
    print("Could not find content in transcript.")
