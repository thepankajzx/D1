import fs from 'fs';

function getPreciseBounds(svgContent) {
  // Extract all commands and coordinates
  const paths = svgContent.match(/d="([^"]+)"/g);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const p of paths) {
    const dStr = p.replace('d="', '').replace('"', '');
    // Match commands and number pairs
    const coords = dStr.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!coords) continue;
    for (let i = 0; i < coords.length; i += 2) {
      const x = parseFloat(coords[i]);
      const y = parseFloat(coords[i+1]);
      if (!isNaN(x)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      if (!isNaN(y)) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

const logoBlack = fs.readFileSync('G:/STITCH HABIT TRACKER/definite-habit-tracker/public/logo-black.svg', 'utf8');
const dOnly = fs.readFileSync('G:/STITCH HABIT TRACKER/definite-habit-tracker/public/icon-d-black.svg', 'utf8');

console.log("Logo bounds:", getPreciseBounds(logoBlack));
console.log("D only bounds:", getPreciseBounds(dOnly));
