const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { mailNuevoRegistro, mailBienvenida, mailRecuperarContrasena } = require('../utils/mailer');

const router = express.Router();

// Rate limiter específico para recuperación de contraseña: 3 intentos por hora por IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Demasiadas solicitudes de recuperación. Intenta en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registro de técnico
router.post('/register', (req, res) => {
  const { email, password, name, phone, whatsapp, comuna, category, description, is_urgent_24h,
          covers_rm, years_experience, price_from, availability, services_list } = req.body;

  if (!email || !password || !name || !phone || !comuna || !category) {
    return res.status(400).json({ error: 'Campos requeridos: email, password, name, phone, comuna, category' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const userResult = db.prepare(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
  ).run(email.toLowerCase().trim(), password_hash, 'technician');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const techResult = db.prepare(`
    INSERT INTO technicians (user_id, name, phone, whatsapp, comuna, category, description, is_urgent_24h,
      covers_rm, years_experience, price_from, availability, services_list, status, plan, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'free', ?)
  `).run(
    userResult.lastInsertRowid,
    name.trim(),
    phone.trim(),
    whatsapp ? whatsapp.trim() : phone.trim(),
    comuna.trim(),
    category.trim(),
    description ? description.trim() : '',
    is_urgent_24h ? 1 : 0,
    covers_rm ? 1 : 0,
    years_experience ? (isNaN(parseInt(years_experience, 10)) ? null : parseInt(years_experience, 10)) : null,
    price_from ? price_from.trim() : null,
    availability ? availability.trim() : null,
    services_list ? services_list.trim() : null,
    expiresAt.toISOString()
  );

  // Emails (no bloqueantes)
  const techData = db.prepare('SELECT t.*, u.email FROM technicians t LEFT JOIN users u ON u.id = t.user_id WHERE t.user_id = ?').get(userResult.lastInsertRowid);
  mailBienvenida(techData).catch(() => {});
  mailNuevoRegistro(techData).catch(() => {});

  // Devolver token para que el maestro pueda subir fotos de inmediato
  const token = jwt.sign(
    { id: userResult.lastInsertRowid, email: email.toLowerCase().trim(), role: 'technician' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    message: 'Registro exitoso.',
    token,
    technicianId: techResult.lastInsertRowid,
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  // Siempre comparar un hash para evitar timing attacks (revelar si el email existe)
  const hashToCompare = user?.password_hash || '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
  const isValid = user && bcrypt.compareSync(password, hashToCompare);

  if (!isValid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});

// Perfil propio
router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// ─── Recuperación de contraseña ───────────────────────────────────────────────

// POST /api/auth/forgot-password — solicita el enlace
router.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const db = getDb();
  const user = db.prepare(`
    SELECT u.*, t.name
    FROM users u
    LEFT JOIN technicians t ON t.user_id = u.id
    WHERE u.email = ?
  `).get(email.toLowerCase().trim());

  // Siempre responder igual para no revelar si existe el email
  if (!user) {
    return res.json({ message: 'Si ese email está registrado, recibirás un enlace en tu correo.' });
  }

  // Eliminar tokens previos no usados
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

  // Generar token seguro
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt.toISOString());

  const resetUrl = `${process.env.SITE_URL}/recuperar-contrasena?token=${token}`;
  const techData = { ...user, name: user.name || user.email };
  mailRecuperarContrasena(techData, resetUrl).catch(() => {});

  res.json({ message: 'Si ese email está registrado, recibirás un enlace en tu correo.' });
});

// POST /api/auth/reset-password — establece nueva contraseña
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

  const db = getDb();
  const record = db.prepare(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?'
  ).get(token, new Date().toISOString());

  if (!record) {
    return res.status(400).json({ error: 'El enlace es inválido o ha expirado. Solicita uno nuevo.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, record.user_id);
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: 'Contraseña actualizada correctamente. Ya puedes ingresar.' });
});

module.exports = router;
