/*
 * Job automático de backup de la base de datos SQLite
 * ─────────────────────────────────────────────────────
 *  - Corre diariamente a las 2:00 AM (se auto-agenda)
 *  - Crea un archivo .sqlite comprimido en gzip en /backups
 *  - Mantiene los últimos 30 días, borra los más viejos
 *  - Funciona tanto en Windows como en Linux (usa mismo SQLite backup API)
 */

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');
const { getDb } = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const DB_PATH    = path.join(__dirname, '..', '..', 'database.sqlite');
const KEEP_DAYS  = 30;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

/**
 * Ejecuta un backup consistente usando el API nativo de SQLite.
 * Esto es seguro incluso mientras la DB está en uso (modo WAL).
 * Retorna la ruta del archivo generado.
 */
async function runBackup() {
  ensureBackupDir();

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`No se encontró la DB en ${DB_PATH}`);
  }

  const db  = getDb();
  const ts  = timestamp();
  const tmp = path.join(BACKUP_DIR, `_tmp_${ts}.sqlite`);
  const out = path.join(BACKUP_DIR, `database_${ts}.sqlite.gz`);

  // 1. Hacer copia consistente con better-sqlite3 backup API
  await db.backup(tmp);

  // 2. Comprimir a .gz y borrar el tmp
  await new Promise((resolve, reject) => {
    const rs = fs.createReadStream(tmp);
    const ws = fs.createWriteStream(out);
    const gz = zlib.createGzip({ level: 9 });
    rs.pipe(gz).pipe(ws)
      .on('finish', resolve)
      .on('error', reject);
  });

  fs.unlinkSync(tmp);

  const size = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`[Backup] ✓ ${path.basename(out)} (${size} KB)`);

  cleanOldBackups();
  return out;
}

/**
 * Borra backups con más de KEEP_DAYS días de antigüedad.
 */
function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sqlite.gz'));

  let removed = 0;
  files.forEach(f => {
    const full = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(full);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(full);
      removed++;
    }
  });
  if (removed > 0) console.log(`[Backup] ${removed} backup(s) antiguos eliminados (>${KEEP_DAYS} días)`);
}

/**
 * Lista los backups disponibles (más recientes primero).
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sqlite.gz'))
    .map(f => {
      const full = path.join(BACKUP_DIR, f);
      const s = fs.statSync(full);
      return {
        name:    f,
        size_kb: Math.round(s.size / 1024),
        created: s.mtime.toISOString(),
        path:    full,
      };
    })
    .sort((a, b) => b.created.localeCompare(a.created));
}

async function safeRunBackup() {
  try {
    await runBackup();
  } catch (err) {
    console.error('[Backup] ERROR:', err.message);
  }
}

/**
 * Agenda el backup diario a las 2:00 AM hora local.
 * También corre uno a los 30 segundos del arranque (solo si no hay ninguno hoy).
 */
function startBackupJob() {
  // ── Backup inicial solo si no hay backup de hoy ──
  setTimeout(() => {
    const today = new Date().toISOString().slice(0, 10);
    const existing = listBackups().find(b => b.name.includes(today));
    if (!existing) {
      console.log('[Backup] No hay backup de hoy, generando uno ahora...');
      safeRunBackup();
    }
  }, 30 * 1000);

  // ── Agenda para las 2:00 AM ──
  function msUntilNext2AM() {
    const now  = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
    return next - now;
  }

  setTimeout(function scheduleNext() {
    safeRunBackup();
    setInterval(safeRunBackup, 24 * 60 * 60 * 1000);
  }, msUntilNext2AM());

  console.log('[Backup] Job iniciado — corre diariamente a las 2:00 AM');
}

module.exports = { startBackupJob, runBackup, listBackups, BACKUP_DIR };
