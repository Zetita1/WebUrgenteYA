const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/technicians');

async function processImage(filePath) {
  // Verificar que el archivo existe antes de procesar
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  const outputPath = filePath.replace(/\.[^.]+$/, '_proc.jpg');

  try {
    await sharp(filePath)
      .rotate()                                        // Corrige orientación EXIF (fotos de celular)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // Reemplaza el original con el procesado
    fs.unlinkSync(filePath);
    fs.renameSync(outputPath, filePath);
  } catch (sharpErr) {
    // Si Sharp no puede procesar el formato, guardar el original igual
    console.warn('Sharp no pudo procesar imagen, se guarda original:', sharpErr.message);
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
    // No lanzar error — el archivo original queda guardado y se sube igual
  }
}

module.exports = { processImage };
