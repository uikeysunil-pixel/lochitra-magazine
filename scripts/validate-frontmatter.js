/* eslint-disable */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const REQUIRED_FIELDS = [
  'title',
  'summary',
  'date',
  'category',
  'tags',
  'authors',
  'featuredImage',
  'draft',
]
const RECOMMENDED_FIELDS = ['description', 'imageAlt', 'keywords', 'lastUpdated', 'categories']
const UNSUPPORTED_FIELDS = ['slug', 'readingTime', 'path', 'filePath', 'toc']

let hasErrors = false

function validateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let errors = []
  let warnings = []

  // Phase 5: Encoding Audit - Strip BOM safely
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1)
  }

  // Phase 6: Ensure frontmatter delimiters are detected correctly by trimming leading spaces
  content = content.replace(/^\s+---/, '---')

  // Check line endings
  if (content.includes('\r\n')) {
    errors.push('File contains CRLF line endings. Must use LF.')
  }

  // Check hidden control characters (excluding newline, carriage return, tab)
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content)) {
    errors.push('File contains hidden control characters.')
  }

  let parsed
  try {
    parsed = matter(content)
  } catch (e) {
    errors.push(`❌ Failed to parse frontmatter: ${e.message}`)
    report(filePath, errors, warnings)
    return
  }

  if (!parsed || Object.keys(parsed.data).length === 0) {
    errors.push(`❌ Failed to parse frontmatter: No valid YAML frontmatter detected.`)
    report(filePath, errors, warnings)
    return
  }

  const data = parsed.data
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: '${field}'`)
    }
  }

  // Check unsupported fields
  for (const field of UNSUPPORTED_FIELDS) {
    if (field in data) {
      errors.push(
        `Unsupported computed field detected: '${field}'. This is generated automatically.`
      )
    }
  }

  // Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      warnings.push(`Missing recommended field: '${field}'`)
    }
  }

  // Type validation (only if they exist)
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push(`'tags' must be an array.`)
  }
  if (data.authors !== undefined && !Array.isArray(data.authors)) {
    errors.push(`'authors' must be an array.`)
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    errors.push(`'draft' must be a boolean.`)
  }
  if (data.date !== undefined) {
    if (isNaN(Date.parse(String(data.date)))) {
      errors.push(`'date' must be a valid date string (e.g., YYYY-MM-DD).`)
    }
  }

  report(filePath, errors, warnings)
}

function report(filePath, errors, warnings) {
  if (errors.length > 0 || warnings.length > 0) {
    console.log(`\n📄 ${filePath}`)
    for (const err of errors) {
      console.error(`  ❌ ERROR: ${err}`)
      hasErrors = true
    }
    for (const warn of warnings) {
      console.warn(`  ⚠️  WARNING: ${warn}`)
    }
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

const args = process.argv.slice(2)
let files = []

if (args.length > 0) {
  files = args.filter((f) => f.endsWith('.mdx'))
} else {
  files = walkDir(path.join(process.cwd(), 'data', 'blog'))
}

let fileCount = files.length
console.log(`Validating ${fileCount} MDX files...`)

for (const file of files) {
  validateFile(file)
}

if (hasErrors) {
  console.error(`\n❌ Validation failed. Errors found in frontmatter.`)
  process.exit(1)
} else {
  console.log(`\n✅ Validation passed for all ${fileCount} files.`)
}
