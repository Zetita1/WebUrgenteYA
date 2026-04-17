#!/bin/bash
# Configuración inicial del servidor VPS (Ubuntu 22.04)
# Ejecutar UNA SOLA VEZ como root tras crear el servidor
# Uso: bash setup-server.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup inicial — UrgenteYa.cl en VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Actualizar sistema
echo "[1] Actualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependencias base
echo "[2] Instalando dependencias..."
apt install -y curl wget git nginx certbot python3-certbot-nginx sqlite3 ufw

# 3. Instalar Node.js 20
echo "[3] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v && npm -v

# 4. Instalar PM2
echo "[4] Instalando PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

# 5. Configurar firewall
echo "[5] Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 6. Crear estructura de directorios
echo "[6] Creando directorios..."
mkdir -p /var/www/urgenteya/frontend
mkdir -p /var/www/urgenteya/backend/uploads/technicians
mkdir -p /var/backups/urgenteya
mkdir -p /var/log/urgenteya

# 7. Copiar configuración de Nginx
echo "[7] Configurando Nginx..."
# Asume que ya copiaste el proyecto al servidor
cp /var/www/urgenteya/deploy/nginx.conf /etc/nginx/sites-available/urgenteya
ln -sf /etc/nginx/sites-available/urgenteya /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 8. Configurar cron para backups diarios (2 AM)
echo "[8] Configurando backup automático..."
chmod +x /var/www/urgenteya/backend/scripts/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/urgenteya/backend/scripts/backup.sh >> /var/log/urgenteya/backup.log 2>&1") | crontab -

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Setup completado"
echo ""
echo "  Próximos pasos:"
echo "  1. Sube el código del proyecto a /var/www/urgenteya/"
echo "  2. Crea el archivo /var/www/urgenteya/backend/.env"
echo "     (copia .env.example y completa los valores reales)"
echo "  3. Ejecuta: bash /var/www/urgenteya/deploy/deploy.sh"
echo "  4. Obtén SSL: certbot --nginx -d urgenteya.cl -d www.urgenteya.cl"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
