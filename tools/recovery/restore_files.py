import os
import shutil

blog_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog'
recovery_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\recovery'
backup_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\backup\pre-restore'

files_to_restore = [
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

# Ensure backup dir exists
os.makedirs(backup_dir, exist_ok=True)

# 1. Copy to backup
for f in files_to_restore:
    src_blog = os.path.join(blog_dir, f)
    dst_backup = os.path.join(backup_dir, f)
    if os.path.exists(src_blog):
        shutil.copy2(src_blog, dst_backup)
        print(f"Backed up {f} to {backup_dir}")

# 2. Restore from recovery
for f in files_to_restore:
    src_recovery = os.path.join(recovery_dir, f.replace('.mdx', '.original.mdx'))
    dst_blog = os.path.join(blog_dir, f)
    
    if os.path.exists(src_recovery):
        # Read the recovered content
        with open(src_recovery, 'r', encoding='utf-8') as fin:
            content = fin.read()
        
        # Validate LF endings (convert CRLF to LF)
        content = content.replace('\r\n', '\n')
        
        # Write to data/blog/
        with open(dst_blog, 'w', encoding='utf-8', newline='\n') as fout:
            fout.write(content)
        
        print(f"Restored {f} from recovery")
    else:
        print(f"Error: {src_recovery} does not exist!")

print("Restoration complete.")
