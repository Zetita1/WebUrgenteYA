require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { getDb } = require('./config/database');
const { startExpirationJob } = require('./jobs/expiration');
const { startBackupJob } = require('./jobs/backup');

const authRoutes = require('./routes/auth');
const technicianRoutes = require('./routes/technicians');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// ─── Seguridad ───────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Forzar HTTPS en producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://urgenteya.cl', 'https://www.urgenteya.cl', process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos, espera 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

// Rate limiter específico para listado público (anti-scraping)
const publicListLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: { error: 'Demasiadas solicitudes' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

app.use(globalLimiter);

// ─── Parsers ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// ─── Archivos estáticos ───────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d', // Cache imágenes 7 días
  etag: true,
}));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/technicians', publicListLimiter, technicianRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sitemap dinámico (cacheado 1 hora)
let sitemapCache = null;
let sitemapCacheTime = 0;

app.get('/sitemap.xml', (req, res) => {
  const now = Date.now();
  if (sitemapCache && now - sitemapCacheTime < 3600000) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(sitemapCache);
  }

  const db = getDb();
  const SITE = process.env.SITE_URL || 'https://urgenteya.cl';
  const techs = db.prepare("SELECT id, created_at FROM technicians WHERE status = 'active'").all();

  const CATEGORIES = [
    'electricidad', 'gasfiteria', 'refrigeracion', 'computadores',
    'cerrajeria', 'pintura', 'albanileria', 'jardineria',
    'electrodomesticos', 'climatizacion', 'carpinteria', 'soldadura'
  ];
  const COMUNAS = [
    'santiago-centro', 'providencia', 'las-condes', 'maipu', 'la-florida',
    'nunoa', 'san-miguel', 'pudahuel', 'quilicura', 'recoleta',
    'puente-alto', 'la-pintana', 'penalolen', 'conchali', 'huechuraba',
    'vitacura', 'lo-barnechea', 'macul', 'renca', 'san-bernardo'
  ];

  const staticUrls = [
    { loc: `${SITE}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE}/tecnicos`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE}/precios`, priority: '0.7', changefreq: 'monthly' },
    ...CATEGORIES.map(cat => ({ loc: `${SITE}/maestros/${cat}`, priority: '0.8', changefreq: 'daily' })),
    ...CATEGORIES.flatMap(cat =>
      COMUNAS.slice(0, 10).map(com => ({ loc: `${SITE}/maestros/${cat}/${com}`, priority: '0.7', changefreq: 'weekly' }))
    ),
  ];

  const urlTags = [
    ...staticUrls.map(p => `  <url><loc>${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`),
    ...techs.map(t => {
      const lastmod = new Date(t.created_at).toISOString().slice(0, 10);
      return `  <url><loc>${SITE}/tecnicos/${t.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }),
  ].join('\n');

  sitemapCache = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>`;
  sitemapCacheTime = now;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(sitemapCache);
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── Manejo de errores ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Archivo demasiado grande (máximo 10MB)' });
  }
  if (err.message && err.message.includes('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Inicialización ───────────────────────────────────────────────────────────
getDb();
startExpirationJob();
startBackupJob();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n UrgenteYa.cl Backend → http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(` Admin: http://localhost:5173/admin`);
  }
});

module.exports = app;
