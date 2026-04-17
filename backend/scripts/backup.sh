#!/bin/bash
# Backup diario de la base de datos SQLite + fotos de maestros
# Configurar en cron: 0 2 * * * /var/www/urgenteya/backend/scripts/backup.sh
#
# NOTA: el servidor Node.js ya genera un backup automático de la DB diariamente,
# pero este script sirve como red de seguridad adicional (por si el proceso está
# caído) y también incluye los uploads/ (fotos), que el job interno no toca.

set -e

BACKUP_DIR="/var/backups/urgenteya"
APP_DIR="/var/www/urgenteya/backend"
DB_PATH="$APP_DIR/database.sqlite"
UPLOADS_DIR="$APP_DIR/uploads"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_BACKUP="$BACKUP_DIR/database_$DATE.sqlite.gz"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_$DATE.tar.gz"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

# ── 1. Backup de la DB ────────────────────────────────────────────────────────
if [ ! -f "$DB_PATH" ]; then
  echo "[backup] ERROR: No se encontró la DB en $DB_PATH"
  exit 1
fi

if command -v sqlite3 &> /dev/null; then
  sqlite3 "$DB_PATH" ".backup /tmp/urgenteya_backup_tmp.sqlite"
  gzip -c /tmp/urgenteya_backup_tmp.sqlite > "$DB_BACKUP"
  rm -f /tmp/urgenteya_backup_tmp.sqlite
else
  cp "$DB_PATH" "/tmp/urgenteya_backup_tmp.sqlite"
  gzip -c /tmp/urgenteya_backup_tmp.sqlite > "$DB_BACKUP"
  rm -f /tmp/urgenteya_backup_tmp.sqlite
fi

echo "[backup] ✓ DB → $DB_BACKUP ($(du -sh "$DB_BACKUP" | cut -f1))"

# ── 2. Backup de uploads (fotos de maestros) ──────────────────────────────────
if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
  tar -czf "$UPLOADS_BACKUP" -C "$APP_DIR" uploads
  echo "[backup] ✓ uploads → $UPLOADS_BACKUP ($(du -sh "$UPLOADS_BACKUP" | cut -f1))"
else
  echo "[backup] uploads/ vacío o no existe, se omite"
fi

# ── 3. Limpieza de backups antiguos ───────────────────────────────────────────
find "$BACKUP_DIR" -name "database_*.sqlite.gz" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$KEEP_DAYS -delete
echo "[backup] Backups antiguos (>$KEEP_DAYS días) eliminados."

# ── 4. Resumen ────────────────────────────────────────────────────────────────
echo "[backup] Últimos backups:"
ls -lh "$BACKUP_DIR" 2>/dev/null | tail -10
