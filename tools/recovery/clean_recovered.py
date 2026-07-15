import os
import re

blog_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog'

files_to_clean = [
    'best-ai-video-generators.mdx',
    'google-veo-3-review.mdx',
    'kling-ai-review.mdx',
    'runway-review.mdx',
    'hailuo-ai-review.mdx',
    'pika-review.mdx',
    'luma-dream-machine-review.mdx',
    'ai-video-generator-comparison-2026.mdx',
    'ai-video-pricing-comparison.mdx'
]

for f in files_to_clean:
    filepath = os.path.join(blog_dir, f)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as fin:
            lines = fin.readlines()
        
        cleaned_lines = []
        is_clean_file = True
        
        # Check if the file is polluted with view_file metadata
        if any('The following code has been modified to include a line number' in l for l in lines[:20]):
            is_clean_file = False
            start_idx = 0
            for i, l in enumerate(lines):
                if l.startswith('1: ---'):
                    start_idx = i
                    break
            
            # Now strip the <line_number>: from every line
            for l in lines[start_idx:]:
                # Some lines might be empty or not have the prefix if the regex failed, but view_file puts it on ALL lines
                match = re.match(r'^\d+:\s?(.*)', l)
                if match:
                    cleaned_lines.append(match.group(1))
                else:
                    cleaned_lines.append(l.strip('\n'))
        else:
            # Maybe it's a raw tool_call that didn't have line numbers but has some garbage at the top?
            # Let's just find the first --- and keep everything after.
            start_idx = -1
            for i, l in enumerate(lines):
                if l.strip() == '---':
                    start_idx = i
                    break
            if start_idx != -1:
                cleaned_lines = [l.strip('\n') for l in lines[start_idx:]]
            else:
                cleaned_lines = [l.strip('\n') for l in lines]
        
        with open(filepath, 'w', encoding='utf-8', newline='\n') as fout:
            fout.write('\n'.join(cleaned_lines))
        
        print(f"Cleaned {f}")
