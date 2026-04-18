const express = require('express');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const upload = require('../middleware/upload');
const { processImage } = require('../utils/imageProcessor');
const { mailNuevaResena } = require('../utils/mailer');

const router = express.Router();

// Rate limiter específico para reseñas: máx 2 por IP cada 24 horas
const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 2,
  keyGenerator: (req) => req.ip,
  message: { error: 'Has enviado demasiadas reseñas hoy. Intenta mañana.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: estadísticas de contacto de un técnico
function getContactStats(db, techId) {
  const now = new Date();
  const startThisMonth  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startLastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endLastMonth    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const thisMonth  = db.prepare('SELECT COUNT(*) as cnt FROM contact_clicks WHERE technician_id = ? AND clicked_at >= ?').get(techId, startThisMonth);
  const lastMonth  = db.prepare('SELECT COUNT(*) as cnt FROM contact_clicks WHERE technician_id = ? AND clicked_at >= ? AND clicked_at < ?').get(techId, startLastMonth, endLastMonth);
  const total      = db.prepare('SELECT COUNT(*) as cnt FROM contact_clicks WHERE technician_id = ?').get(techId);

  return {
    contacts_this_month: thisMonth.cnt,
    contacts_last_month: lastMonth.cnt,
    contacts_total: total.cnt,
  };
}

// GET perfil propio del técnico autenticado
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const tech = db.prepare(`
    SELECT t.*, ROUND(AVG(r.rating), 1) as avg_rating, COUNT(r.id) as review_count
    FROM technicians t
    LEFT JOIN reviews r ON r.technician_id = t.id AND r.status = 'approved'
    WHERE t.user_id = ?
    GROUP BY t.id
  `).get(req.user.id);

  if (!tech) return res.status(404).json({ error: 'No tienes un perfil de técnico asociado' });

  const images = db.prepare('SELECT filename FROM technician_images WHERE technician_id = ? ORDER BY sort_order ASC, created_at ASC').all(tech.id);
  const reviews = db.prepare(
    "SELECT id, rating, comment, reviewer_name, created_at FROM reviews WHERE technician_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 10"
  ).all(tech.id);

  const contactStats = getContactStats(db, tech.id);

  res.json({ ...tech, images, reviews, ...contactStats });
});

// PUT el maestro edita su propio perfil
router.put('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE user_id = ?').get(req.user.id);
  if (!tech) return res.status(404).json({ error: 'Perfil no encontrado' });

  const { phone, whatsapp, description, is_urgent_24h, covers_rm,
          years_experience, price_from, availability, services_list } = req.body;

  db.prepare(`
    UPDATE technicians SET
      phone = ?, whatsapp = ?, description = ?, is_urgent_24h = ?, covers_rm = ?,
      years_experience = ?, price_from = ?, availability = ?, services_list = ?
    WHERE user_id = ?
  `).run(
    phone ?? tech.phone,
    whatsapp ?? tech.whatsapp,
    description ?? tech.description,
    is_urgent_24h !== undefined ? (is_urgent_24h ? 1 : 0) : tech.is_urgent_24h,
    covers_rm !== undefined ? (covers_rm ? 1 : 0) : tech.covers_rm,
    years_experience !== undefined ? (years_experience || null) : tech.years_experience,
    price_from !== undefined ? (price_from || null) : tech.price_from,
    availability !== undefined ? (availability || null) : tech.availability,
    services_list !== undefined ? (services_list || null) : tech.services_list,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM technicians WHERE user_id = ?').get(req.user.id);
  res.json(updated);
});

// Sinónimos: palabras comunes → categoría real
const SYNONYMS = {
  'electricista': 'Electricidad', 'electrico': 'Electricidad', 'electrica': 'Electricidad',
  'enchufes': 'Electricidad', 'tablero': 'Electricidad', 'cortocircuito': 'Electricidad',
  'gasfiter': 'Gasfitería', 'gasfitero': 'Gasfitería', 'cañeria': 'Gasfitería',
  'cañería': 'Gasfitería', 'fuga': 'Gasfitería', 'agua': 'Gasfitería', 'calefon': 'Gasfitería',
  'calefón': 'Gasfitería', 'grifo': 'Gasfitería', 'llave': 'Gasfitería',
  'refrigerador': 'Refrigeración', 'freezer': 'Refrigeración', 'frio': 'Refrigeración',
  'frío': 'Refrigeración', 'gas': 'Refrigeración',
  'computador': 'Computadores', 'laptop': 'Computadores', 'pc': 'Computadores',
  'notebook': 'Computadores', 'computadora': 'Computadores', 'virus': 'Computadores',
  'red': 'Computadores', 'wifi': 'Computadores', 'internet': 'Computadores',
  'cerrajero': 'Cerrajería', 'chapa': 'Cerrajería', 'cerradura': 'Cerrajería',
  'puerta': 'Cerrajería', 'llave': 'Cerrajería', 'candado': 'Cerrajería',
  'pintor': 'Pintura', 'pintar': 'Pintura', 'pared': 'Pintura', 'muro': 'Pintura',
  'albañil': 'Albañilería', 'ceramica': 'Albañilería', 'cerámica': 'Albañilería',
  'piso': 'Albañilería', 'baldosa': 'Albañilería', 'estuco': 'Albañilería',
  'jardinero': 'Jardinería', 'pasto': 'Jardinería', 'jardin': 'Jardinería',
  'jardín': 'Jardinería', 'poda': 'Jardinería', 'arbol': 'Jardinería', 'árbol': 'Jardinería',
  'lavadora': 'Electrodomésticos', 'microondas': 'Electrodomésticos', 'cocina': 'Electrodomésticos',
  'horno': 'Electrodomésticos', 'lavavajillas': 'Electrodomésticos',
  'aire': 'Climatización', 'acondicionado': 'Climatización', 'calefaccion': 'Climatización',
  'calefacción': 'Climatización', 'ventilacion': 'Climatización', 'minisplit': 'Climatización',
  'carpintero': 'Carpintería', 'mueble': 'Carpintería', 'madera': 'Carpintería',
  'closet': 'Carpintería', 'ventana': 'Carpintería', 'deck': 'Carpintería',
  'soldador': 'Soldadura', 'reja': 'Soldadura', 'porton': 'Soldadura', 'portón': 'Soldadura',
  'fierro': 'Soldadura', 'metal': 'Soldadura',
};

// GET lista pública de técnicos activos
router.get('/', (req, res) => {
  const db = getDb();
  const { comuna, category, plan, search } = req.query;

  const VALID_PLANS = ['free', 'premium', 'top'];
  if (plan && !VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: 'Plan inválido' });
  }

  const safeSearch   = search   ? String(search).slice(0, 100)   : null;
  const safeComuna   = comuna   ? String(comuna).slice(0, 100)   : null;
  const safeCategory = category ? String(category).slice(0, 100) : null;

  // Detectar si alguna palabra es sinónimo de una categoría
  let extraCategory = null;
  if (safeSearch) {
    const words = safeSearch.toLowerCase().trim().split(/\s+/);
    for (const w of words) {
      if (SYNONYMS[w]) { extraCategory = SYNONYMS[w]; break; }
    }
  }

  let query = `
    SELECT t.id, t.name, t.phone, t.whatsapp, t.comuna, t.category,
           t.description, t.services_list, t.is_urgent_24h, t.status, t.plan, t.expires_at,
           t.image_url, t.price_from, t.created_at,
           ROUND(AVG(r.rating), 1) as avg_rating,
           COUNT(r.id) as review_count
    FROM technicians t
    LEFT JOIN reviews r ON r.technician_id = t.id AND r.status = 'approved'
    WHERE t.status = 'active'
  `;
  const params = [];

  if (safeComuna)   { query += ` AND LOWER(t.comuna) LIKE LOWER(?)`; params.push(`%${safeComuna}%`); }
  if (safeCategory) { query += ` AND LOWER(t.category) LIKE LOWER(?)`; params.push(`%${safeCategory}%`); }
  if (plan)         { query += ` AND t.plan = ?`; params.push(plan); }

  if (safeSearch) {
    const words = safeSearch.trim().split(/\s+/).filter(w => w.length >= 2).slice(0, 6);
    if (words.length > 0) {
      // Si hay sinónimo, buscar también por categoría mapeada
      if (extraCategory && !safeCategory) {
        const wordConditions = words.map(() =>
          `(LOWER(t.name) LIKE LOWER(?) OR LOWER(t.description) LIKE LOWER(?) OR LOWER(COALESCE(t.services_list,'')) LIKE LOWER(?) OR LOWER(t.category) LIKE LOWER(?))`
        ).join(' AND ');
        query += ` AND (LOWER(t.category) = LOWER(?) OR (${wordConditions}))`;
        params.push(extraCategory);
        for (const w of words) params.push(`%${w}%`, `%${w}%`, `%${w}%`, `%${w}%`);
      } else {
        const wordConditions = words.map(() =>
          `(LOWER(t.name) LIKE LOWER(?) OR LOWER(t.description) LIKE LOWER(?) OR LOWER(COALESCE(t.services_list,'')) LIKE LOWER(?) OR LOWER(t.category) LIKE LOWER(?))`
        ).join(' AND ');
        query += ` AND (${wordConditions})`;
        for (const w of words) params.push(`%${w}%`, `%${w}%`, `%${w}%`, `%${w}%`);
      }
    }
  }

  // Ordenar por plan + relevancia + urgencia
  query += ` GROUP BY t.id ORDER BY
    CASE t.plan WHEN 'top' THEN 3 WHEN 'premium' THEN 2 ELSE 1 END DESC,
    t.is_urgent_24h DESC,
    avg_rating DESC,
    t.created_at DESC
    LIMIT 120`;

  const technicians = db.prepare(query).all(...params);
  res.json(technicians);
});

// GET perfil público de un técnico
router.get('/:id', (req, res) => {
  const db = getDb();
  const technician = db.prepare(`
    SELECT t.*, ROUND(AVG(r.rating), 1) as avg_rating, COUNT(r.id) as review_count
    FROM technicians t
    LEFT JOIN reviews r ON r.technician_id = t.id AND r.status = 'approved'
    WHERE t.id = ? AND t.status = 'active'
    GROUP BY t.id
  `).get(req.params.id);

  if (!technician) return res.status(404).json({ error: 'Técnico no encontrado' });

  const images = db.prepare('SELECT filename FROM technician_images WHERE technician_id = ? ORDER BY sort_order ASC, created_at ASC').all(req.params.id);
  const reviews = db.prepare(
    "SELECT id, rating, comment, reviewer_name, created_at FROM reviews WHERE technician_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 10"
  ).all(req.params.id);

  res.json({ ...technician, images, reviews });
});

// POST reseña a técnico (con honeypot + rate limit + moderación)
router.post('/:id/reviews', reviewLimiter, (req, res) => {
  const { rating, comment, reviewer_name, _hp } = req.body;

  // ── Honeypot: si viene con contenido, es un bot ──
  if (_hp && _hp.trim() !== '') {
    // Respondemos 200 para no alertar al bot
    return res.status(201).json({ message: 'Reseña enviada' });
  }

  const ratingNum = parseInt(rating, 10);
  if (!ratingNum || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'El rating debe ser un número entre 1 y 5' });
  }

  // Validación mínima de contenido
  const nameClean = reviewer_name ? reviewer_name.trim() : '';
  const commentClean = comment ? comment.trim() : '';

  if (nameClean.length > 0 && nameClean.length < 3) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
  }
  if (commentClean.length > 0 && commentClean.length < 10) {
    return res.status(400).json({ error: 'El comentario debe tener al menos 10 caracteres' });
  }

  const db = getDb();
  const tech = db.prepare('SELECT id FROM technicians WHERE id = ? AND status = ?').get(req.params.id, 'active');
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  // Guardar en pending — requiere aprobación del admin
  db.prepare(
    "INSERT INTO reviews (technician_id, rating, comment, reviewer_name, status) VALUES (?, ?, ?, ?, 'pending')"
  ).run(
    req.params.id,
    ratingNum,
    commentClean.substring(0, 500) || null,
    nameClean.substring(0, 100) || 'Anónimo'
  );

  // Notificar al maestro por email (no bloqueante)
  const techWithEmail = db.prepare(`
    SELECT t.*, u.email FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.id = ?
  `).get(req.params.id);
  if (techWithEmail) {
    mailNuevaResena(techWithEmail, { rating, comment: commentClean, reviewer_name: nameClean }).catch(() => {});
  }

  res.status(201).json({ message: 'Reseña recibida. Será publicada una vez revisada.' });
});

// POST registrar clic en WhatsApp (contador de contactos)
router.post('/:id/contact', (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT id FROM technicians WHERE id = ? AND status = ?').get(req.params.id, 'active');
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  // Si el admin hace clic, no contar (no distorsiona estadísticas)
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'admin') return res.json({ ok: true });
    }
  } catch {}

  // Registrar clic sin deduplicación por IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
  const ipHash = crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').slice(0, 16);
  db.prepare('INSERT INTO contact_clicks (technician_id, ip_hash) VALUES (?, ?)').run(req.params.id, ipHash);

  res.json({ ok: true });
});

// Límite de fotos por plan
const PHOTO_LIMITS = { free: 5, premium: 5, top: 10 };

// POST subir imágenes (solo técnico autenticado)
router.post('/:id/images', authMiddleware, (req, res, next) => {
  // Manejo de errores de multer (archivo muy grande, formato inválido, etc.)
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Cada imagen debe pesar menos de 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Máximo 10 fotos por subida.' });
      }
      return res.status(400).json({ error: err.message || 'Error al procesar las imágenes.' });
    }
    next();
  });
}, async (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  if (req.user.role !== 'admin' && tech.user_id !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'No se recibieron imágenes válidas. Solo JPG o PNG.' });
  }

  const maxPhotos = req.user.role === 'admin' ? 10 : (PHOTO_LIMITS[tech.plan] ?? 3);
  const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM technician_images WHERE technician_id = ?').get(req.params.id);
  if (existingCount.cnt + req.files.length > maxPhotos) {
    // Limpiar archivos subidos si no caben
    const fs = require('fs');
    req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    return res.status(400).json({ error: `Límite alcanzado. Tu plan permite máximo ${maxPhotos} fotos.` });
  }

  const saved = [];
  const failed = [];
  for (const file of req.files) {
    try {
      await processImage(file.path);
      db.prepare('INSERT INTO technician_images (technician_id, filename) VALUES (?, ?)').run(req.params.id, file.filename);
      saved.push(file.filename);
    } catch (err) {
      console.error('Error procesando imagen:', err.message);
      failed.push(file.originalname || file.filename);
      try { require('fs').unlinkSync(file.path); } catch {}
    }
  }

  if (!tech.image_url && saved.length > 0) {
    db.prepare('UPDATE technicians SET image_url = ? WHERE id = ?').run(`/uploads/technicians/${saved[0]}`, req.params.id);
  }

  if (saved.length === 0) {
    return res.status(500).json({ error: 'No se pudo procesar ninguna imagen. Intenta de nuevo.' });
  }

  res.json({
    uploaded: saved.length,
    files: saved,
    ...(failed.length > 0 && { warning: `${failed.length} foto(s) no se pudieron procesar.` })
  });
});

// DELETE imagen
router.delete('/:id/images/:filename', authMiddleware, (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });
  if (req.user.role !== 'admin' && tech.user_id !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  db.prepare('DELETE FROM technician_images WHERE technician_id = ? AND filename = ?').run(req.params.id, req.params.filename);

  const fs = require('fs').promises;
  const filePath = path.join(__dirname, '../../uploads/technicians', req.params.filename);
  fs.unlink(filePath).catch(() => {}); // No bloquea si el archivo ya no existe

  res.json({ message: 'Imagen eliminada' });
});

// PUT reordenar fotos
router.put('/:id/images/reorder', authMiddleware, (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });
  if (req.user.role !== 'admin' && tech.user_id !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const { order } = req.body; // array de filenames en el orden deseado
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order debe ser un array' });

  const update = db.prepare('UPDATE technician_images SET sort_order = ? WHERE technician_id = ? AND filename = ?');
  const updateMany = db.transaction((items) => {
    items.forEach((filename, idx) => update.run(idx, req.params.id, filename));
  });
  updateMany(order);

  // Actualizar image_url con la primera foto
  if (order.length > 0) {
    db.prepare('UPDATE technicians SET image_url = ? WHERE id = ?').run(`/uploads/technicians/${order[0]}`, req.params.id);
  }

  res.json({ ok: true });
});

module.exports = router;
