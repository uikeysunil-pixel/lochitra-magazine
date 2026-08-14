import os
import re
import urllib.parse
import yaml

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

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BLOG_DIR = os.path.join(WORKSPACE, 'data', 'blog')

def extract_readable_text(raw_mdx):
    # 1. Strip YAML frontmatter
    fm_match = re.match(r'^---\r?\n(.*?)\r?\n---(?:\r?\n|$)', raw_mdx, re.DOTALL)
    body = raw_mdx[fm_match.end():] if fm_match else raw_mdx
    
    # 2. Strip MDX/JSX imports and exports
    body = re.sub(r'^(?:import|export)\s+.*$', '', body, flags=re.MULTILINE)
    
    # 3. Strip JSX components e.g. <AffiliateDisclosure />, <BlogNewsletterForm />
    body = re.sub(r'<[^>]+>', ' ', body)
    
    # 4. Strip fenced code blocks and inline code
    body = re.sub(r'```[\s\S]*?```', ' ', body)
    body = re.sub(r'`[^`]+`', ' ', body)
    
    # 5. Markdown links: replace [text](url) with text
    body = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', body)
    
    # 6. Markdown images: replace ![alt](url) with whitespace
    body = re.sub(r'!\[[^\]]*\]\([^)]+\)', ' ', body)
    
    # 7. Table delimiters and formatting
    body = re.sub(r'\|', ' ', body)
    body = re.sub(r'^[-\s:|]+$', ' ', body, flags=re.MULTILINE)
    
    # 8. Headings, blockquotes, list markers
    body = re.sub(r'^#{1,6}\s+', ' ', body, flags=re.MULTILINE)
    body = re.sub(r'^>\s+', ' ', body, flags=re.MULTILINE)
    body = re.sub(r'^\s*[-*+]\s+', ' ', body, flags=re.MULTILINE)
    body = re.sub(r'^\s*\d+\.\s+', ' ', body, flags=re.MULTILINE)
    
    # 9. Markdown formatting characters (*, _, ~)
    body = re.sub(r'[*_~]', ' ', body)
    
    # 10. Extract alphanumeric words + contractions
    words = re.findall(r"\b[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*\b", body)
    return words, body

print("=" * 80)
print("CAREER GROWTH SPRINT 2 (10 ARTICLES) — EXACT REPOSITORY METRICS")
print("=" * 80)

print("\n--- 1. EXACT READABLE WORD COUNTS ---")
total_words = 0
wc_table = []
for i, slug in enumerate(TARGET_SLUGS, 1):
    file_rel = f"data/blog/{slug}.mdx"
    path = os.path.join(WORKSPACE, file_rel)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    words, cleaned = extract_readable_text(content)
    wc = len(words)
    total_words += wc
    wc_table.append((f"A{i:02d}", slug, file_rel, wc))
    print(f"A{i:02d} | Slug: {slug:<45} | Words: {wc:>5,}")

print(f"\nTotal Readable Words: {total_words:,}")
print(f"Average Words / Article: {total_words / len(TARGET_SLUGS):,.1f}")

print("\n--- 2. EXACT EXTERNAL CITATION METRICS ---")
all_ext_citations = []
ext_by_slug = {}
unique_ext_urls = set()
unique_ext_domains = set()

for i, slug in enumerate(TARGET_SLUGS, 1):
    path = os.path.join(BLOG_DIR, f"{slug}.mdx")
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    matches = re.findall(r'\[([^\]]+)\]\((https?://[^)#\s]+)(?:#[^)]*)?\)', text)
    ext_by_slug[slug] = matches
    all_ext_citations.extend(matches)
    for anchor, url in matches:
        unique_ext_urls.add(url)
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        unique_ext_domains.add(domain)

print(f"Total external citation instances : {len(all_ext_citations)}")
print(f"Unique external URLs             : {len(unique_ext_urls)}")
print(f"Unique external domains          : {len(unique_ext_domains)}")

print("\nBreakdown by Article:")
for i, slug in enumerate(TARGET_SLUGS, 1):
    citations = ext_by_slug[slug]
    urls = set(u for a, u in citations)
    doms = set(urllib.parse.urlparse(u).netloc.lower().replace('www.', '') for a, u in citations)
    print(f"A{i:02d} | {slug:<45} | Citations: {len(citations):>2} | Unique URLs: {len(urls):>2} | Unique Domains: {len(doms):>2}")

print("\nAll Unique Domains:")
for d in sorted(unique_ext_domains):
    print(f"  - {d}")

print("\n--- 3. EXACT INTERNAL LINK METRICS ---")
all_int_citations = []
int_by_slug = {}
all_slugs_in_repo = set([os.path.splitext(f)[0] for f in os.listdir(BLOG_DIR) if f.endswith('.mdx')])
broken_int = []

for i, slug in enumerate(TARGET_SLUGS, 1):
    path = os.path.join(BLOG_DIR, f"{slug}.mdx")
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    matches = re.findall(r'\[([^\]]+)\]\((/blog/[^)#\s]+)(?:#[^)]*)?\)', text)
    int_by_slug[slug] = matches
    all_int_citations.extend(matches)
    for anchor, url in matches:
        target = url.replace('/blog/', '').strip('/')
        if target not in all_slugs_in_repo:
            broken_int.append((slug, anchor, url))

print(f"Total internal link instances : {len(all_int_citations)}")
print(f"Broken internal links        : {len(broken_int)}")
for i, slug in enumerate(TARGET_SLUGS, 1):
    print(f"A{i:02d} | {slug:<45} | Internal Links: {len(int_by_slug[slug]):>2}")

print("\n--- 4. FRONTMATTER VALIDATION ---")
for i, slug in enumerate(TARGET_SLUGS, 1):
    path = os.path.join(BLOG_DIR, f"{slug}.mdx")
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read()
    fm_match = re.match(r'^---\r?\n(.*?)\r?\n---', raw, re.DOTALL)
    fm = yaml.safe_load(fm_match.group(1))
    summary = fm.get('summary', '')
    print(f"A{i:02d} | Summary ({len(summary):>3} chars): {summary}")

