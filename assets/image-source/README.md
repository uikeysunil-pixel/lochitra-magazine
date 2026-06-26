# Locitra Image Asset Management

## Purpose
This directory (`assets/image-source/`) stores the original PNG source images for the Locitra project. It is kept strictly separated from the public production assets to maintain a clean and scalable workflow.

## Source Images vs. Production Images
- **Source Images (`assets/image-source/`):** Original, high-resolution PNG files generated or sourced for content. These should **never be overwritten**.
- **Production Images (`public/images/blog/`):** Optimized WebP images. These are lightweight and served directly to users on the website.

## Locitra Gold Standard Image Workflow
The official Locitra image workflow is designed to prevent filename mismatches and eliminate caching issues.

```text
Article Slug
        ↓
Generate PNG (1200×630)
        ↓
Save to assets/image-source/<category>/
        ↓
Filename = article slug
        ↓
Convert with XnConvert
        ↓
1200×630 WebP
        ↓
public/static/images/blog/
        ↓
Run validation script (npm run validate-images)
        ↓
npm run dev
        ↓
Verify locally
        ↓
Commit
```

**CRITICAL RULE:** The filename for both the PNG and WebP MUST perfectly match the article's MDX slug. 
- Never use article titles as filenames.
- Never use spaces or parentheses.
- Never use mixed naming conventions.

## Folder Conventions
Store your source PNG files in the appropriate sub-category directory under `assets/image-source/`. 

Current active structure:
- `_templates/` (for future documentation like image checklists, style guides, and prompts)
- `ai-tools/`
- `technology/`
- `career-growth/`
- `software-reviews/`
- `online-income/`
- `branding/`
- `archive/` (for archiving older versions of images if they are regenerated)

*Note: Future cluster folders should be created **only when development of that cluster begins** to keep this directory simplified.*

## Image Standards
Every original image must adhere to the following rules:
- **Format:** PNG
- **Dimensions:** 1200×630 (Landscape)
- **Style:** Editorial magazine quality
- **No text**, **no watermark**, **no logos**
- Subject fully visible, no cropped faces, no blurred side extensions
- Safe margins maintained
- High overall quality

## Production Image Rules (WebP)
Only optimized images belong inside the `public/images/blog/` directory.
- **Format:** WebP
- **Filename:** Same as the source PNG (e.g., `source.png` becomes `source.webp`)
- **Optimization:** WebP images are generated from the PNG originals using XnConvert.

## Archive Rules
- **Never overwrite source PNG files.**
- If an image is regenerated, keep the latest version as the source.
- Archive older versions in the `assets/image-source/archive/` folder if necessary.
- **Never edit production WebP files directly.** Always edit/regenerate the source PNG, then optimize it to WebP again.
