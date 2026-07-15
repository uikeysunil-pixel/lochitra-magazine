import os
import glob
import re

recovery_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\recovery'

deep_files = glob.glob(os.path.join(recovery_dir, 'deep_content_*.txt')) + glob.glob(os.path.join(recovery_dir, 'deep_cmd_*.txt'))

extracted_articles = {}

for df in deep_files:
    try:
        with open(df, 'r', encoding='utf-8') as f:
            text = f.read()
            
            # Find all markdown blocks or just the whole text if it starts with ---
            # Some might be in ```markdown ... ```
            blocks = re.findall(r'```(?:markdown|mdx)?\s*(---.*?)\s*```', text, flags=re.DOTALL)
            
            if not blocks:
                # Fallback: just find --- to the end of the file or next ---? No, --- to --- and the rest.
                # A simple heuristic: if the text contains ---, title: ..., it might be the article itself.
                if '---' in text and 'title:' in text:
                    blocks = [text]
            
            for block in blocks:
                # Try to extract the slug from featuredImage or canonical
                slug = None
                
                # Check featuredImage: '/static/images/blog/google-veo-3-review.webp'
                match = re.search(r"featuredImage:\s*['\"]/static/images/blog/(.*?)\.webp['\"]", block)
                if match:
                    slug = match.group(1)
                else:
                    # Check canonical
                    match = re.search(r"canonical:\s*['\"].*?/blog/(.*?)['\"]", block)
                    if match:
                        slug = match.group(1)
                
                if not slug:
                    # check title
                    match = re.search(r"title:\s*['\"](.*?)['\"]", block)
                    if match:
                        title = match.group(1)
                        # primitive slugify
                        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
                        slug = slug.replace('-2026', '').replace('review', '-review').replace('--', '-')
                
                if slug:
                    # Normalize slug to filename
                    filename = slug + '.mdx'
                    if not filename.endswith('-review.mdx') and 'review' in filename:
                        filename = filename.replace('review', '-review').replace('--', '-')
                    
                    if filename not in extracted_articles:
                        extracted_articles[filename] = []
                    
                    extracted_articles[filename].append(block.strip())
    except Exception as e:
        print(f"Failed {df}: {e}")

# Save the longest extracted blocks
for filename, blocks in extracted_articles.items():
    blocks.sort(key=len, reverse=True)
    best_block = blocks[0]
    out_path = os.path.join(recovery_dir, filename.replace('.mdx', '.original.mdx'))
    
    # Check if we already recovered it in forensics.py
    if os.path.exists(out_path):
        existing_len = os.path.getsize(out_path)
        if len(best_block) > existing_len:
            with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
                out.write(best_block.replace('\r\n', '\n'))
            print(f"Overwrote {filename} with a longer version from deep search ({len(best_block)} chars).")
        else:
            print(f"Kept existing {filename} ({existing_len} chars), deep search version was smaller ({len(best_block)} chars).")
    else:
        with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
            out.write(best_block.replace('\r\n', '\n'))
        print(f"Recovered {filename} from deep search ({len(best_block)} chars).")
