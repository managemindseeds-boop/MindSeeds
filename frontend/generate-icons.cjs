const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const svgCode = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#10b981"/>
  <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, 'public');
  
  try {
    const svgBuffer = Buffer.from(svgCode);
    
    // Generate 192x192
    await sharp(svgBuffer)
      .resize(192, 192)
      .toFile(path.join(publicDir, 'icon-192x192.png'));
      
    // Generate 512x512
    await sharp(svgBuffer)
      .resize(512, 512)
      .toFile(path.join(publicDir, 'icon-512x512.png'));
      
    console.log('Successfully generated PNG icons!');
  } catch (err) {
    console.error('Failed to generate icons:', err);
  }
}

generateIcons();
