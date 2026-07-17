# Locitra Article Count Audit Report

## 1. Root Cause Analysis

The apparent discrepancy between Contentlayer generating 144 documents and the homepage displaying "142+ Articles Published" is **by design and mathematically correct**.

Contentlayer manages multiple document types, not just articles. Specifically, it processes:

- **142** Blog Articles (`data/blog/**/*.mdx`)
- **2** Author Profiles (`data/authors/**/*.mdx`)

`142 + 2 = 144 Total Contentlayer Documents.`

The homepage counter is programmed to count **only published blog posts**, correctly excluding the 2 author profile documents. There are no missing articles.

---

## 2. Document Counts Discovered

| Document Type                    | Count   | Notes                                              |
| :------------------------------- | :------ | :------------------------------------------------- |
| **Total Contentlayer Documents** | **144** | Total items processed by Contentlayer              |
| Blog Articles (Total)            | 142     | All MDX files in `data/blog`                       |
| Published Blog Articles          | 142     | Counted on the homepage                            |
| Draft Articles                   | 0       | `draft: true`                                      |
| Author Documents                 | 2       | `data/authors` (e.g., default & sunil-kumar-uikey) |
| Pages                            | 0       | Not defined as a Contentlayer document type        |
| Hidden/Other                     | 0       | None found                                         |

---

## 3. Location of Homepage Counter

The homepage counter is **dynamically calculated** from Contentlayer's data at build time.

**File 1: `app/page.tsx` (Lines 56-61)**

```tsx
const sortedPosts = sortPosts(allBlogs)
const publishedPosts = sortedPosts.filter((p) => !p.draft)
const posts = allCoreContent(publishedPosts)
const postCount = publishedPosts.length // Dynamically calculates 142
const categoryCount = Object.keys(CATEGORIES).length
return <Main posts={posts} postCount={postCount} categoryCount={categoryCount} />
```

**File 2: `app/Main.tsx` (Lines 17-39)**

```tsx
function getTrustStats(postCount: number, categoryCount: number) {
  return [
    {
      id: 'articles',
      icon: ( ... ),
      label: `${postCount}+ Articles`, // Renders "142+ Articles"
      sub: 'Published',
    },
```

---

## 4. Intended Behavior & Comparison

The homepage counter is intended to count **Option B: only published blog posts**.
It actively filters out any documents where `draft: true` and only imports from `allBlogs` (ignoring `allAuthors`). This is the correct editorial behavior.

---

## 5. Contentlayer Configuration Verification

Inspected `contentlayer.config.ts`.

- `Blog` document type is defined to parse `blog/**/*.mdx`.
- `Authors` document type is defined to parse `authors/**/*.mdx`.
- The `makeSource` function exports `documentTypes: [Blog, Authors]`.
  This confirms the 144 output exactly matches the 142 blogs + 2 authors.

---

## 6. Homepage Data Verification

The homepage count is **automatically generated** and **accurate**. It is not hardcoded, manually maintained, or stale. It accurately reflects the current state of `data/blog`.

---

## 7. Fix Applied

**No code changes were necessary.**
The system is functioning perfectly. The minimum safe change is zero changes.

---

## 8. Final Validation Results

- ✓ **Homepage count is correct:** 142
- ✓ **Contentlayer count is correct:** 144 (142 articles + 2 authors)
- ✓ **No build regressions:** No files were modified during this audit.

**Status:** AUDIT COMPLETE. NO ACTION REQUIRED.
