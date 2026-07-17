# DEPLOYMENT CHECKLIST

**Target:** Proton Pass Review (2026)

## CI/CD Pipeline

- [ ] Push branch to GitHub
- [ ] Verify GitHub Actions tests pass
- [ ] Merge to `main`
- [ ] Monitor Vercel production deployment logs

## Post-Deployment Smoke Test

- [ ] Verify production build URL resolves correctly
- [ ] Check Homepage for latest article card
- [ ] Check Article Page for broken Markdown or layout shifts
- [ ] Verify Featured Image loads (WebP)
- [ ] Verify `<link rel="canonical">` matches frontmatter
- [ ] Verify `robots.txt` is not blocking the path
- [ ] Submit explicit URL to Google Search Console for priority indexing
- [ ] Verify real-time analytics tracking triggers on page load
