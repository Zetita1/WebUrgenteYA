# UrgenteYa.cl — Documentación del Proyecto

Directorio de maestros independientes en Chile. Conecta electricistas, gasfíteres, refrigeración y más con clientes en la Región Metropolitana. Contacto directo, sin intermediarios.

---

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Base de datos](#3-base-de-datos)
4. [API — Endpoints](#4-api--endpoints)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Autenticación](#6-autenticación)
7. [Sistema de emails](#7-sistema-de-emails)
8. [Jobs automáticos](#8-jobs-automáticos)
9. [Subida de imágenes](#9-subida-de-imágenes)
10. [Deploy en producción](#10-deploy-en-producción)
11. [Checklist de lanzamiento](#11-checklist-de-lanzamiento)

---

## 1. Arquitectura

```
┌─────────────────────────────────────────────┐
│              Usuario / Cliente              │
└───────────────────┬─────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────┐
│                  Nginx                       │
│  - Sirve frontend (React build estático)    │
│  - Proxy /api/* → backend:3001              │
│  - Sirve /uploads/* directamente            │
│  - SSL terminado aquí (Certbot)             │
└───────┬───────────────────────┬─────────────┘
        │                       │
┌───────▼──────────┐   ┌────────▼────────────┐
│  Frontend React  │   │  Backend Node.js    │
│  /var/www/...    │   │  Puerto 3001 (PM2)  │
│  Vite build      │   │  Express + SQLite   │
└──────────────────┘   └────────┬────────────┘
                                │
                   ┌────────────▼────────────┐
                   │  SQLite (WAL mode)       │
                   │  database.sqlite         │
                   │  Backup diario → gzip    │
                   └─────────────────────────┘
```

**Stack:**
- **Frontend:** React 18, Vite, TailwindCSS, react-router-dom, react-helmet-async, axios
- **Backend:** Node.js 20, Express 4, better-sqlite3, bcryptjs, jsonwebtoken, multer, sharp, nodemailer
- **Servidor:** Ubuntu 22.04, Nginx, PM2, Certbot (Let's Encrypt)
- **Base de datos:** SQLite con WAL mode
- **Email:** Gmail + Nodemailer (App Password)

---

## 2. Estructura de carpetas

```
Proyecto UrgenteYA/
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── SEO.jsx          # Meta tags dinámicos (react-helmet-async)
│   │   │   └── TechnicianCard.jsx
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── Home.jsx
│   │   │   ├── TechniciansList.jsx
│   │   │   ├── TechnicianProfile.jsx
│   │   │   ├── MyProfile.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Precios.jsx
│   │   │   ├── Terminos.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminTechnicians.jsx
│   │   │       ├── AdminTechnicianForm.jsx
│   │   │       └── AdminReviews.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Estado global de autenticación
│   │   ├── services/
│   │   │   └── api.js           # Todas las llamadas al backend (axios)
│   │   └── App.jsx              # Rutas de la aplicación
│   ├── public/
│   │   ├── logo.png
│   │   └── robots.txt
│   ├── index.html               # Template con meta tags por defecto
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── server.js            # Entry point, middleware, rutas
│   │   ├── config/
│   │   │   └── database.js      # Schema SQLite + migraciones + índices
│   │   ├── routes/
│   │   │   ├── auth.js          # Login, registro, recuperación contraseña
│   │   │   ├── technicians.js   # CRUD técnicos (público + autenticado)
│   │   │   └── admin.js         # Panel de administración (solo admin)
│   │   ├── middleware/
│   │   │   ├── auth.js          # Verificación JWT
│   │   │   ├── roles.js         # Control de roles (admin/technician)
│   │   │   └── upload.js        # Multer para imágenes
│   │   ├── jobs/
│   │   │   └── expiration.js    # Job diario de vencimientos
│   │   └── utils/
│   │       ├── mailer.js        # Templates de email
│   │       └── imageProcessor.js # Redimensionar con sharp
│   ├── uploads/
│   │   └── technicians/         # Imágenes subidas
│   ├── scripts/
│   │   └── backup.sh            # Script de backup SQLite
│   ├── ecosystem.config.js      # Configuración PM2
│   ├── .env                     # Variables de entorno (NO subir a git)
│   └── .env.example             # Plantilla de variables
│
└── deploy/
    ├── nginx.conf               # Configuración Nginx
    ├── setup-server.sh          # Setup inicial del VPS (ejecutar 1 vez)
    └── deploy.sh                # Script de deploy
```

---

## 3. Base de datos

### Tablas principales

#### `users`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| email | TEXT UNIQUE | Email de acceso |
| password_hash | TEXT | Hash bcrypt (10 rounds) |
| role | TEXT | `admin` o `technician` |
| created_at | DATETIME | Fecha de registro |

#### `technicians`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| user_id | INTEGER FK | Referencia a users |
| name | TEXT | Nombre del maestro |
| phone | TEXT | Teléfono |
| whatsapp | TEXT | Número WhatsApp |
| comuna | TEXT | Comuna donde trabaja |
| category | TEXT | Especialidad (Electricidad, etc.) |
| description | TEXT | Descripción libre |
| years_experience | INTEGER | Años de experiencia |
| price_from | TEXT | Precio referencial |
| availability | TEXT | Horario disponible |
| services_list | TEXT | Servicios específicos |
| is_urgent_24h | INTEGER | 0/1 — disponible 24h |
| status | TEXT | `pending`, `active`, `rejected`, `expired` |
| plan | TEXT | `free`, `premium`, `top` |
| expires_at | DATETIME | Fecha de vencimiento del plan |
| image_url | TEXT | URL de la foto principal |
| expiry_notified | INTEGER | Estado de notificaciones (0-3) |
| created_at | DATETIME | Fecha de registro |

#### `reviews`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| technician_id | INTEGER FK | Técnico evaluado |
| rating | INTEGER | 1 a 5 estrellas |
| comment | TEXT | Comentario (max 500 chars) |
| reviewer_name | TEXT | Nombre del evaluador |
| status | TEXT | `pending` → `approved` (requiere moderación) |
| created_at | DATETIME | Fecha |

#### `technician_images`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| technician_id | INTEGER FK | Técnico dueño |
| filename | TEXT | Nombre del archivo en `/uploads/technicians/` |
| created_at | DATETIME | Fecha de subida |

#### `contact_clicks`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| technician_id | INTEGER FK | Técnico contactado |
| ip_hash | TEXT | SHA256 de IP (privacidad) |
| clicked_at | DATETIME | Fecha del clic |

> Deduplicación: máximo 1 clic por IP por técnico por día

#### `technician_history`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| technician_id | INTEGER FK | Técnico |
| event | TEXT | `created`, `approved`, `rejected`, `activated`, `expired` |
| plan | TEXT | Plan al momento del evento |
| expires_at | DATETIME | Fecha de vencimiento en ese momento |
| note | TEXT | Nota opcional |
| created_at | DATETIME | Fecha del evento |

#### `password_reset_tokens`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | INTEGER PK | ID único |
| user_id | INTEGER FK | Usuario |
| token | TEXT UNIQUE | Token seguro (32 bytes hex) |
| expires_at | DATETIME | Válido por 1 hora |
| used | INTEGER | 0 = no usado, 1 = usado |
| created_at | DATETIME | Fecha de creación |

### Migraciones
Las migraciones se ejecutan automáticamente al iniciar el servidor (`database.js`). Se usa `PRAGMA table_info` para verificar si las columnas existen antes de agregarlas (idempotente).

---

## 4. API — Endpoints

### Base URL
- **Desarrollo:** `http://localhost:3001/api`
- **Producción:** `https://urgenteya.cl/api`

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Registro de nuevo maestro |
| POST | `/auth/login` | No | Login, retorna JWT |
| GET | `/auth/me` | JWT | Datos del usuario actual |
| POST | `/auth/forgot-password` | No | Solicitar reset de contraseña |
| POST | `/auth/reset-password` | No | Establecer nueva contraseña |

### Técnicos (público)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/technicians` | No | Lista activos (máx 120). Filtros: `?search=`, `?comuna=`, `?category=`, `?plan=` |
| GET | `/technicians/:id` | No | Perfil público + imágenes + reseñas aprobadas |
| GET | `/technicians/me` | JWT | Mi perfil de maestro |
| PUT | `/technicians/me` | JWT | Actualizar mi perfil |
| POST | `/technicians/:id/reviews` | No | Enviar reseña (rate limit: 2/día por IP) |
| POST | `/technicians/:id/contact` | No | Registrar clic de contacto (dedup por IP/día) |
| POST | `/technicians/:id/images` | JWT | Subir fotos (máx 5, 10MB c/u) |
| DELETE | `/technicians/:id/images/:filename` | JWT | Eliminar foto |

### Admin (requiere rol admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/technicians` | Lista con filtros y estadísticas de contacto |
| GET | `/admin/technicians/:id` | Detalle + imágenes + reseñas |
| POST | `/admin/technicians` | Crear técnico manualmente |
| PUT | `/admin/technicians/:id` | Editar técnico |
| DELETE | `/admin/technicians/:id` | Eliminar técnico |
| POST | `/admin/technicians/:id/approve` | Aprobar → activo 30 días |
| POST | `/admin/technicians/:id/reject` | Rechazar |
| POST | `/admin/technicians/:id/activate` | Activar con plan y días personalizados |
| POST | `/admin/technicians/:id/expire` | Expirar manualmente |
| GET | `/admin/technicians/:id/history` | Historial de eventos |
| GET | `/admin/stats` | Estadísticas globales |
| GET | `/admin/stats/contacts-monthly` | Contactos WhatsApp por mes (últimos 6) |
| GET | `/admin/options` | Comunas y categorías únicas |
| GET | `/admin/reviews` | Todas las reseñas |
| GET | `/admin/reviews/pending` | Reseñas pendientes de moderación |
| GET | `/admin/reviews/pending-count` | Contador para badge |
| POST | `/admin/reviews/:id/approve` | Aprobar reseña |
| DELETE | `/admin/reviews/:id` | Eliminar reseña |

### Sitemap
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sitemap.xml` | Sitemap dinámico con todos los técnicos activos |

---

## 5. Variables de entorno

### Backend (`backend/.env`)

```env
NODE_ENV=production
PORT=3001

JWT_SECRET=string_largo_aleatorio_64_chars
JWT_EXPIRES_IN=7d

SITE_URL=https://urgenteya.cl
FRONTEND_URL=https://urgenteya.cl

GMAIL_USER=correo@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx

ADMIN_NOTIFY_EMAIL=correo@gmail.com
ADMIN_WHATSAPP=56912345678
```

### Frontend (`frontend/.env`)

```env
VITE_ADMIN_WHATSAPP=56912345678
```

> Para generar un JWT_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 6. Autenticación

- **Método:** JWT (JSON Web Token) en header `Authorization: Bearer <token>`
- **Almacenamiento:** `localStorage` en el frontend
- **Expiración:** 7 días (configurable con `JWT_EXPIRES_IN`)
- **Roles:** `admin` (panel de administración), `technician` (perfil propio)
- **Contraseñas:** Hash con bcrypt, 10 rounds, mínimo 8 caracteres

### Flujo de recuperación de contraseña
1. Usuario envía `POST /auth/forgot-password` con su email
2. Backend genera token seguro (32 bytes hex), válido 1 hora
3. Se envía email con link: `https://urgenteya.cl/recuperar-contrasena?token=xxx`
4. Usuario abre link, ingresa nueva contraseña
5. Backend valida token, actualiza contraseña, marca token como usado

---

## 7. Sistema de emails

Todos los emails se envían de forma **no bloqueante** (`.catch(() => {})`).

| Función | Cuándo se envía | Destinatario |
|---------|----------------|--------------|
| `mailBienvenida` | Al registrarse | Maestro |
| `mailNuevoRegistro` | Al registrarse | Admin |
| `mailAprobado` | Al aprobar perfil | Maestro |
| `mailRechazado` | Al rechazar perfil | Maestro |
| `mailAviso7Dias` | 7 días antes del vencimiento | Maestro |
| `mailAviso3Dias` | 3 días antes del vencimiento | Maestro |
| `mailExpirado` | Al expirar la membresía | Maestro |
| `mailResumenVencimientos` | Diariamente (si hay próximos) | Admin |
| `mailRecuperarContrasena` | Al solicitar reset | Maestro |
| `mailNuevaResena` | Al recibir una reseña | Maestro |

### Configurar Gmail App Password
1. Activar verificación en 2 pasos en tu cuenta Google
2. Ir a Cuenta Google → Seguridad → Contraseñas de aplicaciones
3. Generar contraseña para "Correo" + "Otro dispositivo"
4. Usar esa contraseña en `GMAIL_APP_PASSWORD`

---

## 8. Jobs automáticos

### Job de vencimientos (`expiration.js`)
Se ejecuta **diariamente a las 3:00 AM**:

1. Marca como `expired` los técnicos cuyo `expires_at` ya pasó
2. Envía aviso 3 días antes del vencimiento
3. Envía aviso 7 días antes del vencimiento
4. Envía resumen diario al admin con todos los que vencen en 7 días

### Backup automático (cron)
Configurado en el servidor para las **2:00 AM diariamente**:
```bash
0 2 * * * /var/www/urgenteya/backend/scripts/backup.sh >> /var/log/urgenteya/backup.log 2>&1
```
- Guarda `database_YYYY-MM-DD_HH-MM-SS.sqlite.gz` en `/var/backups/urgenteya/`
- Elimina backups con más de 30 días
- Usa `sqlite3 .backup` para consistencia con WAL mode

---

## 9. Subida de imágenes

- **Límite por técnico:** 5 imágenes
- **Tamaño máximo:** 10MB por imagen
- **Formatos aceptados:** JPG, PNG
- **Procesamiento:** Sharp redimensiona a máx 800px ancho, calidad JPEG 70%
- **Primera imagen** se convierte automáticamente en `image_url` del técnico
- **Almacenamiento:** `/uploads/technicians/{timestamp}_{uuid}.jpg`

---

## 10. Deploy en producción

### Requisitos del servidor
- Ubuntu 22.04 LTS
- Node.js 20
- Nginx
- PM2
- Certbot
- sqlite3 (para backups)

### Primera vez (setup inicial)

```bash
# 1. Conectarte al servidor
ssh root@TU_IP_DEL_SERVIDOR

# 2. Subir el código del proyecto
scp -r /ruta/local/Proyecto\ UrgenteYA root@TU_IP:/var/www/urgenteya

# 3. Ejecutar setup del servidor
bash /var/www/urgenteya/deploy/setup-server.sh

# 4. Crear el archivo .env con valores reales
cp /var/www/urgenteya/backend/.env.example /var/www/urgenteya/backend/.env
nano /var/www/urgenteya/backend/.env  # Completar todos los valores

# 5. Crear .env del frontend
echo "VITE_ADMIN_WHATSAPP=56912345678" > /var/www/urgenteya/frontend/.env

# 6. Primer deploy
bash /var/www/urgenteya/deploy/deploy.sh

# 7. Obtener SSL gratuito
certbot --nginx -d urgenteya.cl -d www.urgenteya.cl
```

### Deploys posteriores (actualizar código)

```bash
# Subir nuevos archivos al servidor
scp -r /ruta/local/Proyecto\ UrgenteYA root@TU_IP:/var/www/urgenteya

# Ejecutar deploy
bash /var/www/urgenteya/deploy/deploy.sh
```

### Comandos útiles en producción

```bash
# Ver estado del backend
pm2 status
pm2 logs urgenteya-backend

# Reiniciar backend
pm2 restart urgenteya-backend

# Ver logs de Nginx
tail -f /var/log/nginx/urgenteya-error.log

# Ver logs de backups
cat /var/log/urgenteya/backup.log

# Hacer backup manual
bash /var/www/urgenteya/backend/scripts/backup.sh

# Verificar que el sitemap funciona
curl https://urgenteya.cl/sitemap.xml

# Verificar health del backend
curl https://urgenteya.cl/api/health
```

---

## 11. Checklist de lanzamiento

### Servidor
- [ ] VPS creado (Hostinger KVM 1 o Clouding.io)
- [ ] Dominio `.cl` apuntando a la IP del VPS (DNS A record)
- [ ] `setup-server.sh` ejecutado
- [ ] SSL activo (Certbot)
- [ ] Firewall configurado (solo puertos 22, 80, 443)

### Backend
- [ ] `.env` creado con valores reales de producción
- [ ] `JWT_SECRET` es un string largo y aleatorio (mínimo 64 chars)
- [ ] Gmail App Password configurado y probado
- [ ] `NODE_ENV=production` en `.env`
- [ ] Backend corriendo con PM2
- [ ] `GET /api/health` responde `{"status":"ok"}`

### Frontend
- [ ] `VITE_ADMIN_WHATSAPP` configurado
- [ ] Build ejecutado (`npm run build`)
- [ ] Archivos en `/var/www/urgenteya/frontend`

### Base de datos
- [ ] Backup diario configurado (cron)
- [ ] Primer backup manual ejecutado y verificado
- [ ] Usuario admin creado en producción

### SEO
- [ ] `sitemap.xml` accesible en `https://urgenteya.cl/sitemap.xml`
- [ ] `robots.txt` accesible en `https://urgenteya.cl/robots.txt`
- [ ] Sitemap enviado a Google Search Console

### Pruebas funcionales
- [ ] Registro de maestro funciona
- [ ] Emails de bienvenida llegan
- [ ] Login y logout funcionan
- [ ] Aprobación de maestro desde admin funciona
- [ ] Subida de fotos funciona
- [ ] Botón WhatsApp funciona y registra el contacto
- [ ] Recuperación de contraseña funciona
- [ ] Reseñas llegan a moderación
- [ ] Sitemap tiene los perfiles activos

---

*Documentación generada para UrgenteYa.cl — Abril 2026*
