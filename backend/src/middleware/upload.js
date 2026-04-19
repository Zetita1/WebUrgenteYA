const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const UPLOADS_DIR = path.join(__dirname, '../../uploads/technicians');

// Asegurar que el directorio existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${uuidv4()}.jpg`);
  },
});

const fileFilter = (req, file, cb) => {
  // Aceptar todo — Android cámara envía application/octet-stream, vacío, etc.
  // Sharp valida si realmente es imagen durante el procesamiento
  console.log(`[upload] mimetype: "${file.mimetype}" | originalname: ${file.originalname}`);
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = upload;
