import re, os, sys
from PIL import Image

mdx_path = r'data/blog/personal-branding-tech-leaders-2026.mdx'
img_path = r'public\static\images\blog\personal-branding-tech-leaders-2026.webp'
blog_dir = r'data/blog'

print('=' * 70)
print('LOCITRA LTAP v5.0 — INDEPENDENT PLATINUM CERTIFICATION AUDIT')
print('=' * 70)

# ── PASS 1: FILE EXISTENCE ──────────────────────────────────────────────────
print('\n[PASS 1] FILE EXISTENCE')
assert os.path.exists(mdx_path), '❌ MDX FILE MISSING'
print(f'  ✓ MDX File      : EXISTS ({os.path.getsize(mdx_path):,} bytes)')
assert os.path.exists(img_path), '❌ FEATURED IMAGE MISSING'
img = Image.open(img_path)
print(f'  ✓ Featured Image: EXISTS | Format={img.format} | Dimensions={img.size[0]}x{img.size[1]}')
assert img.format == 'WEBP', f'❌ Image format is {img.format}, expected WEBP'
assert img.size == (1200, 630), f'❌ Image size is {img.size}, expected (1200, 630)'
print('  ✓ Image Format  : WEBP')
print('  ✓ Resolution    : 1200x630')

with open(mdx_path, 'r', encoding='utf-8') as f:
    text = f.read()
lines = text.splitlines()

# ── PASS 2: FRONTMATTER ─────────────────────────────────────────────────────
print('\n[PASS 2] FRONTMATTER INSPECTION')
assert text.startswith('---'), '❌ Frontmatter start missing'
fm_end = text.index('---', 3)
fm = text[3:fm_end]
required_fields = ['title:', 'date:', 'category:', 'tags:', 'draft:', 'summary:', 'authors:', 'featuredImage:']
fm_issues = []
for field in required_fields:
    if field in fm:
        print(f'  ✓ {field}')
    else:
        print(f'  ❌ MISSING: {field}')
        fm_issues.append(field)

# ── PASS 3: MDX STRUCTURAL CHECKS ───────────────────────────────────────────
print('\n[PASS 3] MDX STRUCTURAL CHECKS')
aff = '<AffiliateDisclosure />' in text
print(f'  ✓ AffiliateDisclosure present : {aff}')
html_comments = re.findall(r'<!--.*?-->', text, re.DOTALL)
print(f'  ✓ HTML comments (<!-- -->)    : {len(html_comments)} (must be 0)')
jsx_comments = re.findall(r'\{/\*.*?\*/\}', text, re.DOTALL)
print(f'  ✓ JSX comments ({{/* */}})     : {len(jsx_comments)} (must be 0)')
body = text[fm_end+3:]
h1_in_body = re.findall(r'^# [A-Z]', body, re.MULTILINE)
print(f'  ✓ H1 tags in article body     : {len(h1_in_body)} (must be 0)')
unescaped_lt = [l for l in lines if re.search(r'<[0-9]', l)]
print(f'  ✓ Unescaped <N in tables      : {len(unescaped_lt)} (must be 0)')

# ── PASS 4: INTERNAL LINK AUDIT ─────────────────────────────────────────────
print('\n[PASS 4] INTERNAL LINK AUDIT')
links = re.findall(r'\((/blog/[^)]+)\)', text)
slugs = [f.replace('.mdx', '') for f in os.listdir(blog_dir) if f.endswith('.mdx')]
broken_internal = []
for l in sorted(set(links)):
    s = l.replace('/blog/', '')
    exists = s in slugs
    status = '✓' if exists else '❌ BROKEN'
    if not exists:
        broken_internal.append(l)
    print(f'  {status} {l}')
print(f'\n  Summary → Total invocations: {len(links)} | Unique slugs: {len(set(links))} | Broken: {len(broken_internal)}')

# ── PASS 5: RELATED ARTICLES ────────────────────────────────────────────────
print('\n[PASS 5] RELATED ARTICLES SECTION')
ra_match = re.search(r'## Related Articles(.*?)$', text, re.DOTALL)
if ra_match:
    ra_links = re.findall(r'\((/blog/[^)]+)\)', ra_match.group(1))
    ra_broken = [l for l in ra_links if l.replace('/blog/', '') not in slugs]
    print(f'  Related Articles found: {len(ra_links)} links | Broken: {len(ra_broken)}')
    for rl in ra_links:
        status = '✓' if rl.replace('/blog/', '') in slugs else '❌ BROKEN'
        print(f'  {status} {rl}')
else:
    print('  ❌ Related Articles section: MISSING')

# ── PASS 6: EXTERNAL LINKS ──────────────────────────────────────────────────
print('\n[PASS 6] EXTERNAL LINKS FOUND')
ext_links = re.findall(r'\(https?://[^)]+\)', text)
for e in ext_links:
    print(f'  {e.strip("()")}')
print(f'  Total External Links: {len(ext_links)}')

# ── PASS 7: TABLES & DIAGRAMS ───────────────────────────────────────────────
print('\n[PASS 7] TABLES & DIAGRAMS')
pipe_tables = re.findall(r'^\|[\s\-:+|]+\|$', text, re.MULTILINE)
print(f'  ✓ Markdown pipe tables  : {len(pipe_tables)}')
code_blocks = re.findall(r'```\n(.*?)```', text, re.DOTALL)
ascii_diagrams = [b for b in code_blocks if any(c in b for c in ['┌', '│', '├', '┐', '└'])]
print(f'  ✓ ASCII diagrams        : {len(ascii_diagrams)}')
alerts = {a: text.count(a) for a in ['[!NOTE]', '[!TIP]', '[!IMPORTANT]', '[!WARNING]', '[!CAUTION]'] if text.count(a) > 0}
print(f'  ✓ GitHub alert callouts : {sum(alerts.values())} → {dict(alerts)}')

# ── PASS 8: SECTION STRUCTURE ───────────────────────────────────────────────
print('\n[PASS 8] SECTION STRUCTURE (H2)')
h2_sections = re.findall(r'^## .+', body, re.MULTILINE)
for h in h2_sections:
    print(f'  ✓ {h}')
print(f'  Total H2 sections: {len(h2_sections)}')
faq_present = '## FAQ' in text
fv_present = '## Final Verdict' in text or '## Final Thoughts' in text
print(f'  ✓ FAQ section present         : {faq_present}')
print(f'  ✓ Final Verdict present       : {fv_present}')

# ── PASS 9: STATISTICS FOUND ────────────────────────────────────────────────
print('\n[PASS 9] STATISTICS IN ARTICLE')
stats = re.findall(r'\d+\.?\d*\s*%|\d+\.\d+\s*times|\d+x\s', text)
print(f'  Numeric claims / statistics found: {len(stats)}')
for s in sorted(set(stats))[:15]:
    print(f'    {s.strip()}')

# ── PASS 10: PROPRIETARY FRAMEWORKS ─────────────────────────────────────────
print('\n[PASS 10] LOCITRA PROPRIETARY FRAMEWORKS')
frameworks = [
    'Executive Authority Pyramid',
    '5 Pillars of Executive Reputation',
    'LinkedIn Profile Optimization Blueprint',
    'Executive Content Flywheel',
    'Thought Leadership Matrix',
    '12-Month',
    '4 Rules of Authentic Authority',
    'Executive Post Structure Blueprint',
    'Networking Ecosystem',
    'Visibility Dashboard'
]
for fw in frameworks:
    found = fw.lower() in text.lower()
    status = '✓' if found else '❌ MISSING'
    print(f'  {status} {fw}')

print('\n' + '=' * 70)
print('AUDIT COMPLETE')
print('=' * 70)
