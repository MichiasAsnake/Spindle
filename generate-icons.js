// generate-icons.js - Creates simple icon files for the extension
const fs = require('fs');
const path = require('path');

// Function to create a simple SVG icon
function createSvgIcon(size, color) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" rx="5" ry="5"/>
  <text x="${size/2}" y="${size/2 + size/10}" 
        font-family="Arial" font-size="${size/2}" 
        text-anchor="middle" fill="white">PMS</text>
</svg>`;
}

// Function to save SVG file
function saveSvg(filename, content) {
  fs.writeFileSync(filename, content);
  console.log(`Created ${filename}`);
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'images');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate icons of different sizes
const sizes = [16, 48, 128];
const color = '#3498db'; // Blue color

sizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.svg`);
  saveSvg(iconPath, createSvgIcon(size, color));
});

console.log('Icon generation complete!'); 