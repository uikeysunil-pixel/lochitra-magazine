/* eslint-disable */
const fs = require('fs')
const path = require('path')

function walkDir(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath))
    } else if (fullPath.endsWith('.mdx')) {
      results.push(fullPath)
    }
  }
  return results
}

const blogDir = path.join(process.cwd(), 'data', 'blog')
const files = walkDir(blogDir)
let brokenLinks = 0

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  // Match links like [text](/blog/slug) or [text](/blog/slug#anchor)
  const regex = /\[([^\]]+)\]\(\/blog\/([^)#]+)(?:#[^)]+)?\)/g

  let match
  while ((match = regex.exec(content)) !== null) {
    const slug = match[2]
    const targetFile = path.join(blogDir, slug + '.mdx')
    if (!fs.existsSync(targetFile)) {
      console.error(`❌ Broken link in ${path.basename(file)}: /blog/${slug}`)
      brokenLinks++
    }
  }
}

if (brokenLinks > 0) {
  console.error(`\nFound ${brokenLinks} broken internal links!`)
  process.exit(1)
} else {
  console.log('✅ 0 broken internal links found.')
}
