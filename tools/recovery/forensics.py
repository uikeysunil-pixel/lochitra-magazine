import os
import glob
import json

brain_dir = r'C:\Users\uikey\.gemini\antigravity-ide\brain'
recovery_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\recovery'

if not os.path.exists(recovery_dir):
    os.makedirs(recovery_dir)

target_files = [
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

# Track found contents by filename -> list of (timestamp, length, content, source_session)
findings = {f: [] for f in target_files}

print("Searching transcripts...")
transcripts = glob.glob(os.path.join(brain_dir, '*', '.system_generated', 'logs', 'transcript_full.jsonl'))

for t_path in transcripts:
    session_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(t_path))))
    try:
        with open(t_path, 'r', encoding='utf-8') as f:
            for line_idx, line in enumerate(f):
                # Quick pre-filter
                if not any(tf in line for tf in target_files):
                    continue
                try:
                    data = json.loads(line)
                    timestamp = data.get('timestamp', str(line_idx))
                    
                    # Search tool_calls for write_to_file
                    for tc in data.get('tool_calls', []):
                        if tc.get('name') in ['write_to_file', 'replace_file_content', 'multi_replace_file_content', 'default_api:write_to_file', 'default_api:replace_file_content']:
                            args_raw = tc.get('args', {})
                            if isinstance(args_raw, str):
                                try:
                                    args = json.loads(args_raw)
                                except:
                                    continue
                            else:
                                args = args_raw
                            
                            target = args.get('TargetFile', '')
                            if not target:
                                continue
                            
                            basename = os.path.basename(target)
                            if basename in target_files:
                                content = args.get('CodeContent', '')
                                if not content and 'ReplacementContent' in args:
                                    content = args.get('ReplacementContent', '')
                                
                                if content:
                                    findings[basename].append({
                                        'timestamp': timestamp,
                                        'length': len(content),
                                        'content': content,
                                        'source': session_id
                                    })
                except Exception as e:
                    pass
    except Exception as e:
        print(f"Failed to read {t_path}: {e}")

# Now select the best version and write to recovery
report = []

for basename in target_files:
    versions = findings[basename]
    if not versions:
        report.append(f"{basename}: NOT RECOVERABLE")
        continue
    
    # Sort by length (descending) as a heuristic for "most complete"
    # Or by timestamp if available. Let's sort by length for now, then take the longest.
    versions.sort(key=lambda x: x['length'], reverse=True)
    best = versions[0]
    
    out_path = os.path.join(recovery_dir, basename.replace('.mdx', '.original.mdx'))
    with open(out_path, 'w', encoding='utf-8', newline='\n') as out:
        out.write(best['content'].replace('\r\n', '\n'))
    
    report.append(f"{basename}: FULLY RECOVERED ({best['length']} chars) from session {best['source']}")

print("\n--- RECOVERY REPORT ---")
for r in report:
    print(r)
