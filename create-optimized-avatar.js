const fs = require('fs');
const path = require('path');

// Create a simple SVG avatar as a lightweight alternative
const svgAvatar = `<svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="75" cy="75" r="75" fill="url(#bg)"/>
  
  <!-- Person icon -->
  <g fill="white" opacity="0.9">
    <!-- Head -->
    <circle cx="75" cy="55" r="20"/>
    <!-- Body -->
    <path d="M75 85 C60 85, 45 95, 45 110 L45 130 L105 130 L105 110 C105 95, 90 85, 75 85 Z"/>
  </g>
</svg>`;

// Write the SVG to a file
const svgPath = path.join(__dirname, 'uploads', 'default-avatar-optimized.svg');
fs.writeFileSync(svgPath, svgAvatar);

console.log('✅ Created optimized SVG avatar:', svgPath);
console.log('📊 File size comparison:');

// Check file sizes
const originalPath = path.join(__dirname, 'uploads', 'default-avatar.png');
const originalSize = fs.statSync(originalPath).size;
const svgSize = fs.statSync(svgPath).size;

console.log(`   Original PNG: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Optimized SVG: ${svgSize} bytes (${(svgSize / 1024).toFixed(2)} KB)`);
console.log(`   Size reduction: ${((originalSize - svgSize) / originalSize * 100).toFixed(1)}%`);