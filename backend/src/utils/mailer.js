const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

const ADMIN_EMAIL    = process.env.ADMIN_NOTIFY_EMAIL || process.env.GMAIL_USER;
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '';
const SITE_NAME      = 'UrgenteYa.cl';
const SITE_URL       = process.env.SITE_URL || 'http://localhost:5173';

// Construye el link de WhatsApp del admin para renovar plan actual
function waRenewalLink(maestroName, planActual) {
  if (!ADMIN_WHATSAPP) return null;
  const planTxt = planActual ? ` (plan ${planActual})` : '';
  const text = encodeURIComponent(`Hola, soy ${maestroName} y quiero renovar mi membresía en ${SITE_NAME}${planTxt}`);
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
}

// Link para consultar cómo subir de plan
function waUpgradeLink(maestroName, planActual) {
  if (!ADMIN_WHATSAPP) return null;
  const planTxt = planActual ? ` (actualmente tengo ${planActual})` : '';
  const text = encodeURIComponent(`Hola, soy ${maestroName}${planTxt} y me interesa subir de plan en ${SITE_NAME}. ¿Me puedes dar info?`);
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
}

// Nombre bonito del plan
function planNice(plan) {
  const map = { free: 'Free', premium: 'Premium', top: 'TOP', semanal: 'Semanal' };
  return map[plan] || plan || '—';
}

async function sendMail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[mailer] Sin credenciales Gmail — email omitido');
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"${SITE_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[mailer] ✓ Email enviado a ${to}: ${subject}`);
  } catch (err) {
    console.error(`[mailer] ✗ Error al enviar a ${to}:`, err.message);
  }
}

// ─── Base template ────────────────────────────────────────────────────────────
function base(content) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
    <div style="background:#f97316;padding:20px 24px;border-radius:12px 12px 0 0;">
      <span style="color:white;font-size:22px;font-weight:900;">Urgente</span><span style="color:white;font-size:22px;font-weight:900;">Ya</span><span style="color:rgba(255,255,255,0.7);font-size:13px;">.cl</span>
    </div>
    <div style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
      ${content}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px;">
      ${SITE_NAME} — Marketplace de maestros en Chile
    </p>
  </div>`;
}

// Botón WhatsApp para emails al maestro (solo renovar)
function waButton(maestroName, planActual) {
  const link = waRenewalLink(maestroName, planActual);
  if (!link) return '';
  return `
  <div style="text-align:center;margin-top:20px;">
    <a href="${link}" style="display:inline-flex;align-items:center;gap:8px;background:#25d366;color:white;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
      <span style="font-size:20px;">💬</span> Renovar por WhatsApp
    </a>
    <p style="color:#9ca3af;font-size:11px;margin-top:8px;">Te responderemos a la brevedad</p>
  </div>`;
}

// Doble botón: Renovar + Subir de plan (para emails de vencimiento)
function renovarOActualizar(maestroName, planActual) {
  const wRenew   = waRenewalLink(maestroName, planNice(planActual));
  const wUpgrade = waUpgradeLink(maestroName, planNice(planActual));
  const preciosUrl = `${SITE_URL}/precios`;

  if (!wRenew && !wUpgrade) return '';

  return `
  <div style="text-align:center;margin-top:24px;">
    ${wRenew ? `
      <a href="${wRenew}" style="display:inline-block;background:#25d366;color:white;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin:4px;">
        💬 Renovar plan ${planNice(planActual)}
      </a>` : ''}
    ${wUpgrade ? `
      <a href="${wUpgrade}" style="display:inline-block;background:#f97316;color:white;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin:4px;">
        ⭐ Subir de plan
      </a>` : ''}
    <div style="margin-top:14px;">
      <a href="${preciosUrl}" style="color:#6b7280;text-decoration:underline;font-size:12px;">Ver todos los planes y precios →</a>
    </div>
    <p style="color:#9ca3af;font-size:11px;margin-top:10px;">Te respondemos por WhatsApp en minutos</p>
  </div>`;
}

// ─── Emails al admin ──────────────────────────────────────────────────────────

// 1. Nuevo registro
function mailNuevoRegistro(tech) {
  return sendMail({
    to: ADMIN_EMAIL,
    subject: `[${SITE_NAME}] Nuevo maestro registrado: ${tech.name}`,
    html: base(`
      <h2 style="color:#1f2937;margin-top:0;">Nuevo maestro pendiente de aprobación</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Nombre</td><td style="padding:6px 0;font-weight:600;">${tech.name}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Categoría</td><td style="padding:6px 0;">${tech.category}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Comuna</td><td style="padding:6px 0;">${tech.comuna}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Teléfono</td><td style="padding:6px 0;">${tech.phone}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;">${tech.email || '—'}</td></tr>
      </table>
      ${tech.description ? `<p style="background:#f9fafb;padding:12px;border-radius:8px;font-size:13px;color:#374151;margin-top:16px;">${tech.description}</p>` : ''}
      <div style="margin-top:24px;text-align:center;">
        <a href="${SITE_URL}/admin" style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ir al panel de administración
        </a>
      </div>
    `),
  });
}

// ─── Emails al maestro ────────────────────────────────────────────────────────

// 2. Aprobado
function mailAprobado(maestro) {
  if (!maestro.email) return Promise.resolve();
  return sendMail({
    to: maestro.email,
    subject: `¡Tu perfil fue aprobado en ${SITE_NAME}!`,
    html: base(`
      <h2 style="color:#16a34a;margin-top:0;">¡Bienvenido a ${SITE_NAME}!</h2>
      <p style="font-size:15px;">Hola <strong>${maestro.name}</strong>, tu perfil fue <strong style="color:#16a34a;">aprobado</strong> y ya estás visible para clientes en <strong>${maestro.comuna}</strong> que buscan servicios de <strong>${maestro.category}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#15803d;">
          Recuerda completar tu perfil con fotos de tus trabajos y la lista de servicios que ofreces para destacar más.
        </p>
      </div>

      <!-- Banner Precio Fundador -->
      <div style="background:linear-gradient(135deg,#fef3c7,#fed7aa);border:2px solid #fbbf24;border-radius:10px;padding:18px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 6px 0;font-size:11px;font-weight:900;color:#92400e;letter-spacing:1px;text-transform:uppercase;">🏆 Oferta de lanzamiento</p>
        <p style="margin:0 0 8px 0;font-size:16px;font-weight:800;color:#1f2937;">Precio Fundador: 50% OFF por 3 meses</p>
        <p style="margin:0 0 10px 0;font-size:13px;color:#374151;line-height:1.5;">
          Después de tus 30 días gratis, el plan Premium normal cuesta <strong>$17.990</strong>, pero a los <strong style="color:#ea580c;">primeros 20 maestros de ${maestro.comuna}</strong> les damos el plan a <strong style="color:#16a34a;">$8.995 por 3 meses</strong>.
        </p>
        <p style="margin:0;font-size:12px;color:#6b7280;">
          ✓ Sin comisión por cliente &nbsp;·&nbsp; ✓ Precio garantizado los 3 meses
        </p>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${SITE_URL}/mi-perfil" style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ver mi perfil
        </a>
      </div>
    `),
  });
}

// 3. Rechazado
function mailRechazado(maestro) {
  if (!maestro.email) return Promise.resolve();
  return sendMail({
    to: maestro.email,
    subject: `Actualización sobre tu solicitud en ${SITE_NAME}`,
    html: base(`
      <h2 style="color:#dc2626;margin-top:0;">Tu perfil no pudo ser aprobado</h2>
      <p style="font-size:15px;">Hola <strong>${maestro.name}</strong>, revisamos tu solicitud y lamentablemente tu perfil no fue aprobado en este momento.</p>
      <p style="font-size:14px;color:#6b7280;">Si tienes dudas o quieres corregir algún dato, contáctanos directamente por WhatsApp.</p>
      ${waButton(maestro.name, maestro.plan)}
    `),
  });
}

// 4. Aviso 7 días antes del vencimiento
function mailAviso7Dias(maestro) {
  if (!maestro.email) return Promise.resolve();
  return sendMail({
    to: maestro.email,
    subject: `Tu membresía en ${SITE_NAME} vence en 7 días`,
    html: base(`
      <h2 style="color:#d97706;margin-top:0;">Tu membresía vence en 7 días</h2>
      <p style="font-size:15px;">Hola <strong>${maestro.name}</strong>, te recordamos que tu membresía <strong style="color:#f97316;">${planNice(maestro.plan)}</strong> en ${SITE_NAME} vence el <strong>${new Date(maestro.expires_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          Después de esa fecha tu perfil <strong>dejará de aparecer</strong> en el listado de maestros y los clientes no podrán encontrarte.
        </p>
      </div>
      <p style="font-size:14px;color:#374151;">¿Quieres <strong>renovar tu plan actual</strong> o <strong>subir a uno con más visibilidad</strong> para recibir más clientes? Escríbenos por WhatsApp y coordinamos en minutos.</p>
      ${renovarOActualizar(maestro.name, maestro.plan)}
    `),
  });
}

// 5. Aviso 3 días antes del vencimiento (urgente)
function mailAviso3Dias(maestro) {
  if (!maestro.email) return Promise.resolve();
  return sendMail({
    to: maestro.email,
    subject: `⚠️ Quedan solo 3 días — Renueva o actualiza tu plan en ${SITE_NAME}`,
    html: base(`
      <h2 style="color:#dc2626;margin-top:0;">¡Solo quedan 3 días!</h2>
      <p style="font-size:15px;">Hola <strong>${maestro.name}</strong>, tu membresía <strong style="color:#f97316;">${planNice(maestro.plan)}</strong> vence el <strong>${new Date(maestro.expires_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</strong> y aún no hemos recibido tu renovación.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#991b1b;">
          Si no renuevas antes de esa fecha, tu perfil <strong>será desactivado automáticamente</strong> y los clientes no podrán contactarte.
        </p>
      </div>
      <p style="font-size:14px;color:#374151;">Tienes dos opciones:</p>
      <ul style="font-size:14px;color:#374151;padding-left:20px;margin:8px 0;">
        <li><strong>Renovar</strong> tu plan ${planNice(maestro.plan)} actual</li>
        <li><strong>Actualizar</strong> a un plan superior para recibir más clientes y aparecer destacado</li>
      </ul>
      ${renovarOActualizar(maestro.name, maestro.plan)}
    `),
  });
}

// 6. Aviso de membresía expirada
function mailExpirado(maestro) {
  if (!maestro.email) return Promise.resolve();
  return sendMail({
    to: maestro.email,
    subject: `Tu perfil en ${SITE_NAME} se desactivó — ¿Quieres renovar o actualizar?`,
    html: base(`
      <h2 style="color:#6b7280;margin-top:0;">Tu membresía ha vencido</h2>
      <p style="font-size:15px;">Hola <strong>${maestro.name}</strong>, tu membresía <strong style="color:#f97316;">${planNice(maestro.plan)}</strong> en ${SITE_NAME} ha expirado y tu perfil ya <strong>no está visible</strong> para los clientes.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 10px 0;font-size:13px;color:#374151;font-weight:700;">¡Pero puedes reactivarlo hoy mismo!</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">
          Escríbenos por WhatsApp y te activamos en minutos. Si quieres, también puedes aprovechar para <strong>cambiar a un plan con más visibilidad</strong> y recibir más clientes.
        </p>
      </div>
      ${renovarOActualizar(maestro.name, maestro.plan)}
    `),
  });
}

// ─── Resumen diario al admin ───────────────────────────────────────────────────
function mailResumenVencimientos(maestros) {
  if (!maestros || maestros.length === 0) return Promise.resolve();
  const filas = maestros.map(m => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;">${m.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${m.category}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${m.comuna}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;color:#d97706;font-weight:600;">${m.dias_restantes} día${m.dias_restantes !== 1 ? 's' : ''}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;">${m.email || '—'}</td>
    </tr>
  `).join('');

  return sendMail({
    to: ADMIN_EMAIL,
    subject: `[${SITE_NAME}] ${maestros.length} membresía${maestros.length !== 1 ? 's' : ''} por vencer`,
    html: base(`
      <h2 style="color:#d97706;margin-top:0;">Membresías próximas a vencer</h2>
      <p style="font-size:14px;color:#6b7280;">Resumen diario — maestros activos con membresía en los próximos 7 días:</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:8px;color:#374151;">Nombre</th>
            <th style="text-align:left;padding:8px;color:#374151;">Categoría</th>
            <th style="text-align:left;padding:8px;color:#374151;">Comuna</th>
            <th style="text-align:left;padding:8px;color:#374151;">Vence en</th>
            <th style="text-align:left;padding:8px;color:#374151;">Email</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${SITE_URL}/admin" style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ir al panel
        </a>
      </div>
    `),
  });
}

// 7. Bienvenida al maestro recién registrado
function mailBienvenida(maestro) {
  if (!maestro.email) return Promise.resolve();
  return sendMail({
    to: maestro.email,
    subject: `¡Gracias por registrarte en ${SITE_NAME}!`,
    html: base(`
      <h2 style="color:#f97316;margin-top:0;">¡Bienvenido a ${SITE_NAME}, ${maestro.name}!</h2>
      <p style="font-size:15px;color:#374151;">
        Gracias por registrar tu perfil. Recibimos tu solicitud y la estamos revisando.
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px;margin:20px 0;">
        <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#c2410c;">¿Qué pasa ahora?</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:1.8;">
          <li>Nuestro equipo revisará tu solicitud en las próximas horas</li>
          <li>Te avisaremos por correo cuando tu perfil sea aprobado</li>
          <li>Una vez aprobado, los clientes de <strong>${maestro.comuna}</strong> podrán encontrarte</li>
        </ul>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <tr>
          <td style="padding:5px 0;color:#9ca3af;width:130px;">Nombre</td>
          <td style="padding:5px 0;font-weight:600;color:#1f2937;">${maestro.name}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#9ca3af;">Categoría</td>
          <td style="padding:5px 0;color:#1f2937;">${maestro.category}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#9ca3af;">Comuna</td>
          <td style="padding:5px 0;color:#1f2937;">${maestro.comuna}</td>
        </tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">
        Si tienes dudas o quieres consultarnos algo, escríbenos directamente a
        <a href="mailto:${ADMIN_EMAIL}" style="color:#f97316;text-decoration:none;">${ADMIN_EMAIL}</a>
        ${ADMIN_WHATSAPP ? ` o por <a href="https://wa.me/${ADMIN_WHATSAPP}" style="color:#25d366;text-decoration:none;">WhatsApp</a>` : ''}.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${SITE_URL}" style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Visitar ${SITE_NAME}
        </a>
      </div>
    `),
  });
}

// 8. Nueva reseña al maestro
function mailNuevaResena(maestro, review) {
  if (!maestro.email) return Promise.resolve();
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  return sendMail({
    to: maestro.email,
    subject: `Nueva reseña en tu perfil de ${SITE_NAME}`,
    html: base(`
      <h2 style="color:#f97316;margin-top:0;">Recibiste una nueva reseña</h2>
      <p style="font-size:15px;color:#374151;">Hola <strong>${maestro.name}</strong>, un cliente dejó una reseña en tu perfil.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:18px;margin:20px 0;">
        <p style="font-size:22px;margin:0 0 8px 0;color:#f59e0b;">${stars}</p>
        ${review.reviewer_name ? `<p style="margin:0 0 4px 0;font-size:13px;color:#6b7280;">Por: <strong style="color:#374151;">${review.reviewer_name}</strong></p>` : ''}
        ${review.comment ? `<p style="margin:0;font-size:14px;color:#374151;font-style:italic;">"${review.comment}"</p>` : '<p style="margin:0;font-size:13px;color:#9ca3af;font-style:italic;">Sin comentario</p>'}
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:8px;">
        <p style="margin:0;font-size:12px;color:#6b7280;">
          Esta reseña será visible públicamente una vez que sea revisada por nuestro equipo.
        </p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${SITE_URL}/tecnicos/${maestro.id}" style="background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ver mi perfil
        </a>
      </div>
    `),
  });
}

// 9. Recuperación de contraseña
function mailRecuperarContrasena(user, resetUrl) {
  if (!user.email) return Promise.resolve();
  return sendMail({
    to: user.email,
    subject: `Recupera tu contraseña en ${SITE_NAME}`,
    html: base(`
      <h2 style="color:#f97316;margin-top:0;">Recupera tu contraseña</h2>
      <p style="font-size:15px;color:#374151;">
        Hola <strong>${user.name}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en ${SITE_NAME}.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="background:#f97316;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
          Restablecer contraseña
        </a>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:8px;">
        <p style="margin:0;font-size:12px;color:#6b7280;">
          Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.
        </p>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin-top:16px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <a href="${resetUrl}" style="color:#f97316;word-break:break-all;">${resetUrl}</a>
      </p>
    `),
  });
}

module.exports = {
  mailNuevoRegistro,
  mailBienvenida,
  mailAprobado,
  mailRechazado,
  mailAviso7Dias,
  mailAviso3Dias,
  mailExpirado,
  mailRecuperarContrasena,
  mailResumenVencimientos,
  mailNuevaResena,
};
