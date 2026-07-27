const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
function getWebPDimensions(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Not a valid WEBP file')
  }
  const format = buf.toString('ascii', 12, 16)
  if (format === 'VP8X') {
    return { width: 1 + buf.readUInt24LE(24), height: 1 + buf.readUInt24LE(27) }
  } else if (format === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  } else if (format === 'VP8L') {
    const b = buf.readUInt32LE(21)
    return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) }
  }
  throw new Error('Unknown VP8 chunk format')
}

const BLOG_DIR = path.join(__dirname, 'data', 'blog')
const IMAGES_DIR = path.join(__dirname, 'public', 'static', 'images', 'blog')

const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

const report = {
  totalArticles: files.length,
  missingImages: [],
  brokenPaths: [],
  wrongExtensions: [],
  incorrectDimensions: [],
  missingWebP: [],
}

for (const file of files) {
  const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
  const parsed = matter(content)
  const slug = file.replace('.mdx', '')
  const frontmatterPath = parsed.data.featuredImage

  if (!frontmatterPath) {
    report.brokenPaths.push({ file, issue: 'No featuredImage in frontmatter' })
    continue
  }

  const expectedPath = `/static/images/blog/${slug}.webp`

  if (frontmatterPath !== expectedPath) {
    report.brokenPaths.push({
      file,
      frontmatterPath,
      expectedPath,
      issue: 'Frontmatter path does not match expected exact slug path',
    })
  }

  if (!frontmatterPath.endsWith('.webp')) {
    report.wrongExtensions.push({ file, frontmatterPath })
    report.missingWebP.push({ file, frontmatterPath })
  }

  const imageBaseName = path.basename(frontmatterPath)
  const localImagePath = path.join(IMAGES_DIR, imageBaseName)

  if (!fs.existsSync(localImagePath)) {
    report.missingImages.push({ file, expectedImage: localImagePath })
  } else {
    try {
      const dimensions = getWebPDimensions(localImagePath)
      if (dimensions.width !== 1200 || dimensions.height !== 630) {
        report.incorrectDimensions.push({
          file,
          image: imageBaseName,
          width: dimensions.width,
          height: dimensions.height,
        })
      }
    } catch (e) {
      report.missingImages.push({ file, issue: 'Image corrupt or unreadable: ' + e.message })
    }
  }
}

fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2))
console.log('Audit complete, written to audit_report.json')
