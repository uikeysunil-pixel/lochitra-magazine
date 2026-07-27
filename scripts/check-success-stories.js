const fs = require('fs')
const path = require('path')
const { imageSize } = require('image-size')

const blogDir = path.join(__dirname, '../data/blog')
const publicDir = path.join(__dirname, '../public')

const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx'))
const successStories = []

files.forEach((f) => {
  const filePath = path.join(blogDir, f)
  const content = fs.readFileSync(filePath, 'utf8')
  if (
    /category:\s*['"]?success-stories['"]?/i.test(content) ||
    /categories:[\s\S]*?- ['"]?success-stories['"]?/i.test(content)
  ) {
    const match = content.match(/featuredImage:\s*['"]?(.*?)['"]?$/m)
    const featuredImage = match ? match[1].trim() : null
    let imgExists = false
    let width = 0
    let height = 0
    let format = ''

    if (featuredImage) {
      const imgPath = path.join(
        publicDir,
        featuredImage.startsWith('/') ? featuredImage.slice(1) : featuredImage
      )
      imgExists = fs.existsSync(imgPath)
      if (imgExists) {
        try {
          const dimensions = imageSize(fs.readFileSync(imgPath))
          width = dimensions.width
          height = dimensions.height
          format = dimensions.type
        } catch (e) {
          format = 'error: ' + e.message
        }
      }
    }

    successStories.push({
      file: f,
      slug: f.replace('.mdx', ''),
      featuredImage,
      imgExists,
      width,
      height,
      format,
      validDimensions: width === 1200 && height === 630 && format === 'webp',
    })
  }
})

console.log(`Found ${successStories.length} Success Stories articles:\n`)
successStories.forEach((item, index) => {
  console.log(`${index + 1}. [${item.file}]`)
  console.log(`   Image path: ${item.featuredImage}`)
  console.log(`   Exists: ${item.imgExists ? 'YES' : 'NO'}`)
  console.log(`   Dimensions: ${item.width} x ${item.height} (${item.format})`)
  console.log(`   Valid (1200x630 webp): ${item.validDimensions ? '✅ YES' : '❌ NO'}\n`)
})

const invalidCount = successStories.filter((s) => !s.validDimensions).length
console.log(
  `Summary: ${successStories.length - invalidCount}/${successStories.length} images passed 1200x630 WebP verification.`
)
