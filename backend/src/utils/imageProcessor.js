const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/technicians');

async function processImage(filePath) {
  const outputPath = filePath.replace(/\.[^.]+$/, '_proc.jpg');
  await sharp(filePath)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toFile(outputPath);

  // Reemplaza el original con el procesado
  fs.unlinkSync(filePath);
  fs.renameSync(outputPath, filePath);
}

module.exports = { processImage };
