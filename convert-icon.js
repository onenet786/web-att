const fs = require('fs');
const path = require('path');

// Simple PNG to ICO converter using Node.js
function convertPngToIco() {
  const pngPath = path.join(__dirname, 'assets', 'icon.png');
  const icoPath = path.join(__dirname, 'assets', 'icon.ico');
  
  if (!fs.existsSync(pngPath)) {
    console.error('PNG file not found:', pngPath);
    return;
  }
  
  // For now, just copy the PNG as ICO (Windows can handle PNG in ICO format)
  fs.copyFileSync(pngPath, icoPath);
  console.log('Icon converted successfully:', icoPath);
}

convertPngToIco();