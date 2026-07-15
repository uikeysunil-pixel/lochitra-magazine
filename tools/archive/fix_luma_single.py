import re

filepath = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog\luma-dream-machine-review.mdx"

with open(filepath, 'rb') as f:
    content = f.read().decode('utf-8-sig')

# Clean everything
hidden_chars = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08', '\x0b', '\x0c', '\x0e', '\x0f']
for c in hidden_chars:
    content = content.replace(c, '')
content = content.replace('\r\n', '\n').replace('\r', '\n')

# Strict frontmatter parsing and rewriting using SINGLE quotes
match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
if match:
    frontmatter = match.group(1)
    body = match.group(2)
    
    lines = frontmatter.strip().split('\n')
    new_lines = []
    for line in lines:
        if not line.strip(): continue
        
        idx = line.find(':')
        if idx != -1:
            key = line[:idx].strip()
            val = line[idx+1:].strip()
            
            # strip existing quotes
            if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
                if len(val) >= 2:
                    val = val[1:-1]
                    
            if val.startswith('[') and val.endswith(']'):
                # array: items must be single quoted
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
                # String value. Wrap in single quotes. Escape single quotes inside if any.
                val = val.replace("'", "''") # YAML escapes single quotes by doubling them
                new_lines.append(f"{key}: '{val}'")
        else:
            new_lines.append(line)
            
    clean_frontmatter = '\n'.join(new_lines)
    
    new_content = f"---\n{clean_frontmatter}\n---\n\n{body.lstrip()}"
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_content)
