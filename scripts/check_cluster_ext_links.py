import os
import re
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed

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

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

all_ext_links = {}

for slug in TARGET_SLUGS:
    path = os.path.join(BLOG_DIR, f"{slug}.mdx")
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    ext_matches = re.findall(r'\[([^\]]+)\]\((https?://[^)#\s]+)(?:#[^)]*)?\)', text)
    for anchor, url in ext_matches:
        if url not in all_ext_links:
            all_ext_links[url] = []
        all_ext_links[url].append((slug, anchor))

print(f"Total unique external URLs across 10 articles: {len(all_ext_links)}", flush=True)

def check_url(url_item):
    url, refs = url_item
    req = urllib.request.Request(url, headers=headers)
    status_str = ""
    code = 0
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
            code = response.getcode()
            status_str = f"HTTP {code}"
    except urllib.error.HTTPError as e:
        code = e.code
        status_str = f"HTTP {e.code}"
    except urllib.error.URLError as e:
        status_str = f"URLError: {e.reason}"
    except Exception as e:
        status_str = f"Error: {e}"
    return url, status_str, code, refs

with ThreadPoolExecutor(max_workers=15) as executor:
    futures = [executor.submit(check_url, item) for item in all_ext_links.items()]
    for f in as_completed(futures):
        url, status_str, code, refs = f.result()
        articles = list(set([r[0] for r in refs]))
        is_ok = code in [200, 301, 302, 307, 308, 403, 999] or "HTTP" in status_str # Note some servers block bots with 403/999 (e.g. LinkedIn, HBR)
        prefix = "✓" if is_ok else "❌"
        print(f"{prefix} {status_str} | {url} | in {articles}", flush=True)
