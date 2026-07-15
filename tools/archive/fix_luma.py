import re
import os

filepath = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog\luma-dream-machine-review.mdx"

# Read binary and decode ignoring errors or fixing them
with open(filepath, 'rb') as f:
    content = f.read().decode('utf-8-sig') # Removes BOM if present

# Strip all hidden zero-width unicode characters
hidden_chars = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08', '\x0b', '\x0c', '\x0e', '\x0f']
for c in hidden_chars:
    content = content.replace(c, '')

# Ensure clean newlines
content = content.replace('\r\n', '\n').replace('\r', '\n')

# Extract frontmatter
match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
if match:
    frontmatter = match.group(1)
    body = match.group(2)
    
    # We will reconstruct frontmatter strictly.
    # The issue might be related to single quotes or colons. We will convert all frontmatter values to use double quotes to be absolutely safe, or just leave them standard.
    
    lines = frontmatter.strip().split('\n')
    new_lines = []
    for line in lines:
        if not line.strip(): continue
        
        # Split key and value
        idx = line.find(':')
        if idx != -1:
            key = line[:idx].strip()
            val = line[idx+1:].strip()
            
            # Remove existing quotes if any (to normalize)
            if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
                if len(val) >= 2:
                    val = val[1:-1]
            
            # Handle arrays (tags, authors)
            if val.startswith('[') and val.endswith(']'):
                # it's an array
                items = val[1:-1].split(',')
                cleaned_items = []
                for item in items:
                    item = item.strip()
                    if (item.startswith("'") and item.endswith("'")) or (item.startswith('"') and item.endswith('"')):
                        item = item[1:-1]
                    cleaned_items.append(f"'{item}'")
                val = f"[{', '.join(cleaned_items)}]"
                new_lines.append(f"{key}: {val}")
            elif val == 'false' or val == 'true':
                new_lines.append(f"{key}: {val}")
            else:
                # String value. We will wrap in double quotes to be safe against colons, and escape inner double quotes.
                val = val.replace('"', '\\"')
                new_lines.append(f'{key}: "{val}"')
        else:
            new_lines.append(line)
            
    clean_frontmatter = '\n'.join(new_lines)
    
    new_content = f"---\n{clean_frontmatter}\n---\n{body}"
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_content)
    
    print("Fixed frontmatter and saved.")
else:
    print("Could not match frontmatter structure.")
