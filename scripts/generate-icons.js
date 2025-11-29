/**
 * Icon Generation Script for PWA
 * 
 * This script generates placeholder PNG icons for the PWA manifest.
 * In production, replace these with properly designed icons.
 * 
 * To generate actual PNG icons from the SVG:
 * 1. Use a tool like Sharp, Jimp, or an online converter
 * 2. Or use design software like Figma/Photoshop
 * 
 * Icon sizes needed:
 * - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
 * - Maskable versions: 192x192, 512x512 (with safe zone padding)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG for each size (to be converted to PNG)
function generateIconSVG(size, isMaskable = false) {
    const padding = isMaskable ? size * 0.1 : 0; // 10% safe zone for maskable
    const innerSize = size - (padding * 2);
    const cx = size / 2;
    const cy = size / 2;
    const r = innerSize * 0.47;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  ${isMaskable ? `<rect width="${size}" height="${size}" fill="url(#bgGrad)"/>` : ''}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${isMaskable ? 'none' : 'url(#bgGrad)'}"/>
  
  <g transform="translate(${cx}, ${cy}) scale(${innerSize / 512})">
    <!-- Speech bubble -->
    <path d="M-80,-100 Q-120,-100 -120,-60 L-120,20 Q-120,60 -80,60 L-40,60 L-20,100 L0,60 L80,60 Q120,60 120,20 L120,-60 Q120,-100 80,-100 Z" 
          fill="white" stroke="white" stroke-width="4"/>
    
    <!-- Heart -->
    <path d="M0,-40 C-15,-60 -40,-50 -40,-30 C-40,-10 0,20 0,40 C0,20 40,-10 40,-30 C40,-50 15,-60 0,-40 Z" 
          fill="#0ea5e9" opacity="0.8"/>
  </g>
</svg>`;
}

// Generate SVG files (these would need to be converted to PNG)
sizes.forEach(size => {
    const svgContent = generateIconSVG(size, false);
    const filename = `icon-${size}x${size}.svg`;
    fs.writeFileSync(path.join(iconsDir, filename), svgContent);
    console.log(`Generated: ${filename}`);
});

// Generate maskable icons
[192, 512].forEach(size => {
    const svgContent = generateIconSVG(size, true);
    const filename = `icon-maskable-${size}x${size}.svg`;
    fs.writeFileSync(path.join(iconsDir, filename), svgContent);
    console.log(`Generated: ${filename} (maskable)`);
});

console.log('\n✅ SVG icons generated successfully!');
console.log('\n📝 Note: To convert SVGs to PNGs, you can use:');
console.log('   - Online tools like cloudconvert.com or svgtopng.com');
console.log('   - Sharp library: npm install sharp');
console.log('   - ImageMagick: convert icon.svg icon.png');
console.log('\n   Then rename the files to .png extension.\n');

