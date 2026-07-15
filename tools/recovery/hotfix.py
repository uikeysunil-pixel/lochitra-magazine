import os
import re

files_to_fix = [
    "best-password-managers-2026.mdx",
    "what-is-a-password-manager.mdx",
    "1password-review-2026.mdx",
    "bitwarden-review-2026.mdx",
    "nordpass-review-2026.mdx",
    "dashlane-review-2026.mdx",
    "1password-vs-bitwarden-2026.mdx",
    "nordpass-vs-dashlane-2026.mdx",
    "password-manager-pricing-comparison.mdx",
    "how-to-securely-migrate-passwords.mdx"
]

base_dir = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog"

# 1. Convert CRLF to LF
for filename in files_to_fix:
    filepath = os.path.join(base_dir, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace CRLF with LF
        content = content.replace("\r\n", "\n")
        
        with open(filepath, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)

# 2. Fix MDX error in password-manager-pricing-comparison.mdx
pricing_path = os.path.join(base_dir, "password-manager-pricing-comparison.mdx")
with open(pricing_path, "r", encoding="utf-8") as f:
    pricing_content = f.read()

pricing_content = pricing_content.replace("(<$20/yr):", "(&lt;$20/yr):")
with open(pricing_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(pricing_content)

# 3. Remove featured: false from best-ai-video-generators.mdx
ai_path = os.path.join(base_dir, "best-ai-video-generators.mdx")
with open(ai_path, "r", encoding="utf-8") as f:
    ai_content = f.read()

ai_content = ai_content.replace("featured: false\n", "")
ai_content = ai_content.replace("featured: false\r\n", "")
# In case it's true, but error said false.
with open(ai_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(ai_content)

print("Hotfixes applied.")
