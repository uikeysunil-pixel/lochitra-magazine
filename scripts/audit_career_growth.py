import os
import re
import json
import yaml
from PIL import Image

TARGET_SLUGS = [
    'ai-interview-preparation-guide-2026',
    'ai-upskilling-playbook-mid-career-2026',
    'tech-compensation-equity-negotiation-2026',
    'personal-branding-tech-leaders-2026',
    'ai-product-management-non-technical-2026',
    'global-compensation-arbitrage-remote-2026',
    'ai-prompt-engineering-certifications-2026',
    'ai-side-hustle-to-full-time-career-2026',
    'ai-native-manager-hybrid-teams-2026',
    'future-proof-career-automation-era-2026',
]

WORKSPACE = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra"
BLOG_DIR = os.path.join(WORKSPACE, "data", "blog")
PUBLIC_DIR = os.path.join(WORKSPACE, "public")

all_slugs = set([os.path.splitext(f)[0] for f in os.listdir(BLOG_DIR) if f.endswith('.mdx')])

results = {}

REQUIRED_PLATINUM_FIELDS = [
    'title', 'date', 'category', 'tags', 'draft', 'summary', 'authors',
    'featuredImage', 'description', 'imageAlt', 'keywords', 'lastUpdated',
    'categories', 'canonical'
]

REQUIRED_GOLD_ORDER = [
    'title', 'date', 'category', 'tags', 'draft', 'summary', 'authors', 'featuredImage'
]

print("=" * 80)
print("AUDITING CAREER GROWTH CLUSTER (10 TARGET ARTICLES)")
print("=" * 80)

for slug in TARGET_SLUGS:
    path = os.path.join(BLOG_DIR, f"{slug}.mdx")
    res = {
        'exists': os.path.exists(path),
        'issues': [],
        'warnings': [],
        'info': {}
    }
    
    if not res['exists']:
        res['issues'].append("File does not exist")
        results[slug] = res
        continue
        
    with open(path, 'rb') as f:
        raw_bytes = f.read()
        
    res['info']['bytes'] = len(raw_bytes)
    res['info']['has_crlf'] = b'\r\n' in raw_bytes
    res['info']['has_bom'] = raw_bytes.startswith(b'\xef\xbb\xbf')
    
    if res['info']['has_crlf']:
        res['issues'].append("CRLF line endings detected (must be LF)")
    if res['info']['has_bom']:
        res['issues'].append("BOM detected (must be UTF-8 without BOM)")
        
    text = raw_bytes.decode('utf-8', errors='replace')
    
    # 1. Frontmatter
    fm_match = re.match(r'^---\r?\n(.*?)\r?\n---', text, re.DOTALL)
    if not fm_match:
        res['issues'].append("No valid frontmatter delimiter found")
        results[slug] = res
        continue
        
    fm_raw = fm_match.group(1)
    body = text[fm_match.end():]
    
    try:
        fm_data = yaml.safe_load(fm_raw)
    except Exception as e:
        res['issues'].append(f"YAML parse error: {e}")
        results[slug] = res
        continue
        
    res['info']['fm_keys'] = list(fm_data.keys()) if fm_data else []
    
    # Check Gold Standard required order (first 8 fields)
    fm_lines = [l.strip() for l in fm_raw.splitlines() if l.strip() and not l.strip().startswith('#')]
    found_keys_in_order = []
    for l in fm_lines:
        km = re.match(r'^([a-zA-Z0-9_-]+):', l)
        if km:
            k = km.group(1)
            if k not in found_keys_in_order:
                found_keys_in_order.append(k)
                
    for i, expected in enumerate(REQUIRED_GOLD_ORDER):
        if i < len(found_keys_in_order):
            actual = found_keys_in_order[i]
            if actual != expected:
                res['issues'].append(f"Field order mismatch: expected '{expected}' at position {i+1}, found '{actual}'")
        else:
            res['issues'].append(f"Missing required Gold Standard field: '{expected}'")
            
    # Check all Platinum required fields
    for field in REQUIRED_PLATINUM_FIELDS:
        if field not in fm_data or fm_data[field] is None:
            res['issues'].append(f"Missing Platinum required field: '{field}'")
            
    # Summary length check (150-165 chars)
    summary = fm_data.get('summary', '')
    res['info']['summary_len'] = len(summary)
    res['info']['summary'] = summary
    if len(summary) < 150 or len(summary) > 165:
        res['issues'].append(f"Summary length is {len(summary)} chars (target: 150-165 chars)")
        
    # Canonical check
    canonical = fm_data.get('canonical', '')
    expected_canonical = f"https://locitra.com/blog/{slug}"
    if canonical != expected_canonical:
        res['issues'].append(f"Canonical mismatch: expected '{expected_canonical}', found '{canonical}'")
        
    # Category check
    category = fm_data.get('category', '')
    if category != 'career-growth':
        res['issues'].append(f"Category mismatch: expected 'career-growth', found '{category}'")
        
    # Image check
    featured_image = fm_data.get('featuredImage', '')
    expected_image = f"/static/images/blog/{slug}.webp"
    if featured_image != expected_image:
        res['issues'].append(f"featuredImage path mismatch: expected '{expected_image}', found '{featured_image}'")
        
    img_abs = os.path.join(PUBLIC_DIR, featured_image.lstrip('/'))
    if not os.path.exists(img_abs):
        res['issues'].append(f"Featured image missing on disk: {img_abs}")
    else:
        try:
            im = Image.open(img_abs)
            res['info']['image_format'] = im.format
            res['info']['image_size'] = im.size
            if im.format != 'WEBP':
                res['issues'].append(f"Featured image format is {im.format}, expected WEBP")
            if im.size != (1200, 630):
                res['issues'].append(f"Featured image size is {im.size}, expected (1200, 630)")
        except Exception as e:
            res['issues'].append(f"Error opening image {img_abs}: {e}")
            
    # 2. Components
    aff_matches = re.findall(r'<AffiliateDisclosure\s*/>', text)
    news_matches = re.findall(r'<BlogNewsletterForm\s*/>', text)
    
    res['info']['affiliate_count'] = len(aff_matches)
    res['info']['newsletter_count'] = len(news_matches)
    
    if len(aff_matches) != 1:
        res['issues'].append(f"AffiliateDisclosure count is {len(aff_matches)}, must be exactly 1")
    else:
        # Check position: must be immediately after closing ---
        body_trimmed_start = body.lstrip()
        if not body_trimmed_start.startswith('<AffiliateDisclosure />') and not body_trimmed_start.startswith('<AffiliateDisclosure/>'):
            res['issues'].append("AffiliateDisclosure is not immediately after the closing frontmatter delimiter")
            
    if len(news_matches) != 1:
        res['issues'].append(f"BlogNewsletterForm count is {len(news_matches)}, must be exactly 1")
        
    # Prohibited elements
    html_comments = re.findall(r'<!--.*?-->', text, re.DOTALL)
    if html_comments:
        res['issues'].append(f"Found {len(html_comments)} forbidden HTML comments (<!-- -->)")
        
    jsx_comments = re.findall(r'\{/\*.*?\*/\}', text, re.DOTALL)
    if jsx_comments:
        res['issues'].append(f"Found {len(jsx_comments)} forbidden JSX comments ({{/* */}})")
        
    inline_md_imgs = re.findall(r'!\[.*?\]\(.*?\)', body)
    if inline_md_imgs:
        res['issues'].append(f"Found {len(inline_md_imgs)} inline markdown images: {inline_md_imgs}")
        
    # Strip code blocks for markdown syntax checks (e.g. headings, todos)
    body_no_code = re.sub(r'```.*?```', '', body, flags=re.DOTALL)

    # Check for placeholder text / TODOs (excluding valid words inside sentences)
    todos = re.findall(r'\b(TODO|FIXME|TBD|LOREM IPSUM|INSERT HERE)\b', body_no_code, re.IGNORECASE)
    if todos:
        res['issues'].append(f"Found placeholder text: {todos}")
        
    # 3. Headings
    h1_matches = re.findall(r'^#\s+.*', body_no_code, re.MULTILINE)
    if h1_matches:
        res['issues'].append(f"Found {len(h1_matches)} H1 (#) headings in body: {h1_matches}")
        
    headings = re.findall(r'^(#{1,6})\s+(.*)', body_no_code, re.MULTILINE)
    res['info']['heading_count'] = len(headings)
    
    # Check heading levels (no skipped levels)
    prev_level = 2
    for hashes, h_title in headings:
        level = len(hashes)
        if level > prev_level + 1:
            res['issues'].append(f"Skipped heading level: from H{prev_level} to H{level} ('{h_title}')")
        prev_level = level
        
    # Check Final Section: ## Final Verdict or ## Final Thoughts
    # Check Related Articles section: ## Related Articles at the very end
    h2_headings = [h_title.strip() for hashes, h_title in headings if len(hashes) == 2]
    
    if not any(h in ['Final Verdict', 'Final Thoughts', 'Final Recommendation', 'The Final Verdict'] for h in h2_headings):
        res['issues'].append(f"Missing '## Final Verdict' or '## Final Thoughts' H2 section. H2s found: {h2_headings[-4:]}")
        
    if not h2_headings or h2_headings[-1] != 'Related Articles':
        res['issues'].append(f"Final H2 section must be '## Related Articles'. Found last H2: '{h2_headings[-1] if h2_headings else 'None'}'")
        
    # 4. Internal links audit
    int_links = re.findall(r'\[([^\]]+)\]\((/blog/[^)#\s]+)(?:#[^)]*)?\)', body)
    res['info']['internal_link_count'] = len(int_links)
    broken_int = []
    for anchor, link in int_links:
        target_slug = link.replace('/blog/', '').strip('/')
        if target_slug not in all_slugs:
            broken_int.append((anchor, link))
    if broken_int:
        res['issues'].append(f"Broken internal links ({len(broken_int)}): {broken_int}")
        
    # 5. External links audit
    ext_links = re.findall(r'\[([^\]]+)\]\((https?://[^)#\s]+)(?:#[^)]*)?\)', body)
    res['info']['external_link_count'] = len(ext_links)
    http_links = [l for a, l in ext_links if l.startswith('http://')]
    if http_links:
        res['issues'].append(f"Insecure HTTP links ({len(http_links)}): {http_links}")
        
    # Check affiliate/tracking parameters in external links
    tracking_links = [l for a, l in ext_links if any(p in l for p in ['utm_', 'aff_', 'ref=', 'tag='])]
    if tracking_links:
        res['warnings'].append(f"Potential tracking/affiliate params in external links: {tracking_links}")

    results[slug] = res

print("\nAUDIT RESULTS SUMMARY:")
for slug, res in results.items():
    print(f"\n[{slug}]")
    print(f"  Summary ({res['info'].get('summary_len')} chars): {res['info'].get('summary')}")
    print(f"  Image: {res['info'].get('image_format')} {res['info'].get('image_size')}")
    print(f"  Internal links: {res['info'].get('internal_link_count')}, External: {res['info'].get('external_link_count')}")
    if res['issues']:
        print("  ❌ ISSUES:")
        for iss in res['issues']:
            print(f"     - {iss}")
    else:
        print("  ✓ ZERO ISSUES")
    if res['warnings']:
        print("  ⚠️ WARNINGS:")
        for w in res['warnings']:
            print(f"     - {w}")

print("\n" + "=" * 80)
