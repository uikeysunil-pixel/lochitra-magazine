import os
import glob
import re

BLOG_DIR = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog"
files = glob.glob(os.path.join(BLOG_DIR, "**", "*.mdx"), recursive=True)

modified_files = []

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'^(?:---\n)(.*?)(?:\n---(?:\n|$))', content, re.DOTALL)
    if not match:
        continue
    
    fm_block = match.group(1)
    
    title_match = re.search(r"^title:\s*'(.*?)'", fm_block, re.MULTILINE)
    summary_match = re.search(r"^summary:\s*'(.*?)'", fm_block, re.MULTILINE)
    date_match = re.search(r"^date:\s*'(.*?)'", fm_block, re.MULTILINE)
    category_match = re.search(r"^category:\s*'(.*?)'", fm_block, re.MULTILINE)
    tags_match = re.search(r"^tags:\s*\[(.*?)\]", fm_block, re.MULTILINE)
    
    title = title_match.group(1) if title_match else ""
    summary = summary_match.group(1) if summary_match else ""
    date = date_match.group(1) if date_match else ""
    category = category_match.group(1) if category_match else ""
    
    tags = []
    if tags_match:
        tag_str = tags_match.group(1)
        tags = [t.strip().strip("'") for t in tag_str.split(',') if t.strip()]
        
    has_desc = re.search(r"^description:", fm_block, re.MULTILINE)
    has_image_alt = re.search(r"^imageAlt:", fm_block, re.MULTILINE)
    has_keywords = re.search(r"^keywords:", fm_block, re.MULTILINE)
    has_last_updated = re.search(r"^lastUpdated:", fm_block, re.MULTILINE)
    has_categories = re.search(r"^categories:", fm_block, re.MULTILINE)
    
    added = []
    
    if not has_desc and summary:
        safe_sum = summary.replace("'", "")
        added.append(f"description: '{safe_sum}'")
        
    if not has_image_alt and title:
        safe_title = title.replace("'", "")
        added.append(f"imageAlt: 'Featured image for {safe_title}'")
        
    if not has_keywords:
        kw = list(tags)
        if category and category not in kw:
            kw.append(category)
        
        title_words = [w.lower() for w in re.findall(r'\b\w{4,}\b', title)]
        for w in title_words:
            if w not in kw and len(kw) < 10:
                kw.append(w)
                
        kw = kw[:10]
        kw_str = ", ".join([f"'{k}'" for k in kw])
        added.append(f"keywords: [{kw_str}]")
        
    if not has_last_updated and date:
        added.append(f"lastUpdated: '{date}'")
        
    if not has_categories and category:
        added.append(f"categories: ['{category}']")
        
    if added:
        new_fm = fm_block.rstrip() + '\n' + '\n'.join(added) + '\n'
        new_content = content[:match.start(1)] + new_fm + content[match.end(1):]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        modified_files.append(filepath)

print(f"Modified {len(modified_files)} files.")
for f in modified_files:
    print(f)
