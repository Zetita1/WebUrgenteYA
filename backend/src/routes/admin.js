const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { mailAprobado, mailRechazado } = require('../utils/mailer');
const { runBackup, listBackups, BACKUP_DIR } = require('../jobs/backup');

const router = express.Router();

// Todos los endpoints requieren auth + rol admin
router.use(authMiddleware, requireRole('admin'));

// GET todos los técnicos (con filtros)
router.get('/technicians', (req, res) => {
  const db = getDb();
  const { status, plan, search } = req.query;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  let query = `
    SELECT t.*, u.email,
           ROUND(AVG(r.rating), 1) as avg_rating,
           COUNT(DISTINCT r.id) as review_count,
           COUNT(DISTINCT CASE WHEN cc.clicked_at >= ? THEN cc.id END) as contacts_this_month,
           COUNT(DISTINCT cc.id) as contacts_total
    FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    LEFT JOIN reviews r ON r.technician_id = t.id
    LEFT JOIN contact_clicks cc ON cc.technician_id = t.id
    WHERE 1=1
  `;
  const params = [startOfMonth];

  // Validar contra lista blanca para evitar inyecciones
  const VALID_STATUSES = ['pending', 'active', 'rejected', 'expired'];
  const VALID_PLANS    = ['free', 'premium', 'top'];
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  if (plan   && !VALID_PLANS.includes(plan))       return res.status(400).json({ error: 'Plan inválido' });

  if (status) { query += ` AND t.status = ?`; params.push(status); }
  if (plan) { query += ` AND t.plan = ?`; params.push(plan); }
  if (search) {
    query += ` AND (LOWER(t.name) LIKE LOWER(?) OR LOWER(t.comuna) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY t.id ORDER BY t.created_at DESC`;

  const technicians = db.prepare(query).all(...params);
  res.json(technicians);
});

// GET un técnico por ID (admin)
router.get('/technicians/:id', (req, res) => {
  const db = getDb();
  const tech = db.prepare(`
    SELECT t.*, u.email FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  const images = db.prepare('SELECT filename FROM technician_images WHERE technician_id = ? ORDER BY sort_order ASC, created_at ASC').all(req.params.id);
  const reviews = db.prepare('SELECT * FROM reviews WHERE technician_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...tech, images, reviews });
});

// POST crear técnico manualmente
router.post('/technicians', (req, res) => {
  const { name, phone, whatsapp, comuna, category, description, is_urgent_24h,
          plan, status, expires_days, years_experience, price_from, availability, services_list } = req.body;

  if (!name || !phone || !comuna || !category) {
    return res.status(400).json({ error: 'Campos requeridos: name, phone, comuna, category' });
  }

  const db = getDb();
  const days = expires_days != null ? Number(expires_days) : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const result = db.prepare(`
    INSERT INTO technicians (name, phone, whatsapp, comuna, category, description, is_urgent_24h,
      status, plan, expires_at, years_experience, price_from, availability, services_list)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    phone.trim(),
    whatsapp ? whatsapp.trim() : phone.trim(),
    comuna.trim(),
    category.trim(),
    description ? description.trim() : '',
    is_urgent_24h ? 1 : 0,
    status || 'active',
    plan || 'free',
    expiresAt.toISOString(),
    years_experience ? (isNaN(parseInt(years_experience, 10)) ? null : parseInt(years_experience, 10)) : null,
    price_from ? price_from.trim() : null,
    availability ? availability.trim() : null,
    services_list ? services_list.trim() : null
  );

  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(result.lastInsertRowid);

  // Registrar evento en historial
  db.prepare(
    "INSERT INTO technician_history (technician_id, event, plan, expires_at) VALUES (?, 'created', ?, ?)"
  ).run(result.lastInsertRowid, tech.plan, tech.expires_at);

  res.status(201).json(tech);
});

// PUT editar técnico
router.put('/technicians/:id', (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  const { name, phone, whatsapp, comuna, category, description, is_urgent_24h,
          status, plan, expires_at, years_experience, price_from, availability, services_list } = req.body;

  db.prepare(`
    UPDATE technicians SET
      name = ?, phone = ?, whatsapp = ?, comuna = ?, category = ?,
      description = ?, is_urgent_24h = ?, status = ?, plan = ?, expires_at = ?,
      years_experience = ?, price_from = ?, availability = ?, services_list = ?
    WHERE id = ?
  `).run(
    name ?? tech.name,
    phone ?? tech.phone,
    whatsapp ?? tech.whatsapp,
    comuna ?? tech.comuna,
    category ?? tech.category,
    description ?? tech.description,
    is_urgent_24h !== undefined ? (is_urgent_24h ? 1 : 0) : tech.is_urgent_24h,
    status ?? tech.status,
    plan ?? tech.plan,
    expires_at ?? tech.expires_at,
    years_experience !== undefined ? (years_experience ? (isNaN(parseInt(years_experience, 10)) ? null : parseInt(years_experience, 10)) : null) : tech.years_experience,
    price_from !== undefined ? (price_from || null) : tech.price_from,
    availability !== undefined ? (availability || null) : tech.availability,
    services_list !== undefined ? (services_list || null) : tech.services_list,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// POST aprobar técnico
router.post('/technicians/:id/approve', (req, res) => {
  const db = getDb();
  const tech = db.prepare(`
    SELECT t.*, u.email FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  db.prepare(`UPDATE technicians SET status = 'active', expires_at = ?, expiry_notified = 0 WHERE id = ?`).run(
    expiresAt.toISOString(), req.params.id
  );

  // Registrar en historial
  db.prepare(
    "INSERT INTO technician_history (technician_id, event, plan, expires_at) VALUES (?, 'approved', ?, ?)"
  ).run(req.params.id, tech.plan, expiresAt.toISOString());

  // Email al maestro (no bloqueante)
  mailAprobado(tech).catch(() => {});

  res.json({ message: 'Técnico aprobado', expires_at: expiresAt.toISOString() });
});

// POST rechazar técnico
router.post('/technicians/:id/reject', (req, res) => {
  const db = getDb();
  const tech = db.prepare(`
    SELECT t.*, u.email FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  db.prepare(`UPDATE technicians SET status = 'rejected' WHERE id = ?`).run(req.params.id);

  // Registrar en historial
  db.prepare(
    "INSERT INTO technician_history (technician_id, event) VALUES (?, 'rejected')"
  ).run(req.params.id);

  // Email al maestro (no bloqueante)
  mailRechazado(tech).catch(() => {});

  res.json({ message: 'Técnico rechazado' });
});

// POST activar técnico (con renovación de plan)
router.post('/technicians/:id/activate', (req, res) => {
  const db = getDb();
  const { plan, days } = req.body;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (days != null ? Number(days) : 30));

  const activePlan = plan || 'premium';
  db.prepare(`UPDATE technicians SET status = 'active', plan = ?, expires_at = ?, expiry_notified = 0 WHERE id = ?`).run(
    activePlan, expiresAt.toISOString(), req.params.id
  );

  // Registrar en historial
  db.prepare(
    "INSERT INTO technician_history (technician_id, event, plan, expires_at) VALUES (?, 'activated', ?, ?)"
  ).run(req.params.id, activePlan, expiresAt.toISOString());

  res.json({ message: 'Técnico activado', expires_at: expiresAt.toISOString() });
});

// POST expirar técnico manualmente
router.post('/technicians/:id/expire', (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE technicians SET status = 'expired' WHERE id = ?`).run(req.params.id);

  // Registrar en historial
  db.prepare(
    "INSERT INTO technician_history (technician_id, event) VALUES (?, 'expired')"
  ).run(req.params.id);

  res.json({ message: 'Técnico expirado' });
});

// DELETE foto de técnico (desde admin)
router.delete('/technicians/:id/images/:filename', (req, res) => {
  const db = getDb();
  const { id, filename } = req.params;
  const img = db.prepare('SELECT * FROM technician_images WHERE technician_id = ? AND filename = ?').get(id, filename);
  if (!img) return res.status(404).json({ error: 'Imagen no encontrada' });

  db.prepare('DELETE FROM technician_images WHERE technician_id = ? AND filename = ?').run(id, filename);

  const filePath = path.join(__dirname, '../../uploads/technicians', filename);
  fs.unlink(filePath, () => {});

  res.json({ message: 'Imagen eliminada' });
});

// DELETE técnico
router.delete('/technicians/:id', (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  db.prepare('DELETE FROM technicians WHERE id = ?').run(req.params.id);
  res.json({ message: 'Técnico eliminado' });
});

// GET stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as cnt FROM technicians').get();
  const byStatus = db.prepare('SELECT status, COUNT(*) as cnt FROM technicians GROUP BY status').all();
  const byPlan = db.prepare("SELECT plan, COUNT(*) as cnt FROM technicians WHERE status = 'active' GROUP BY plan").all();
  const pending = db.prepare("SELECT COUNT(*) as cnt FROM technicians WHERE status = 'pending'").get();
  const now = new Date().toISOString();
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const expiringSoon = db.prepare(
    "SELECT COUNT(*) as cnt FROM technicians WHERE status = 'active' AND expires_at > ? AND expires_at <= ?"
  ).get(now, in7days);

  res.json({
    total: total.cnt,
    pending: pending.cnt,
    expiringSoon: expiringSoon.cnt,
    byStatus,
    byPlan
  });
});

// GET contactos por mes (últimos 6 meses)
router.get('/stats/contacts-monthly', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', clicked_at) as month, COUNT(*) as count
    FROM contact_clicks
    WHERE clicked_at >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();
  res.json(rows);
});

// GET lista de comunas y categorías únicas
router.get('/options', (req, res) => {
  const db = getDb();
  const comunas = db.prepare('SELECT DISTINCT comuna FROM technicians ORDER BY comuna').all().map(r => r.comuna);
  const categories = db.prepare('SELECT DISTINCT category FROM technicians ORDER BY category').all().map(r => r.category);
  res.json({ comunas, categories });
});

// ─── Historial ────────────────────────────────────────────────────────────────

// GET historial de un técnico
router.get('/technicians/:id/history', (req, res) => {
  const db = getDb();
  const history = db.prepare(
    'SELECT * FROM technician_history WHERE technician_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  res.json(history);
});

// ─── Reseñas ──────────────────────────────────────────────────────────────────

// GET todas las reseñas (para CSV export)
router.get('/reviews', (req, res) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, t.name as tech_name, t.category, t.comuna
    FROM reviews r
    LEFT JOIN technicians t ON t.id = r.technician_id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reviews);
});

// GET reseñas pendientes de moderación
router.get('/reviews/pending', (req, res) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, t.name as tech_name, t.category, t.comuna
    FROM reviews r
    LEFT JOIN technicians t ON t.id = r.technician_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `).all();
  res.json(reviews);
});

// GET contador de reseñas pendientes (para badge)
router.get('/reviews/pending-count', (req, res) => {
  const db = getDb();
  const result = db.prepare("SELECT COUNT(*) as cnt FROM reviews WHERE status = 'pending'").get();
  res.json({ count: result.cnt });
});

// POST aprobar reseña
router.post('/reviews/:id/approve', (req, res) => {
  const db = getDb();
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });
  db.prepare("UPDATE reviews SET status = 'approved' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Reseña aprobada' });
});

// POST rechazar/eliminar reseña
router.delete('/reviews/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ message: 'Reseña eliminada' });
});

// ─── Verificación ─────────────────────────────────────────────────────────────

// POST toggle verificado (activa/desactiva badge Verificado)
router.post('/technicians/:id/verify', (req, res) => {
  const db = getDb();
  const tech = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.params.id);
  if (!tech) return res.status(404).json({ error: 'Técnico no encontrado' });

  const newValue = tech.is_verified === 1 ? 0 : 1;
  db.prepare('UPDATE technicians SET is_verified = ? WHERE id = ?').run(newValue, req.params.id);

  db.prepare(
    "INSERT INTO technician_history (technician_id, event, note) VALUES (?, ?, ?)"
  ).run(req.params.id, newValue === 1 ? 'verified' : 'unverified', newValue === 1 ? 'Badge verificado activado' : 'Badge verificado desactivado');

  res.json({ is_verified: newValue });
});

// ─── Backups ──────────────────────────────────────────────────────────────────

// GET lista de backups disponibles
router.get('/backups', (req, res) => {
  try {
    const backups = listBackups();
    res.json(backups.map(b => ({
      name: b.name,
      size_kb: b.size_kb,
      created: b.created,
    })));
  } catch (err) {
    console.error('[Admin/Backups] list:', err.message);
    res.status(500).json({ error: 'No se pudo listar backups' });
  }
});

// POST disparar backup manual
router.post('/backups/run', async (req, res) => {
  try {
    const file = await runBackup();
    res.json({ message: 'Backup creado', file: path.basename(file) });
  } catch (err) {
    console.error('[Admin/Backups] run:', err.message);
    res.status(500).json({ error: err.message || 'Falló el backup' });
  }
});

// GET descargar un backup concreto
router.get('/backups/:name/download', (req, res) => {
  const name = req.params.name;
  // Seguridad: solo nombres válidos (sin path traversal)
  if (!/^database_[\w-]+\.sqlite\.gz$/.test(name)) {
    return res.status(400).json({ error: 'Nombre de backup inválido' });
  }
  const full = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(full)) {
    return res.status(404).json({ error: 'Backup no encontrado' });
  }
  res.download(full);
});

module.exports = router;
