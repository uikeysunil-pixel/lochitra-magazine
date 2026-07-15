import re

filepath = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\data\blog\luma-dream-machine-review.mdx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reading Information
if "*Estimated Reading Time:" not in content:
    content = content.replace("## Introduction", "*Estimated Reading Time: 16 minutes*  \n*Last Reviewed: July 2026*\n\n## Introduction", 1)

# 2. Key Takeaways
takeaways = """*   **Best Alternative:** [Kling AI](/blog/kling-ai-review) (For extended scene lengths) or [Runway](/blog/runway-review) (For diverse creative suites)

### Key Takeaways

*   **Overall Recommendation:** Highly Recommended for professional creators needing premium cinematic assets.
*   **Best Creator Type:** Documentary filmmakers and high-tier YouTubers.
*   **Biggest Strength:** Unmatched 3D spatial awareness and natural camera movement.
*   **Biggest Limitation:** Inconsistent native text generation and lack of built-in audio.
*   **Best Alternative:** [Runway](/blog/runway-review) for deep post-production VFX workflows.
*   **Commercial Suitability:** Excellent (Commercial rights included on all paid tiers).
*   **Overall Value:** Exceptional for high-volume video production.

---

## Who Should Use Luma Dream Machine?"""
content = re.sub(r'\*\s*\*\*Best Alternative:\*\*.*?---\s*## Who Should Use Luma Dream Machine\?', takeaways, content, flags=re.DOTALL)

# 3. Creator Recommendation Matrix
matrix = """| **Beginners** | Neutral | The interface is accessible, but mastering cinematic prompting requires patience and trial-and-error. |

### Creator Recommendation Matrix

| Workflow | Rating |
| :--- | :--- |
| **Documentaries** | ★★★★★ |
| **Historical Videos** | ★★★★★ |
| **Product Ads** | ★★★★★ |
| **Storyboarding** | ★★★★☆ |
| **Corporate Videos** | ★★★★☆ |
| **YouTube** | ★★★★☆ |
| **Marketing** | ★★★★☆ |
| **Education** | ★★★☆☆ |
| **Social Media** | ★★★☆☆ |"""
content = re.sub(r'\|\s*\*\*Beginners\*\*.*?\|', matrix, content, count=1, flags=re.DOTALL)

# 4. Testing Transparency
transparency = """This robust methodology ensures our conclusions reflect the live production environment available to standard users, free from marketing claims. To guarantee complete objectivity, all AI video platform reviews are conducted under identical testing conditions. We utilize the exact same standardized prompt library and evaluation criteria across all platforms. Our workflow-first testing prioritizes practical usability over theoretical benchmarks, and our independent editorial assessment is never influenced by developer sponsorships, ensuring the highest standards of transparency and E-E-A-T."""
content = content.replace("This robust methodology ensures our conclusions reflect the live production environment available to standard users, free from marketing claims.", transparency)

# 5. Quick Pros vs Cons Table
pros_cons = """## Advantages and Limitations

### Quick Pros vs Cons

| Biggest Advantages | Biggest Limitations |
| :--- | :--- |
| Unparalleled cinematic photorealism | Strict prompt structure required |
| 3D-aware, warp-free camera movement | Lacks native audio generation |
| Flawless Image-to-Video preservation | Inconsistent native text rendering |
| Highly accurate physics and gravity | Occasional anatomical hand errors |
| Clear commercial licensing on paid tiers | No deep in-browser editing tools |

### Detailed Advantages

*   **Cinematic Realism:** Consistently produces some of the most photorealistic, believable footage available on the market.
*   **Superior Camera Control:** Allows for complex, 3D-aware camera movements without warping the environment.
*   **Outstanding Image-to-Video:** Breathes life into static reference images while preserving their composition flawlessly.
*   **Accurate Physics:** Simulates fluid dynamics, gravity, and fabric movement much better than early 2024 models.
*   **Commercial Security:** Clear licensing on paid tiers allows professionals to monetize without fear.

### Detailed Limitations

*   **Prompt Sensitivity:** Demands a rigid, specific prompt structure; vague prompts often yield generic results.
*   **No Native Audio:** Does not generate synchronized sound effects or dialogue natively; requires external tools.
*   **Text Generation:** Struggles significantly to render coherent, correctly spelled text within the video.
*   **Complex Hand Movements:** Like most models, it still occasionally fails when rendering complex finger articulation."""
content = re.sub(r'## Advantages.*?## Luma Dream Machine vs Competitors', pros_cons + '\n\n---\n\n## Luma Dream Machine vs Competitors', content, flags=re.DOTALL)

# 6. Locitra Editorial Confidence
confidence = """## Locitra Editorial Confidence

**★★★★★ High Confidence**

Based on:
*   14-day intensive platform testing
*   150+ diverse generative prompts
*   Multiple real-world creator workflows
*   Multiple hardware platforms (Mac, Windows, iOS)
*   Independent, un-sponsored editorial evaluation

---

## Locitra Editorial Verdict"""
content = content.replace("## Locitra Editorial Verdict", confidence, 1)

# 7. Who Should Buy Luma Dream Machine Today?
who_buy = """## Who Should Buy Luma Dream Machine Today?

| User Type | Recommendation | Why |
| :--- | :--- | :--- |
| **Documentary Creators** | Buy | The absolute best tool for generating historically accurate, photorealistic B-roll. |
| **Agencies** | Buy | Rapidly accelerates high-fidelity storyboarding and client pitch visualizations. |
| **Filmmakers** | Buy | Ideal for pre-visualization and testing complex camera movements before arriving on set. |
| **YouTubers** | Consider | Excellent for cinematic visual hooks, but requires external tools for audio and lip-syncing. |
| **Businesses** | Consider | Great for premium corporate videos, though the learning curve for prompting is moderate. |
| **Educators** | Consider | Highly useful for visualizing abstract concepts, but may be too expensive for casual classroom use. |
| **Beginners** | Wait | Better served by tools with simpler interfaces and integrated audio before investing in premium tiers. |

---

## Final Verdict"""
content = content.replace("## Final Verdict", who_buy, 1)

# 8. Strengthen Final Verdict
final_verdict = """## Final Verdict

Luma Dream Machine is a spectacular achievement in generative AI video, setting the current benchmark for cinematic realism and 3D spatial awareness. Its ability to flawlessly animate static images and execute complex camera movements makes it an indispensable tool for documentary creators, YouTubers, and marketing agencies demanding premium aesthetics. 

Why choose Luma Dream Machine over the competition? While [Google Veo 3](/blog/google-veo-3-review) offers slightly better text generation, Luma delivers superior volumetric lighting and environmental physics. Compared to [Kling AI](/blog/kling-ai-review), Luma provides tighter character consistency in I2V workflows, even if Kling allows for longer raw generations. While [Runway](/blog/runway-review) remains the undisputed king of post-production VFX tools, and [Pika](/blog/pika-review) dominates rapid-ideation speed, Luma functions as the ultimate premium digital camera—capturing the most beautiful, physically accurate initial shot possible. 

If visual fidelity, 3D spatial stability, and accurate physical motion are your primary requirements, Luma Dream Machine is our highest editorial recommendation for cinematic AI video generation."""
content = re.sub(r'## Final Verdict\n\nLuma Dream Machine is a spectacular.*?highly recommended\.', final_verdict, content, flags=re.DOTALL)

# Write back
with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("Edits applied.")
