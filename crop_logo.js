const sharp = require('sharp');
// The original uncropped image was apexora_logo_1786921412124.png
// Let's copy it back first to start fresh
const fs = require('fs');
const originalPath = 'C:\\Users\\Sujal\\.gemini\\antigravity-ide\\brain\\1b578e5a-1f44-45b9-bda4-9818d8aed047\\apexora_logo_1786921412124.png';
fs.copyFileSync(originalPath, './public/logo.png');

sharp('./public/logo.png')
  .trim({ threshold: 220 }) // very aggressive trim to ignore slight gradients
  .toFile('./public/logo_cropped.png')
  .then(info => {
    console.log('Aggressive crop success:', info);
    fs.renameSync('./public/logo_cropped.png', './public/logo.png');
  })
  .catch(err => console.error(err));
