const path = require('path');
const fs = require('fs');

// Firmas mágicas de formatos de imagen válidos (primeros bytes del archivo)
function isValidImageBuffer(buf) {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // GIF: GIF87a o GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  // WebP: RIFF????WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  // HEIC/HEIF: ftyp a offset 4
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true;
  // BMP: BM
  if (buf[0] === 0x42 && buf[1] === 0x4D) return true;
  return false;
}

async function processImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  // Leer primeros 12 bytes para verificar que es imagen real
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  if (!isValidImageBuffer(buf)) {
    fs.unlinkSync(filePath); // eliminar archivo inválido
    throw new Error('El archivo no es una imagen válida');
  }

  console.log(`[imageProcessor] OK (sin procesar): ${path.basename(filePath)}`);
}

module.exports = { processImage };
