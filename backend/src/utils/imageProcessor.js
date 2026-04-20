const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

// Firmas mágicas de formatos de imagen válidos (primeros bytes del archivo)
function isValidImageBuffer(buf) {
  if (buf.length < 12) return false;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true; // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true; // PNG
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true; // GIF
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true; // WebP
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true; // HEIC
  if (buf[0] === 0x42 && buf[1] === 0x4D) return true; // BMP
  return false;
}

async function processImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  // Verificar magic bytes — rechazar archivos que no sean imágenes
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  if (!isValidImageBuffer(buf)) {
    fs.unlinkSync(filePath);
    throw new Error('El archivo no es una imagen válida');
  }

  const outputPath = filePath + '_proc.jpg';

  try {
    // ImageMagick: redimensionar a max 1200px, convertir a JPEG, corregir orientación EXIF, eliminar metadatos
    await execFileAsync('convert', [
      filePath,
      '-auto-orient',
      '-resize', '1200x1200>',
      '-quality', '82',
      '-strip',
      outputPath
    ], { timeout: 60000 });

    fs.unlinkSync(filePath);
    fs.renameSync(outputPath, filePath);
    const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
    console.log(`[imageProcessor] OK comprimido: ${path.basename(filePath)} → ${sizeMB}MB`);
  } catch (err) {
    console.warn(`[imageProcessor] ImageMagick falló, guardando original: ${err.message}`);
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}

module.exports = { processImage };
