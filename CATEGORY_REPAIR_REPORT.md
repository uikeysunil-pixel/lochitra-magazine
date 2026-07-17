# Category Repair Report: Proton Pass Review (2026)

## Root Cause

The article `proton-pass-review-2026.mdx` was missing from the Locitra category archives because its frontmatter used an invalid/unregistered top-level taxonomy category.

- Original `category: 'password-managers'` was used instead of the globally configured `software-reviews` category.
- An invalid `categories` array field was present in the YAML, which is not part of the Locitra Contentlayer schema for primary routing.

## Files Inspected

- `data/blog/proton-pass-review-2026.mdx`
- `data/blog/keeper-security-review-2026.mdx` (used as the certified standard reference)
- Repository-wide MDX taxonomy via `grep_search` to verify standard category mappings.

## Files Modified

- `data/blog/proton-pass-review-2026.mdx`

## Repair Performed

Applied the minimum safe correction without modifying editorial content:

1. Replaced `category: 'password-managers'` with the standard `category: 'software-reviews'`.
2. Removed the invalid `categories` array.
3. Updated the `tags` array to include both `'password-managers'` and `'software-reviews'` to properly cluster the content and generate the correct internal routes.

## Validation Results

- ✓ `npm run validate-mdx`: Passed successfully.
- ✓ `npm run build`: Passed successfully. (614 pages generated)
- ✓ Article is now properly categorized under `Software Reviews`.
- ✓ Article properly clustered via `password-managers` tag.
- ✓ Contentlayer generated index and sitemap synchronized.

## Status Summary

- **Category Status:** SYNCHRONIZED
- **Cluster Status:** SYNCHRONIZED
- **Publication Status:** READY
