const fs = require('fs');
const path = require('path');

const blogDir = 'data/blog';
const webpDir = 'public/static/images/blog';
const sourceDir = 'assets/image-source';

let errors = 0;
let warnings = 0;

function walkDir(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

const allMdx = walkDir(blogDir).filter(f => f.endsWith('.mdx'));
const allSourcePngs = walkDir(sourceDir).filter(f => f.endsWith('.png'));
const allWebps = walkDir(webpDir).filter(f => f.endsWith('.webp'));

const referencedWebps = new Set();
const referencedPngs = new Set();

console.log('Validating Locitra Featured Images Pipeline...\n');

allMdx.forEach(mdxPath => {
    const slug = path.basename(mdxPath, '.mdx');
    const content = fs.readFileSync(mdxPath, 'utf8');
    
    // Find featuredImage
    const match = content.match(/^featuredImage:\s*[\"'](.*?)[\"']/m);
    if (!match) return; // Some posts might not have a featured image
    
    const featuredImagePath = match[1];
    const imageBasename = path.basename(featuredImagePath, '.webp');
    const expectedImagePath = `/static/images/blog/${slug}.webp`;
    
    // 1. Verify filename exactly matches article slug
    if (imageBasename !== slug || featuredImagePath !== expectedImagePath) {
        console.error(`[ERROR] Mismatched filename in ${mdxPath}`);
        console.error(`  Expected: ${expectedImagePath}`);
        console.error(`  Found:    ${featuredImagePath}`);
        errors++;
    }
    
    // 2. Verify the referenced WebP exists
    const webpAbsolutePath = path.join(process.cwd(), 'public', featuredImagePath.startsWith('/') ? featuredImagePath.slice(1) : featuredImagePath);
    if (!fs.existsSync(webpAbsolutePath)) {
        console.error(`[ERROR] Missing WebP image for ${slug}`);
        console.error(`  Path: ${webpAbsolutePath}`);
        errors++;
    } else {
        referencedWebps.add(webpAbsolutePath.toLowerCase());
    }
    
    // 3. Verify a matching PNG exists in assets/image-source (if applicable)
    const expectedPngName = `${slug}.png`;
    const matchingPngs = allSourcePngs.filter(p => path.basename(p) === expectedPngName);
    
    if (matchingPngs.length === 0) {
        // Just a warning, as some might not have source PNGs yet
        console.warn(`[WARN] Missing source PNG for ${slug}`);
        console.warn(`  Expected: ${expectedPngName} in ${sourceDir}/*`);
        warnings++;
    } else if (matchingPngs.length > 1) {
        console.error(`[ERROR] Duplicate source PNGs found for ${slug}`);
        matchingPngs.forEach(p => console.error(`  Found: ${p}`));
        errors++;
    } else {
        referencedPngs.add(matchingPngs[0]);
    }
});

// 4. Report unreferenced duplicate images (orphans)
allWebps.forEach(webp => {
    const absoluteWebp = path.resolve(webp).toLowerCase();
    if (!referencedWebps.has(absoluteWebp)) {
        console.error(`[ERROR] Orphaned/Duplicate WebP image found:`);
        console.error(`  ${webp}`);
        console.error(`  This image is not referenced by any MDX file.`);
        errors++;
    }
});

console.log('\n--- Summary ---');
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
    console.error('\nValidation FAILED. Please fix the errors above.');
    process.exit(1);
} else {
    console.log('\nValidation PASSED. The Locitra Gold Standard is maintained.');
    process.exit(0);
}
