import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const publicDir = 'G:/STITCH HABIT TRACKER/definite-habit-tracker/public';
const dSvgPath = path.join(publicDir, 'icon-d-black.svg');
const dSvgContent = fs.readFileSync(dSvgPath, 'utf8');

const logoBlackSvgPath = path.join(publicDir, 'logo-black.svg');
const logoBlackContent = fs.readFileSync(logoBlackSvgPath, 'utf8');

const logoWhiteSvgPath = path.join(publicDir, 'logo-white.svg');
const logoWhiteContent = fs.readFileSync(logoWhiteSvgPath, 'utf8');

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
  const pngBuffer = renderSvg(dSvgContent, target.size);
  fs.writeFileSync(path.join(publicDir, target.name), pngBuffer);
  console.log(`Generated ${target.name} (${target.size}x${target.size})`);
}

const logoBlackPng = renderSvg(logoBlackContent, 1024);
fs.writeFileSync(path.join(publicDir, 'logo-black.png'), logoBlackPng);
console.log('Generated logo-black.png (1024px)');

const logoWhitePng = renderSvg(logoWhiteContent, 1024);
fs.writeFileSync(path.join(publicDir, 'logo-white.png'), logoWhitePng);
console.log('Generated logo-white.png (1024px)');
