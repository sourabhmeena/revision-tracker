const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function generatePWAAssets() {
  const publicDir = 'public';
  const svgIcon = path.join(publicDir, 'icon.svg');
  const svgNarrow = path.join(publicDir, 'screenshot-narrow.svg');
  const svgWide = path.join(publicDir, 'screenshot-wide.svg');

  console.log('Generating PNG icons and screenshots from SVG...');

  // Icon 192x192
  await sharp(svgIcon)
    .png()
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192.png'));
  
  // Icon 512x512
  await sharp(svgIcon)
    .png()
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Screenshot narrow 540x720
  await sharp(svgNarrow)
    .png()
    .resize(540, 720)
    .toFile(path.join(publicDir, 'screenshot-narrow.png'));

  // Screenshot wide 1280x720
  await sharp(svgWide)
    .png()
    .resize(1280, 720)
    .toFile(path.join(publicDir, 'screenshot-wide.png'));

  console.log('✅ All PNG assets generated!');
  console.log('Files created:');
  console.log('- icon-192.png');
  console.log('- icon-512.png');
  console.log('- screenshot-narrow.png');
  console.log('- screenshot-wide.png');
}

generatePWAAssets().catch(console.error);