const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'technician' CHECK(role IN ('admin', 'technician')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      duration_days INTEGER NOT NULL DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      comuna TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      years_experience INTEGER,
      price_from TEXT,
      availability TEXT,
      services_list TEXT,
      is_urgent_24h INTEGER NOT NULL DEFAULT 0,
      is_verified INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','rejected','expired')),
      plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','premium','top')),
      expires_at DATETIME,
      image_url TEXT,
      expiry_notified INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS technician_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technician_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technician_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      reviewer_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technician_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );
  `);

  // Tabla de contactos (clics en WhatsApp)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technician_id INTEGER NOT NULL,
      ip_hash TEXT,
      clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_contact_clicks_tech_date
      ON contact_clicks(technician_id, clicked_at);
  `);

  // Historial de eventos del maestro
  db.exec(`
    CREATE TABLE IF NOT EXISTS technician_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technician_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      plan TEXT,
      expires_at DATETIME,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE
    );
  `);

  // Tabla de tokens de recuperación de contraseña
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Índices para mejorar rendimiento de consultas frecuentes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    CREATE INDEX IF NOT EXISTS idx_technicians_status
      ON technicians(status);
    CREATE INDEX IF NOT EXISTS idx_technicians_status_expires
      ON technicians(status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_technicians_search
      ON technicians(status, comuna, category);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
      ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
      ON password_reset_tokens(expires_at, used);
  `);

  // Migraciones seguras (agregan columnas si no existen)
  const cols = db.prepare("PRAGMA table_info(technicians)").all().map(c => c.name);
  if (!cols.includes('years_experience'))  db.exec("ALTER TABLE technicians ADD COLUMN years_experience INTEGER");
  if (!cols.includes('price_from'))        db.exec("ALTER TABLE technicians ADD COLUMN price_from TEXT");
  if (!cols.includes('availability'))      db.exec("ALTER TABLE technicians ADD COLUMN availability TEXT");
  if (!cols.includes('services_list'))     db.exec("ALTER TABLE technicians ADD COLUMN services_list TEXT");
  if (!cols.includes('expiry_notified'))   db.exec("ALTER TABLE technicians ADD COLUMN expiry_notified INTEGER NOT NULL DEFAULT 0");
  if (!cols.includes('covers_rm'))         db.exec("ALTER TABLE technicians ADD COLUMN covers_rm INTEGER NOT NULL DEFAULT 0");

  // Migración imágenes: agregar sort_order si no existe
  const imgCols = db.prepare("PRAGMA table_info(technician_images)").all().map(c => c.name);
  if (!imgCols.includes('sort_order'))     db.exec("ALTER TABLE technician_images ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");

  // Migración reseñas: agregar columna status si no existe
  const reviewCols = db.prepare("PRAGMA table_info(reviews)").all().map(c => c.name);
  if (!reviewCols.includes('status')) {
    db.exec("ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
    // Las reseñas viejas (si hay) se aprueban automáticamente
    db.exec("UPDATE reviews SET status = 'approved'");
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reviews_tech_status ON reviews(technician_id, status);`);

  // Seed/actualizar planes
  const planCount = db.prepare('SELECT COUNT(*) as cnt FROM plans').get();
  if (planCount.cnt === 0) {
    db.prepare(`INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)`).run('free',    0,     30);
    db.prepare(`INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)`).run('semanal', 5990,  7);
    db.prepare(`INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)`).run('premium', 17990, 30);
    db.prepare(`INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)`).run('top',     29990, 30);
  } else {
    // Migración de precios para bases de datos existentes
    db.prepare(`UPDATE plans SET price = 17990 WHERE name = 'premium'`).run();
    db.prepare(`UPDATE plans SET price = 29990 WHERE name = 'top'`).run();
    // Agregar plan semanal si no existe
    const semanal = db.prepare(`SELECT id FROM plans WHERE name = 'semanal'`).get();
    if (!semanal) {
      db.prepare(`INSERT INTO plans (name, price, duration_days) VALUES (?, ?, ?)`).run('semanal', 5990, 7);
    }
  }
}

module.exports = { getDb };
