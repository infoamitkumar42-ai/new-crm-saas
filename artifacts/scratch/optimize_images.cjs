const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
const publicDir = path.join(__dirname, '..', '..', 'public');

async function optimizeImages() {
  console.log('Starting image optimization...');

  // 1. Optimize Slides
  for (let i = 1; i <= 8; i++) {
    const pngPath = path.join(imagesDir, `slide${i}.png`);
    const webpPath = path.join(imagesDir, `slide${i}.webp`);

    if (fs.existsSync(pngPath)) {
      console.log(`Optimizing slide${i}.png -> slide${i}.webp`);
      const originalSize = fs.statSync(pngPath).size;
      
      await sharp(pngPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(webpPath);

      const newSize = fs.statSync(webpPath).size;
      const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      console.log(`Saved: ${savings}% (${(originalSize/1024).toFixed(1)} KB -> ${(newSize/1024).toFixed(1)} KB)`);

      // Delete the original PNG to save space
      fs.unlinkSync(pngPath);
    }
  }

  // 2. Optimize Logo
  const logoPath = path.join(publicDir, 'logo.jpg');
  const logoWebpPath = path.join(publicDir, 'logo.webp');
  if (fs.existsSync(logoPath)) {
    console.log('Optimizing logo.jpg -> logo.webp');
    const originalSize = fs.statSync(logoPath).size;
    
    await sharp(logoPath)
      .webp({ quality: 85 })
      .toFile(logoWebpPath);

    const newSize = fs.statSync(logoWebpPath).size;
    console.log(`Logo saved: ${((originalSize - newSize) / originalSize * 100).toFixed(1)}% (${(originalSize/1024).toFixed(1)} KB -> ${(newSize/1024).toFixed(1)} KB)`);
  }

  console.log('Image optimization complete!');
}

optimizeImages().catch(err => {
  console.error('Error optimizing images:', err);
  process.exit(1);
});
