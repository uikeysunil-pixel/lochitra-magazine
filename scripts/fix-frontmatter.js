/* eslint-disable */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

function fixFile(filePath) {
  let originalContent = fs.readFileSync(filePath, 'utf8')
  let content = originalContent

  // 1. Remove hidden control characters (except newline, carriage return, tab)
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  // 2. Convert CRLF to LF
  content = content.replace(/\r\n/g, '\n')

  let parsed
  try {
    parsed = matter(content)
  } catch (e) {
    console.error(`❌ ${filePath}: Could not parse YAML, skipping auto-fix.`)
    return
  }

  // 3. Normalize YAML
  // matter.stringify uses js-yaml to dump the frontmatter.
  // We can pass dump options if needed.
  let fixedContent = matter.stringify(parsed.content, parsed.data, {
    lineWidth: -1, // don't wrap long lines
    noCompatMode: true,
  })

  // Ensure file ends with a single newline
  fixedContent = fixedContent.trimEnd() + '\n'

  if (fixedContent !== originalContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf8')
    console.log(`✅ Fixed: ${filePath}`)
  }
}

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

const files = walkDir(path.join(process.cwd(), 'data', 'blog'))
console.log(`Checking ${files.length} MDX files for formatting fixes...`)

for (const file of files) {
  fixFile(file)
}

console.log('🎉 Auto-fix complete.')
