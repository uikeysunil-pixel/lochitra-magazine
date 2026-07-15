import json
import os
import re

transcript_path = r'C:\Users\uikey\.gemini\antigravity-ide\brain\ba661a02-424e-4cc0-8c89-e9913f83bbdf\.system_generated\logs\transcript_full.jsonl'
blog_dir = r'C:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog'

files_to_restore = [
    'ai-video-generator-comparison-2026.mdx',
    'ai-video-pricing-comparison.mdx',
    'best-ai-video-generators.mdx',
    'google-veo-3-review.mdx',
    'hailuo-ai-review.mdx',
    'how-to-create-youtube-videos-with-ai.mdx',
    'kling-ai-review.mdx',
    'luma-dream-machine-review.mdx',
    'pika-review.mdx',
    'runway-review.mdx'
]

# 1. Recover how-to-create-youtube-videos-with-ai.mdx from the transcript
file_contents = {}
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        for tc in data.get('tool_calls', []):
            if tc.get('name') in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                # The arguments might be a JSON string instead of a dict!
                args_raw = tc.get('args', {})
                if isinstance(args_raw, str):
                    try:
                        args = json.loads(args_raw)
                    except:
                        args = {}
                else:
                    args = args_raw
                
                target = args.get('TargetFile', '')
                if target:
                    basename = os.path.basename(target)
                    if basename in files_to_restore:
                        if 'CodeContent' in args:
                            file_contents[basename] = args['CodeContent']
                        # We won't try to parse ReplacementChunks for now, since CodeContent should have the full file from write_to_file.

# 2. Write the recovered file or boilerplate for others
for basename in files_to_restore:
    path = os.path.join(blog_dir, basename)
    
    if basename in file_contents:
        content = file_contents[basename]
        print(f"Restored {basename} from transcript.")
    else:
        # Create a valid boilerplate article
        slug = basename.replace('.mdx', '')
        title_slug = slug.replace('-', ' ').title()
        content = f"""---
title: '{title_slug}'
date: '2026-07-14'
category: 'ai-tools'
tags: ['ai-video']
draft: false
summary: 'A comprehensive review and guide for {title_slug} in 2026.'
authors: ['sunil-kumar-uikey']
featuredImage: '/static/images/blog/{slug}.webp'
---
<AffiliateDisclosure />

## Introduction

This is a placeholder article for {title_slug}. It was automatically generated because the original file content was accidentally deleted during debugging.

Please restore the original content of this article from your local Git backups or regenerate it.

## Final Verdict

This article needs to be restored.

## Related Articles

* [How to Create YouTube Videos with AI](/blog/how-to-create-youtube-videos-with-ai)
"""
        print(f"Generated placeholder for {basename}")

    # Write file ensuring LF endings
    with open(path, 'w', encoding='utf-8', newline='\n') as out:
        out.write(content.replace('\r\n', '\n'))
