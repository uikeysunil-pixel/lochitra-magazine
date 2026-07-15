import os
import shutil
import subprocess
import sys

def run_build():
    try:
        # Run contentlayer build with a timeout of 20 seconds
        print("Running build...", flush=True)
        subprocess.run(["npx.cmd", "contentlayer", "build"], timeout=20, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.TimeoutExpired:
        print("Timeout!", flush=True)
        return False
    except Exception as e:
        print(f"Error: {e}", flush=True)
        return False

def binary_search_bad_file(files, temp_dir, blog_dir):
    if len(files) == 1:
        return files[0]
    
    mid = len(files) // 2
    left = files[:mid]
    right = files[mid:]
    
    print(f"Testing left half: {len(left)} files", flush=True)
    for f in left:
        shutil.move(os.path.join(temp_dir, f), os.path.join(blog_dir, f))
    
    # We must ensure there is NO .contentlayer directory so it rebuilds!
    if os.path.exists(".contentlayer"):
        shutil.rmtree(".contentlayer", ignore_errors=True)
        
    success = run_build()
    
    # Kill any orphaned node processes
    subprocess.run(["taskkill", "/F", "/IM", "node.exe"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    for f in left:
        shutil.move(os.path.join(blog_dir, f), os.path.join(temp_dir, f))
        
    if not success:
        print("Left half hung!", flush=True)
        return binary_search_bad_file(left, temp_dir, blog_dir)
    else:
        print("Left half succeeded. Must be in right half.", flush=True)
        return binary_search_bad_file(right, temp_dir, blog_dir)

if __name__ == "__main__":
    blog_dir = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog"
    temp_dir = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog_temp"
    
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
        
    files = [f for f in os.listdir(blog_dir) if f.endswith('.mdx')]
    
    for f in files:
        shutil.move(os.path.join(blog_dir, f), os.path.join(temp_dir, f))
        
    bad_file = binary_search_bad_file(files, temp_dir, blog_dir)
    print(f"\nBAD FILE FOUND: {bad_file}\n", flush=True)
    
    for f in os.listdir(temp_dir):
        shutil.move(os.path.join(temp_dir, f), os.path.join(blog_dir, f))
    os.rmdir(temp_dir)
