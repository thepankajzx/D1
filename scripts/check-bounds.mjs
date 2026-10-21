import fs from 'fs';

function getPathBounds(svgContent) {
  // Extract all coordinates from path d
  const matches = svgContent.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!matches) return null;
  const nums = matches.map(Number).filter(n => !isNaN(n));
  // Let's get min/max coordinates
  // Or better, let's write a node script using svg-path-bounds or regex coordinate parser
  return nums;
}

const logoBlack = fs.readFileSync('G:/STITCH HABIT TRACKER/definite-habit-tracker/public/logo-black.svg', 'utf8');
const dOnly = fs.readFileSync('G:/STITCH HABIT TRACKER/definite-habit-tracker/public/icon-d-black.svg', 'utf8');

console.log("Logo viewBox matches:", logoBlack.match(/viewBox="[^"]+"/));
console.log("D only viewBox matches:", dOnly.match(/viewBox="[^"]+"/));
