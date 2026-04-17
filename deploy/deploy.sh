#!/bin/bash
# Script de deploy para UrgenteYa.cl
# Uso: bash deploy.sh
# Requiere: Node.js 20+, npm, PM2, Nginx instalados en el servidor

set -e  # Detener si cualquier comando falla

APP_DIR="/var/www/urgenteya"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
NGINX_ROOT="/var/www/urgenteya/frontend"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy UrgenteYa.cl"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Backup de la base de datos antes de cualquier cambio
echo ""
echo "[1/6] Haciendo backup de la base de datos..."
bash "$BACKEND_DIR/scripts/backup.sh"

# 2. Instalar dependencias del backend
echo ""
echo "[2/6] Instalando dependencias del backend..."
cd "$BACKEND_DIR"
npm install --production

# 3. Instalar dependencias del frontend y build
echo ""
echo "[3/6] Construyendo el frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build

# 4. Copiar build del frontend al directorio de Nginx
echo ""
echo "[4/6] Copiando archivos del frontend..."
rm -rf "$NGINX_ROOT"
cp -r "$FRONTEND_DIR/dist" "$NGINX_ROOT"

# 5. Reiniciar el backend con PM2
echo ""
echo "[5/6] Reiniciando el backend..."
cd "$BACKEND_DIR"
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# 6. Recargar Nginx
echo ""
echo "[6/6] Recargando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Deploy completado exitosamente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
