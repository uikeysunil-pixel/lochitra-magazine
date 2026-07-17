import os
import glob
import sys

def fix_crlf_to_lf(directory):
    count = 0
    total = 0
    pattern = os.path.join(directory, '**', '*.mdx')
    files = glob.glob(pattern, recursive=True)
    
    for filepath in files:
        total += 1
        with open(filepath, 'rb') as f:
            content = f.read()
        
        if b'\r\n' in content:
            content = content.replace(b'\r\n', b'\n')
            with open(filepath, 'wb') as f:
                f.write(content)
            count += 1
            print(f"Fixed: {filepath}")
            
    print(f"Total files processed: {total}")
    print(f"Total files repaired: {count}")

if __name__ == '__main__':
    fix_crlf_to_lf('data/blog')
