# UrgenteYa.cl — Marketplace de Técnicos en Chile

Sistema completo: backend Node.js + Express + SQLite y frontend React + Vite + Tailwind CSS.

---

## Requisitos

- **Node.js** v18 o superior → https://nodejs.org
- **npm** (viene con Node.js)

---

## Instalación

### 1. Backend

```bash
cd backend
npm install
```

Crea el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` si quieres cambiar el email/contraseña del admin.

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Ejecución (Desarrollo)

Abre **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
→ Servidor en http://localhost:3001

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
→ App en http://localhost:5173

---

## Primer uso: cargar datos de prueba

Con el backend corriendo, ejecuta en otra terminal:

```bash
cd backend
npm run seed
```

Esto crea:
- ✅ Usuario administrador
- ✅ 20 técnicos mock con distintos estados y planes
- ✅ Reseñas de ejemplo

---

## Accesos

| Rol | URL | Email | Contraseña |
|-----|-----|-------|------------|
| Admin | http://localhost:5173/admin | admin@urgenteyacl.cl | Admin123! |
| Sitio público | http://localhost:5173 | — | — |

---

## Estructura del proyecto

```
Proyecto UrgenteYA/
├── backend/
│   ├── src/
│   │   ├── config/database.js    # SQLite + schema
│   │   ├── middleware/           # auth, roles, upload
│   │   ├── routes/
│   │   │   ├── auth.js           # login, registro, /me
│   │   │   ├── technicians.js    # API pública
│   │   │   └── admin.js          # Panel admin (protegido)
│   │   ├── jobs/expiration.js    # Job diario de expiración
│   │   ├── utils/imageProcessor.js
│   │   ├── seed.js               # Datos mock
│   │   └── server.js
│   ├── uploads/technicians/      # Imágenes subidas
│   ├── database.sqlite           # Se crea automáticamente
│   └── .env
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── TechniciansList.jsx
        │   ├── TechnicianProfile.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── admin/
        │       ├── AdminLayout.jsx
        │       ├── AdminTechnicians.jsx    # Tabla + acciones
        │       └── AdminTechnicianForm.jsx # Crear/Editar
        ├── components/
        │   ├── Header.jsx
        │   ├── Footer.jsx
        │   └── TechnicianCard.jsx
        ├── context/AuthContext.jsx
        └── services/api.js
```

---

## Funcionalidades

### Panel Admin (`/admin`)
- ✅ Ver todos los técnicos con filtros (estado, plan, búsqueda)
- ✅ Sección dedicada a técnicos **pendientes de aprobación**
- ✅ Aprobar / Rechazar técnicos registrados
- ✅ **Crear técnico manualmente** sin registro previo
- ✅ Editar cualquier técnico (nombre, plan, estado, expiración)
- ✅ Activar técnico expirado (con plan y días configurables)
- ✅ Expirar técnico manualmente
- ✅ Eliminar técnico
- ✅ Estadísticas: total, pendientes, activos, expirados

### Sitio público
- ✅ Landing page con buscador y categorías
- ✅ Lista de técnicos con filtros (categoría, comuna, urgencia 24h)
- ✅ Perfil completo del técnico
- ✅ Botón directo a **WhatsApp** con mensaje pre-cargado
- ✅ Sistema de reseñas y calificaciones
- ✅ Registro de técnicos (queda en estado "pendiente")

### Automatización
- ✅ Job que corre cada 24h y marca como "expirados" los técnicos con `expires_at` vencido
- ✅ Solo técnicos `status = 'active'` aparecen en el sitio público

### Seguridad
- ✅ bcrypt para contraseñas
- ✅ JWT con expiración
- ✅ Middleware de roles (admin / technician)
- ✅ Rate limiting (200 req/15min global, 20 req/15min en login)
- ✅ Validación de inputs
- ✅ Procesamiento de imágenes con sharp (resize 800px, JPEG 70%)

---

## Modelo de negocio

| Plan | Precio | Visibilidad |
|------|--------|-------------|
| Free | $0 | 30 días tras aprobación |
| Premium | $21.000 CLP/mes | Posición normal con badge |
| TOP | $35.000 CLP/mes | Primero + badge especial |

**Regla:** Si `expires_at` < hoy → status = `expired` → no visible en sitio público.

---

## Producción (deploy futuro)

1. Configurar `NODE_ENV=production` en `.env`
2. Actualizar `CORS origin` en `server.js` con el dominio real
3. Construir frontend: `npm run build` → sirve `dist/` con Nginx o similar
4. Usar PM2 para el backend: `pm2 start src/server.js --name urgenteyacl`
5. Para escalar: migrar SQLite → PostgreSQL (el schema es compatible)
# WebUrgenteYA
