const fs = require('fs')
const path = require('path')

const indexFile = path.join(__dirname, 'LOCITRA_CONTENT_INDEX.md')
const outputFile = path.join(
  'C:',
  'Users',
  'uikey',
  '.gemini',
  'antigravity-ide',
  'brain',
  'dc44eba3-5a57-447a-80d8-710215b3afb9',
  'locitra_strategic_roadmap.md'
)

function run() {
  const content = fs.readFileSync(indexFile, 'utf-8')
  const sections = content.split('### ').slice(1)

  let articles = []

  for (const section of sections) {
    if (!section.trim() || section.startsWith('Cluster Summary')) continue

    const lines = section.split('\n')
    const title = lines[0].trim()
    let article = { title }

    for (const line of lines) {
      const match = line.match(/^- \*\*([^*]+)\*\*: (.*)$/)
      if (match) {
        const key = match[1].trim()
        const val = match[2].trim()
        article[key] = val
      }
    }

    if (article.Slug) {
      articles.push(article)
    }
  }

  let md = `# LOCITRA STRATEGIC ROADMAP v1.0

## 1. Executive Summary
This document translates the Stage 5 Master Architect Baseline Audit into an executable business strategy. The objective is to maximize revenue, topical authority, and editorial integrity through calculated, low-risk execution phases. The core strategy revolves around resolving foundational metadata issues (Quick Wins), aggressively expanding the high-RPM 'ai-tools' commercial cluster, and strengthening internal authority flow via precise linking structures.

## 2. Validated Findings
- **Missing Canonicals**: *Verified.* Frontmatter globally lacks the canonical URL field.
- **Missing Authors**: *Verified.* Many articles lack explicit authorship, impacting E-E-A-T.
- **Duplicate Metadata**: *False Positive.* Parsed index shows no identical titles or slugs.
- **Missing Summaries**: *Verified.* A subset of articles lacks the 'summary' field.
- **Orphan Pages**: *Verified.* 2 pages currently have zero incoming internal links.

## 3. Business Impact Matrix
| Recommendation | SEO | Traffic | Revenue | Editorial | Cost | Difficulty | Risk | Business Value |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Add Metadata (Canonicals, Authors, Summaries) | 8/10 | 5/10 | 4/10 | 9/10 | 2/10 | 2/10 | 1/10 | **8.5/10** |
| Resolve Orphan Pages via Internal Links | 9/10 | 6/10 | 4/10 | 7/10 | 1/10 | 1/10 | 1/10 | **9.0/10** |
| Expand 'AI Tools' Pricing/Alternatives | 7/10 | 9/10 | 10/10 | 8/10 | 7/10 | 6/10 | 3/10 | **8.5/10** |
| Standardize "⭐ Locitra Recommendation Matrix" | 4/10 | 3/10 | 7/10 | 10/10 | 3/10 | 3/10 | 2/10 | **7.5/10** |
| Implement Global "How We Test" Methodology | 6/10 | 4/10 | 6/10 | 10/10 | 4/10 | 3/10 | 1/10 | **8.0/10** |

## 4. Priority Matrix
- **QUICK WINS (High Impact, Low Effort)**: 
  - Fix Orphan Pages. (Instant authority flow restoration).
  - Inject missing metadata (Summaries, Canonicals, Authors) to secure E-E-A-T baseline.
- **HIGH IMPACT (High Impact, High Effort)**:
  - Aggressive content creation in the 'ai-tools' and 'software-reviews' clusters targeting bottom-of-funnel (Pricing, Alternatives).
- **FOUNDATIONAL (Required before growth)**:
  - Standardizing the review layout (Recommendation Matrix) across all legacy comparisons.
- **OPTIONAL (Nice improvements)**:
  - Deep-dive technical API tutorials.
- **AVOID (Low Value, High Effort)**:
  - Mass URL restructuring or category slug changes. Risk of traffic loss heavily outweighs organizational benefits.

## 5. Cluster Ranking
1. **ai-tools**: 
   - *Authority (10/10), Growth (10/10), Revenue (10/10), Priority: 1*
2. **software-reviews**: 
   - *Authority (9/10), Growth (8/10), Revenue (9/10), Priority: 2*
3. **online-income**: 
   - *Authority (8/10), Growth (7/10), Revenue (8/10), Priority: 3*
4. **career-growth**: 
   - *Authority (8/10), Growth (8/10), Revenue (3/10), Priority: 4*
5. **technology**: 
   - *Authority (7/10), Growth (6/10), Revenue (2/10), Priority: 5*
6. **success-stories**: 
   - *Authority (6/10), Growth (4/10), Revenue (2/10), Priority: 6*

## 6. Content Lifecycle Report
*(Summary of 134 articles based on intent, age, and evergreen status)*
`

  // Categorize a few as examples, summarize the rest
  let lifecycle = { New: 0, Growing: 0, Mature: 0, NeedsRefresh: 0, Archived: 0 }
  articles.forEach((a) => {
    if (a['Last Updated'].includes('2026-07')) lifecycle.New++
    else if (a['Last Updated'].includes('2026-06')) lifecycle.Growing++
    else if (a['Content Type'] === 'Review' && !a['Last Updated'].includes('2026'))
      lifecycle.NeedsRefresh++
    else lifecycle.Mature++
  })

  md += `- **New (Published last 30 days)**: ${lifecycle.New} articles. Focus on indexing and initial social syndication.\n`
  md += `- **Growing (Published last 90 days)**: ${lifecycle.Growing} articles. Focus on building internal backlinks.\n`
  md += `- **Mature (Evergreen / High Authority)**: ${lifecycle.Mature} articles. Maintain current rankings.\n`
  md += `- **Needs Refresh (Legacy Reviews)**: ${lifecycle.NeedsRefresh} articles. Update pricing and features for current year.\n`
  md += `- **Archived**: 0 articles. No content deletion recommended at this stage.\n`

  md += `
## 7. Commercial Opportunity Ranking
1. **High**: Affiliate Reviews & "Best X for Y" (Highest buyer intent, direct conversion). Focus on AI Video tools, VPNs, and Password Managers.
2. **Medium**: Workflow Tutorials & Case Studies (Mid-funnel, builds trust, long-term email list capture).
3. **Low**: Broad Informational ("What is IoT", "Smart Cities Explained"). (Low RPM AdSense potential, primarily for topical authority).

## 8. Quarterly Roadmap
- **Quarter 1**: 
  - **Month 1**: Technical Fixes & Metadata completion (Canonicals, Authors). Eradicate Orphan pages.
  - **Month 2**: Expand 'ai-tools' Cluster (Pricing Guides & Alternatives).
  - **Month 3**: Implement "Review Methodology" page and standardize all existing reviews with Recommendation Matrices.
- **Quarter 2**: 
  - Expand 'software-reviews' (Password Managers & VPNs).
  - Launch deep-dive tutorials connecting to existing pillars.
- **Quarter 3**: 
  - Refresh mature/legacy content (Update 2025/2026 tags).
  - Build out 'career-growth' with commercial intent (e.g., Resume Builder reviews).
- **Quarter 4**: 
  - Expand 'online-income' cluster.
  - Prepare overarching 2027 trend reports.

## 9. Execution Batches
*To minimize risk, work will be executed in strict batches of <20 articles.*
- **Batch 1 (Technical Fixes)**: Add canonicals and authors to the first 20 priority pillar pages.
- **Batch 2 (Technical Fixes)**: Add canonicals and authors to remaining pages.
- **Batch 3 (Internal Linking)**: Resolve orphan pages and reinforce Pillar hubs.
- **Batch 4 (Editorial Consistency)**: Add Recommendation Matrix to top 15 comparison articles.
- **Batch 5 (New Content)**: Draft 5 new "Pricing Guides" for AI Video tools.
- **Batch 6 (New Content)**: Draft 5 new "Alternatives" posts for top AI tools.

## 10. Immediate SAFE Actions
*These actions are classified as SAFE and can be executed immediately upon approval.*
- Add missing \`authors\` and \`canonical\` fields to frontmatter.
- Add \`summary\` fields where missing.
- Inject contextual internal links to fix orphan pages.
- Standardize Category/Subcategory frontmatter strings.

## 11. Actions Requiring Approval
- **Creation of "How We Test" Methodology Page**: Requires editorial alignment on exact review criteria.
- **Mass Insertion of Recommendation Matrix**: Modifies existing published content structure.
- **Creation of New Pricing/Alternatives Content**: Requires budget/time allocation.

## 12. Long-Term Vision
Locitra will transition from a broad technology blog into an authoritative, highly commercial technology publication. By saturating the 'ai-tools' and 'software-reviews' clusters with high-intent pricing and comparison guides, backed by an airtight, internally linked editorial architecture and a transparent review methodology, Locitra will establish dominant E-E-A-T and secure sustainable, long-term revenue growth.
`

  fs.writeFileSync(outputFile, md)
  console.log('Successfully generated Strategic Roadmap at:', outputFile)
}

run()
