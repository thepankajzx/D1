const fs = require('fs');
const path = require('path');

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  let newContent = content.replace(/<span\s+([^>]*material-symbols-outlined[^>]*)>\s*(.*?)\s*<\/span>/gs, (match, attributes, inner) => {
    inner = inner.trim();
    
    let nameProp = '';
    if (inner.startsWith('{') && inner.endsWith('}')) {
      nameProp = `name={${inner.slice(1, -1)}}`;
    } else if (inner.startsWith('`${') && inner.endsWith('}`')) {
      nameProp = `name={${inner.slice(1, -1)}}`;
    } else {
      nameProp = `name="${inner}"`;
    }
    
    let newAttrs = attributes.replace('material-symbols-outlined', '').trim();
    newAttrs = newAttrs.replace(/className="\s*"/g, '');
    newAttrs = newAttrs.replace(/class="\s*"/g, '');
    newAttrs = newAttrs.replace(/\s+/g, ' ');
    
    return `<Icon ${nameProp} ${newAttrs} />`;
  });

  if (newContent !== content) {
    let relPath = filepath.replace(/\\/g, '/').split('src/')[1];
    let depth = (relPath.match(/\//g) || []).length;
    let prefix = depth > 0 ? '../'.repeat(depth) : './';
    let importStmt = `import Icon from '${prefix}components/Icon';\n`;
    
    let importRegex = /^import .*?\n/gm;
    let match;
    let lastIndex = -1;
    while ((match = importRegex.exec(newContent)) !== null) {
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex !== -1) {
      newContent = newContent.slice(0, lastIndex) + importStmt + newContent.slice(lastIndex);
    } else {
      newContent = importStmt + newContent;
    }
    
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log(`Updated ${filepath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.jsx')) {
      processFile(p);
    }
  }
}

walk(path.join(__dirname, '..', 'src'));
