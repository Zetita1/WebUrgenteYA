const { getDb } = require('../config/database');
const {
  mailAviso7Dias,
  mailAviso3Dias,
  mailExpirado,
  mailResumenVencimientos,
} = require('../utils/mailer');

/*
  expiry_notified values:
  0 = sin notificar
  1 = aviso 7 días enviado
  2 = aviso 3 días enviado
  3 = aviso de expiración enviado
*/

function runExpirationJob() {
  const db  = getDb();
  const now = new Date();

  // ── 1. Marcar como expirados los que ya vencieron ─────────────────────────
  const expired = db.prepare(`
    SELECT t.*, u.email
    FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'active'
      AND t.expires_at IS NOT NULL
      AND t.expires_at < ?
  `).all(now.toISOString());

  if (expired.length > 0) {
    db.prepare(`
      UPDATE technicians SET status = 'expired'
      WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < ?
    `).run(now.toISOString());

    console.log(`[ExpirationJob] ${expired.length} maestro(s) marcados como expirados.`);

    // Email a los que aún no recibieron aviso de expiración
    expired.forEach(m => {
      if (m.expiry_notified < 3) {
        mailExpirado(m).catch(() => {});
        db.prepare(`UPDATE technicians SET expiry_notified = 3 WHERE id = ?`).run(m.id);
      }
    });
  }

  // ── 2. Aviso 3 días antes ─────────────────────────────────────────────────
  const en3Dias = new Date(now);
  en3Dias.setDate(en3Dias.getDate() + 3);

  const por3dias = db.prepare(`
    SELECT t.*, u.email
    FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'active'
      AND t.expires_at IS NOT NULL
      AND t.expires_at > ?
      AND t.expires_at <= ?
      AND t.expiry_notified < 2
  `).all(now.toISOString(), en3Dias.toISOString());

  por3dias.forEach(m => {
    mailAviso3Dias(m).catch(() => {});
    db.prepare(`UPDATE technicians SET expiry_notified = 2 WHERE id = ?`).run(m.id);
    console.log(`[ExpirationJob] Aviso 3 días enviado a ${m.name}`);
  });

  // ── 3. Aviso 7 días antes ─────────────────────────────────────────────────
  const en7Dias = new Date(now);
  en7Dias.setDate(en7Dias.getDate() + 7);

  const por7dias = db.prepare(`
    SELECT t.*, u.email,
      CAST((julianday(t.expires_at) - julianday('now')) AS INTEGER) + 1 as dias_restantes
    FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'active'
      AND t.expires_at IS NOT NULL
      AND t.expires_at > ?
      AND t.expires_at <= ?
      AND t.expiry_notified < 1
  `).all(en3Dias.toISOString(), en7Dias.toISOString());

  por7dias.forEach(m => {
    mailAviso7Dias(m).catch(() => {});
    db.prepare(`UPDATE technicians SET expiry_notified = 1 WHERE id = ?`).run(m.id);
    console.log(`[ExpirationJob] Aviso 7 días enviado a ${m.name}`);
  });

  // ── 4. Resumen diario al admin (todos los que vencen en 7 días) ───────────
  const todosProximos = db.prepare(`
    SELECT t.*, u.email,
      CAST((julianday(t.expires_at) - julianday('now')) AS INTEGER) + 1 as dias_restantes
    FROM technicians t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'active'
      AND t.expires_at IS NOT NULL
      AND t.expires_at > ?
      AND t.expires_at <= ?
  `).all(now.toISOString(), en7Dias.toISOString());

  if (todosProximos.length > 0) {
    mailResumenVencimientos(todosProximos).catch(() => {});
  }
}

function safeRunExpirationJob() {
  try {
    runExpirationJob();
  } catch (err) {
    console.error('[ExpirationJob] Error inesperado:', err.message);
  }
}

function startExpirationJob() {
  // Ejecutar al inicio con delay de 10s para que la DB esté lista
  setTimeout(safeRunExpirationJob, 10 * 1000);

  // Calcular ms hasta las 3:00 AM del día siguiente para sincronizar
  function msUntilNextRun() {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(3, 0, 0, 0);
    return next - now;
  }

  // Programar primer run a las 3 AM, luego cada 24h
  setTimeout(function scheduleNext() {
    safeRunExpirationJob();
    setInterval(safeRunExpirationJob, 24 * 60 * 60 * 1000);
  }, msUntilNextRun());

  console.log('[ExpirationJob] Job iniciado — corre diariamente a las 3:00 AM');
}

module.exports = { startExpirationJob };
