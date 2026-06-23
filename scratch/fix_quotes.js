const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '../data/blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

let filesModified = 0;
let blockquotesRemoved = 0; // count of blocks removed
let tablesRepaired = 0;

for (const file of files) {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check category
  if (!content.includes("category: 'technology'") && !content.includes('category: "technology"')) {
    continue;
  }

  const lines = content.split('\n');
  const newLines = [];
  let inBlockquote = false;
  let currentBlockquote = [];
  let blockquoteStartIdx = -1;

  let fileModified = false;

  const processBlockquote = (block) => {
    // Determine if it's a giant callout, table, or heading
    let hasHeading = false;
    let hasTable = false;
    let textLines = 0;
    
    for (const line of block) {
      const stripped = line.replace(/^>\s?/, '');
      if (stripped.startsWith('#')) hasHeading = true;
      if (stripped.startsWith('|')) hasTable = true;
      if (stripped.trim().length > 0) textLines++;
    }

    // A blockquote is "giant" or needs repair if it has a table, a heading, or spans multiple paragraphs (we approximate by total lines > 3)
    if (hasHeading || hasTable || block.length > 3) {
      if (hasTable) tablesRepaired++;
      blockquotesRemoved++;
      fileModified = true;
      return block.map(line => line.replace(/^>\s?/, ''));
    }
    return block;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('>')) {
      if (!inBlockquote) {
        inBlockquote = true;
        currentBlockquote = [];
      }
      currentBlockquote.push(line);
    } else {
      if (inBlockquote) {
        // We encountered the end of a blockquote. But wait! Sometimes there are empty lines within a blockquote that do not start with `>`. 
        // Wait, in standard markdown, a blockquote can continue if there's no blank line, or maybe they strictly start with `>`. 
        // Looking at the example, blank lines in the blockquote also start with `> ` (e.g. `> \n`).
        // What if there's a genuine empty line between blockquotes? Let's check the next few lines.
        // Actually, if the line doesn't start with `>`, the blockquote has ended.
        newLines.push(...processBlockquote(currentBlockquote));
        inBlockquote = false;
        currentBlockquote = [];
      }
      newLines.push(line);
    }
  }

  if (inBlockquote) {
    newLines.push(...processBlockquote(currentBlockquote));
  }

  if (fileModified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    filesModified++;
    console.log(`Repaired: ${file}`);
  }
}

console.log(`Files modified: ${filesModified}`);
console.log(`Blockquotes removed: ${blockquotesRemoved}`);
console.log(`Tables repaired: ${tablesRepaired}`);
