import json, os, glob, re

target_slugs = {
    'best-ai-video-generators': 'best-ai-video-generators.mdx',
    'google-veo-3-review': 'google-veo-3-review.mdx',
    'kling-ai-review': 'kling-ai-review.mdx',
    'runway-review': 'runway-review.mdx',
    'hailuo-ai-review': 'hailuo-ai-review.mdx',
    'pika-review': 'pika-review.mdx',
    'luma-dream-machine-review': 'luma-dream-machine-review.mdx',
    'luma-dream-machine': 'luma-dream-machine-review.mdx', # fallback
    'ai-video-generator-comparison-2026': 'ai-video-generator-comparison-2026.mdx',
    'ai-video-generator-comparison': 'ai-video-generator-comparison-2026.mdx', # fallback
    'ai-video-pricing-comparison': 'ai-video-pricing-comparison.mdx'
}

recovery_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\recovery'
candidates = {v: [] for v in set(target_slugs.values())}

def extract_from_text(text):
    blocks = re.findall(r'(---.*?---.*?(?=\n---|$))', text, flags=re.DOTALL)
    for block in blocks:
        # find canonical or featuredImage
        match = re.search(r"featuredImage:\s*['\"]/static/images/blog/(.*?)\.webp['\"]", block)
        slug = match.group(1) if match else None
        if not slug:
            match = re.search(r"canonical:\s*['\"].*?/blog/(.*?)['\"]", block)
            slug = match.group(1) if match else None
            
        if not slug:
            match = re.search(r"title:\s*['\"](.*?)['\"]", block)
            if match:
                title = match.group(1)
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        
        if slug:
            # normalize
            for k, v in target_slugs.items():
                if slug.startswith(k) or k in slug:
                    candidates[v].append(block.strip())
                    break

for t in glob.glob(r'C:\Users\uikey\.gemini\antigravity-ide\brain\*\.system_generated\logs\transcript_full.jsonl'):
    try:
        lines = open(t, 'r', encoding='utf-8').readlines()
        for line in lines:
            try:
                data = json.loads(line)
                
                # Check agent content
                content = data.get('content', '')
                if content and '---' in content:
                    extract_from_text(content)
                    
                # Check tool calls
                for tc in data.get('tool_calls', []):
                    args_raw = tc.get('args', {})
                    if isinstance(args_raw, str):
                        try:
                            args = json.loads(args_raw)
                        except:
                            continue
                    else:
                        args = args_raw
                    
                    code = args.get('CodeContent', '') or args.get('ReplacementContent', '')
                    if code and '---' in code:
                        extract_from_text(code)
                    
                    cmd = args.get('CommandLine', '')
                    if cmd and '---' in cmd:
                        extract_from_text(cmd)
            except:
                pass
    except:
        pass

for filename, blocks in candidates.items():
    if not blocks:
        print(f"{filename}: NOT RECOVERABLE")
        continue
    
    blocks.sort(key=len, reverse=True)
    best = blocks[0]
    out_path = os.path.join(recovery_dir, filename.replace('.mdx', '.original.mdx'))
    
    # check existing
    if os.path.exists(out_path):
        existing_len = os.path.getsize(out_path)
        if len(best) > existing_len:
            with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
                out.write(best.replace('\r\n', '\n'))
            print(f"{filename}: FULLY RECOVERED (Overwrote) -> {len(best)} chars")
        else:
            print(f"{filename}: FULLY RECOVERED (Kept existing) -> {existing_len} chars")
    else:
        with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
            out.write(best.replace('\r\n', '\n'))
        print(f"{filename}: FULLY RECOVERED -> {len(best)} chars")
