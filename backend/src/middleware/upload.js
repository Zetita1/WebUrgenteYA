const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_MIME = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp',                        // Android / WhatsApp
  'image/heic', 'image/heif',          // iPhone
  'image/bmp', 'image/tiff',           // otros formatos comunes
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/technicians'));
  },
  filename: (req, file, cb) => {
    const ext = '.jpg'; // siempre guardamos como jpg después de procesar
    cb(null, `${Date.now()}_${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG y PNG'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = upload;
