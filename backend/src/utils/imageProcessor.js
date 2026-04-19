const path = require('path');
const fs = require('fs');

// Sharp desactivado — causaba crashes y cuelgues al procesar fotos de cámara.
// Las fotos se guardan en su formato original (JPEG de cámara funciona directo en el navegador).

async function processImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  console.log(`[imageProcessor] OK (sin procesar): ${path.basename(filePath)}`);
}

module.exports = { processImage };
