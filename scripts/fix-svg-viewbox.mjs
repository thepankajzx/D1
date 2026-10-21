import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const publicDir = 'G:/STITCH HABIT TRACKER/definite-habit-tracker/public';

// 1. Fix Wordmark Logo SVGs
// minX: 212.81, minY: 429.93, width: 689.05, height: 144.19
// Let's give it 2px safe padding: x=210, y=428, width=695, height=148
const wordmarkViewBox = 'viewBox="210 428 695 148"';

let logoBlack = fs.readFileSync(path.join(publicDir, 'logo-black.svg'), 'utf8');
logoBlack = logoBlack.replace(/viewBox="[^"]+"/, wordmarkViewBox)
                     .replace(/width="[^"]+"/, 'width="695"')
                     .replace(/height="[^"]+"/, 'height="148"');
fs.writeFileSync(path.join(publicDir, 'logo-black.svg'), logoBlack);
fs.writeFileSync(path.join(publicDir, 'brand-black.svg'), logoBlack);

let logoWhite = fs.readFileSync(path.join(publicDir, 'logo-white.svg'), 'utf8');
logoWhite = logoWhite.replace(/viewBox="[^"]+"/, wordmarkViewBox)
                     .replace(/width="[^"]+"/, 'width="695"')
                     .replace(/height="[^"]+"/, 'height="148"');
fs.writeFileSync(path.join(publicDir, 'logo-white.svg'), logoWhite);
fs.writeFileSync(path.join(publicDir, 'brand-white.svg'), logoWhite);

// 2. Fix D-Only Icon SVGs
// minX: 348.68, minY: 285.66, width: 470.84, height: 465.01
// Square bounding box: size=480, x=344, y=280
const dIconViewBox = 'viewBox="344 280 480 472"';

let dBlack = fs.readFileSync(path.join(publicDir, 'icon-d-black.svg'), 'utf8');
dBlack = dBlack.replace(/viewBox="[^"]+"/, dIconViewBox)
               .replace(/width="[^"]+"/, 'width="480"')
               .replace(/height="[^"]+"/, 'height="472"');
fs.writeFileSync(path.join(publicDir, 'icon-d-black.svg'), dBlack);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), dBlack);
fs.writeFileSync(path.join(publicDir, 'clean_d_only.svg'), dBlack);
fs.writeFileSync(path.join(publicDir, 'pwa-icon-master.svg'), dBlack);

let dWhite = fs.readFileSync(path.join(publicDir, 'icon-d-white.svg'), 'utf8');
dWhite = dWhite.replace(/viewBox="[^"]+"/, dIconViewBox)
               .replace(/width="[^"]+"/, 'width="480"')
               .replace(/height="[^"]+"/, 'height="472"');
fs.writeFileSync(path.join(publicDir, 'icon-d-white.svg'), dWhite);

// 3. Re-render all PNG icons from properly cropped SVGs
function renderSvg(svgStr, width) {
  const resvg = new Resvg(svgStr, {
    fitTo: {
      mode: 'width',
      value: width
    }
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

const iconTargets = [
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
  { name: 'extracted_d_mark.png', size: 512 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 }
];

for (const target of iconTargets) {
  const pngBuffer = renderSvg(dBlack, target.size);
  fs.writeFileSync(path.join(publicDir, target.name), pngBuffer);
  console.log(`Re-generated ${target.name} (${target.size}x${target.size})`);
}

const logoBlackPng = renderSvg(logoBlack, 1024);
fs.writeFileSync(path.join(publicDir, 'logo-black.png'), logoBlackPng);

const logoWhitePng = renderSvg(logoWhite, 1024);
fs.writeFileSync(path.join(publicDir, 'logo-white.png'), logoWhitePng);

console.log("All SVGs and PNGs successfully cropped and generated!");
