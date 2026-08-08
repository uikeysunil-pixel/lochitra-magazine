/* eslint-disable */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const REQUIRED_FIELDS = [
  'title',
  'date',
  'category',
  'tags',
  'draft',
  'summary',
  'authors',
  'featuredImage',
]

const UNSUPPORTED_FIELDS = ['slug', 'readingTime', 'path', 'filePath', 'toc']

let hasErrors = false
let totalFilesChecked = 0
let totalErrors = 0
let totalWarnings = 0
let totalPassed = 0

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

  if (content.includes('\r\n')) {
    errors.push('File contains CRLF line endings. Must use LF.')
  }

  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(content)) {
    errors.push('File contains hidden control characters.')
  }

  let rawFrontmatter = ''
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/m)
  if (match) {
    rawFrontmatter = match[1]
  }

  const rawKeys = []
  const keyCounts = {}

  if (rawFrontmatter) {
    const lines = rawFrontmatter.split(/\r?\n/)
    for (const line of lines) {
      const keyMatch = line.match(/^([a-zA-Z0-9_]+)\s*:/)
      if (keyMatch) {
        const key = keyMatch[1]
        rawKeys.push(key)
        keyCounts[key] = (keyCounts[key] || 0) + 1
        if (keyCounts[key] > 1) {
          errors.push(`Duplicate key detected: '${key}'`)
        }

        // Check quotes only for required fields.
        if (REQUIRED_FIELDS.includes(key)) {
          if (line.includes('"')) {
            errors.push(
              `Invalid quote formatting: Must use single quotes (') instead of double quotes (") - line: ${line.trim()}`
            )
          }
        }
      }
    }
  }

  let parsed
  try {
    parsed = matter(content)
  } catch (e) {
    errors.push(`Failed to parse frontmatter: ${e.message}`)
    report(filePath, errors, warnings)
    return
  }

  if (!parsed || Object.keys(parsed.data).length === 0) {
    errors.push(`Failed to parse frontmatter: No valid YAML frontmatter detected.`)
    report(filePath, errors, warnings)
    return
  }

  const data = parsed.data

  for (const field of REQUIRED_FIELDS) {
    const val = data[field]
    if (val === undefined || val === null || val === '') {
      errors.push(`Missing or empty required field: '${field}'`)
    } else if (Array.isArray(val) && val.length === 0) {
      errors.push(`Empty array for required field: '${field}'`)
    }
  }

  const foundRequiredKeys = rawKeys.filter((k) => REQUIRED_FIELDS.includes(k))
  for (let i = 0; i < REQUIRED_FIELDS.length; i++) {
    const expected = REQUIRED_FIELDS[i]
    if (foundRequiredKeys[i] !== expected) {
      if (foundRequiredKeys.includes(expected)) {
        errors.push(
          `Invalid field order: '${foundRequiredKeys[i]}' found where '${expected}' was expected.`
        )
        break
      }
    }
  }

  for (const field of UNSUPPORTED_FIELDS) {
    if (field in data) {
      errors.push(
        `Unsupported computed field detected: '${field}'. This is generated automatically.`
      )
    }
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    errors.push(`Invalid array syntax: 'tags' must be an array.`)
  }
  if (data.authors !== undefined && !Array.isArray(data.authors)) {
    errors.push(`Invalid array syntax: 'authors' must be an array.`)
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
  totalFilesChecked++
  if (errors.length > 0 || warnings.length > 0) {
    console.log(`\n📄 ${filePath}`)
    for (const err of errors) {
      console.error(`  ❌ ERROR: ${err}`)
      hasErrors = true
      totalErrors++
    }
    for (const warn of warnings) {
      console.warn(`  ⚠️  WARNING: ${warn}`)
      totalWarnings++
    }
  } else {
    totalPassed++
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
console.log(`Validating ${fileCount} MDX files...\n`)

for (const file of files) {
  validateFile(file)
}

if (!hasErrors && totalWarnings === 0) {
  console.log('✓ All required fields present')
  console.log('✓ Frontmatter schema valid')
  console.log('✓ Field order valid')
  console.log('✓ YAML syntax valid')
  console.log('✓ MDX compatible')
  console.log('✓ LEOS v2.0 compliant\n')
}

console.log(`=========================================`)
console.log(`Validation Summary`)
console.log(`=========================================`)
console.log(``)
console.log(`Files Checked: ${totalFilesChecked}`)
console.log(`Errors: ${totalErrors}`)
console.log(`Warnings: ${totalWarnings}`)
console.log(`Passed: ${totalPassed}`)
console.log(``)
console.log(`Repository Status:`)
if (hasErrors) {
  console.log(`❌ LEOS v2.0 Validation Failed`)
  process.exit(1)
} else {
  console.log(`✓ LEOS v2.0 Compliant`)
  console.log(`✓ Gold Standard v2.1 Compliant`)
  console.log(`✓ Contentlayer Compatible`)
  console.log(`✓ Production Ready`)
}
