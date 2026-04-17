require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('./config/database');

const db = getDb();

console.log('🌱 Iniciando seed de datos...');

// ─── Admin ────────────────────────────────────────────────────────────────────
const adminEmail = process.env.ADMIN_EMAIL || 'admin@urgenteyacl.cl';
const adminPass = process.env.ADMIN_PASSWORD || 'Admin123!';

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(
    adminEmail, bcrypt.hashSync(adminPass, 10), 'admin'
  );
  console.log(`✅ Admin creado: ${adminEmail} / ${adminPass}`);
} else {
  console.log(`ℹ️  Admin ya existe: ${adminEmail}`);
}

// ─── Mock Técnicos ────────────────────────────────────────────────────────────
const comunas = [
  'Santiago Centro', 'Providencia', 'Las Condes', 'Maipú', 'La Florida',
  'Ñuñoa', 'San Miguel', 'Pudahuel', 'La Pintana', 'Quilicura',
  'Conchalí', 'Recoleta', 'Vitacura', 'Lo Barnechea', 'Peñalolén'
];

const categories = [
  'Electricidad', 'Gasfitería', 'Refrigeración', 'Computadores',
  'Cerrajería', 'Pintura', 'Albañilería', 'Jardinería',
  'Electrodomésticos', 'Climatización', 'Carpintería', 'Soldadura'
];

const mockTechnicians = [
  { name: 'Carlos Rodríguez', phone: '+56912345678', comuna: 'Santiago Centro', category: 'Electricidad', plan: 'top', status: 'active', is_urgent_24h: 1, days: 25 },
  { name: 'María González', phone: '+56923456789', comuna: 'Providencia', category: 'Gasfitería', plan: 'premium', status: 'active', is_urgent_24h: 1, days: 15 },
  { name: 'Juan Pérez', phone: '+56934567890', comuna: 'Las Condes', category: 'Refrigeración', plan: 'premium', status: 'active', is_urgent_24h: 0, days: 20 },
  { name: 'Ana Martínez', phone: '+56945678901', comuna: 'Maipú', category: 'Electricidad', plan: 'free', status: 'active', is_urgent_24h: 0, days: 28 },
  { name: 'Pedro Soto', phone: '+56956789012', comuna: 'La Florida', category: 'Computadores', plan: 'top', status: 'active', is_urgent_24h: 1, days: 10 },
  { name: 'Lucia Fernández', phone: '+56967890123', comuna: 'Ñuñoa', category: 'Cerrajería', plan: 'premium', status: 'active', is_urgent_24h: 1, days: 5 },
  { name: 'Roberto Díaz', phone: '+56978901234', comuna: 'San Miguel', category: 'Pintura', plan: 'free', status: 'active', is_urgent_24h: 0, days: 30 },
  { name: 'Carmen López', phone: '+56989012345', comuna: 'Pudahuel', category: 'Electrodomésticos', plan: 'premium', status: 'active', is_urgent_24h: 1, days: 18 },
  { name: 'Miguel Torres', phone: '+56990123456', comuna: 'Quilicura', category: 'Climatización', plan: 'free', status: 'active', is_urgent_24h: 0, days: 22 },
  { name: 'Sandra Vargas', phone: '+56901234567', comuna: 'La Pintana', category: 'Gasfitería', plan: 'free', status: 'active', is_urgent_24h: 0, days: 14 },
  { name: 'Felipe Morales', phone: '+56912233445', comuna: 'Recoleta', category: 'Albañilería', plan: 'premium', status: 'active', is_urgent_24h: 0, days: 8 },
  { name: 'Isabel Castro', phone: '+56923344556', comuna: 'Conchalí', category: 'Carpintería', plan: 'free', status: 'active', is_urgent_24h: 1, days: 27 },
  { name: 'Andrés Muñoz', phone: '+56934455667', comuna: 'Vitacura', category: 'Electricidad', plan: 'top', status: 'active', is_urgent_24h: 1, days: 3 },
  { name: 'Patricia Herrera', phone: '+56945566778', comuna: 'Lo Barnechea', category: 'Jardinería', plan: 'free', status: 'active', is_urgent_24h: 0, days: 16 },
  { name: 'Diego Rojas', phone: '+56956677889', comuna: 'Peñalolén', category: 'Soldadura', plan: 'premium', status: 'active', is_urgent_24h: 0, days: 11 },
  // Pendientes
  { name: 'Valentina Silva', phone: '+56967788990', comuna: 'Maipú', category: 'Electricidad', plan: 'free', status: 'pending', is_urgent_24h: 0, days: 30 },
  { name: 'Cristóbal Fuentes', phone: '+56978899001', comuna: 'Las Condes', category: 'Gasfitería', plan: 'free', status: 'pending', is_urgent_24h: 1, days: 30 },
  // Rechazados
  { name: 'Mario Espinoza', phone: '+56989900112', comuna: 'Santiago Centro', category: 'Pintura', plan: 'free', status: 'rejected', is_urgent_24h: 0, days: 30 },
  // Expirados
  { name: 'Rosa Contreras', phone: '+56990011223', comuna: 'La Florida', category: 'Cerrajería', plan: 'free', status: 'expired', is_urgent_24h: 0, days: -5 },
  { name: 'Hernán Pizarro', phone: '+56901122334', comuna: 'Ñuñoa', category: 'Refrigeración', plan: 'premium', status: 'expired', is_urgent_24h: 1, days: -2 },
];

const descriptions = {
  'Electricidad': 'Instalaciones eléctricas residenciales y comerciales. Reparación de tableros, enchufes, luminarias y sistemas completos. Trabajo garantizado.',
  'Gasfitería': 'Reparación de cañerías, instalación de artefactos sanitarios, destapes de alcantarillado y emergencias 24/7. Presupuesto sin costo.',
  'Refrigeración': 'Mantención y reparación de refrigeradores, freezers y equipos de frío comercial. Carga de gas, cambio de repuestos.',
  'Computadores': 'Reparación de PC, laptop, formateo, instalación de sistemas, recuperación de datos y redes domésticas.',
  'Cerrajería': 'Apertura de puertas, duplicado de llaves, cambio de chapas y cerraduras de seguridad. Servicio de urgencia disponible.',
  'Pintura': 'Pintura interior y exterior, papel mural, estuco y terminaciones. Presupuesto sin compromiso.',
  'Albañilería': 'Construcción, reparación de muros, enchapes, pisos cerámicos y obras menores.',
  'Jardinería': 'Poda de árboles, mantención de jardines, instalación de riego automático y diseño de áreas verdes.',
  'Electrodomésticos': 'Reparación de lavadoras, lavavajillas, hornos, microondas y cocinas. Repuestos originales.',
  'Climatización': 'Instalación y mantención de aire acondicionado, calefacción central y sistemas mini-split.',
  'Carpintería': 'Muebles a medida, reparaciones de puertas y ventanas, decks y pérgolas en madera.',
  'Soldadura': 'Soldadura autógena, MIG, TIG. Portones, rejas, estructuras metálicas y fierros de construcción.'
};

const insertTech = db.prepare(`
  INSERT INTO technicians (name, phone, whatsapp, comuna, category, description, is_urgent_24h, status, plan, expires_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (technician_id, rating, comment, reviewer_name) VALUES (?, ?, ?, ?)
`);

const reviewComments = [
  ['Excelente trabajo, muy puntual y profesional. Totalmente recomendado.', 'Javier M.', 5],
  ['Buen servicio, llegó rápido y solucionó el problema al tiro.', 'Patricia L.', 4],
  ['Muy honesto con el presupuesto, sin sorpresas. Volveré a llamarlo.', 'Gonzalo R.', 5],
  ['Trabajo bien hecho, el precio fue justo.', 'Andrea F.', 4],
  ['Rápido y eficiente, resolvió el problema en menos de una hora.', 'Carlos S.', 5],
];

let techCreated = 0;
for (const t of mockTechnicians) {
  const existing = db.prepare('SELECT id FROM technicians WHERE phone = ?').get(t.phone);
  if (existing) continue;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + t.days);

  const result = insertTech.run(
    t.name, t.phone, t.phone,
    t.comuna, t.category,
    descriptions[t.category] || 'Técnico profesional con amplia experiencia.',
    t.is_urgent_24h ? 1 : 0,
    t.status, t.plan,
    expiresAt.toISOString()
  );

  // Agregar reseñas a técnicos activos
  if (t.status === 'active') {
    const numReviews = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numReviews; i++) {
      const [comment, reviewer, rating] = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      insertReview.run(result.lastInsertRowid, rating, comment, reviewer);
    }
  }

  techCreated++;
}

console.log(`✅ ${techCreated} técnicos mock creados`);
console.log('\n🎉 Seed completado.');
console.log(`\n📌 Credenciales admin:`);
console.log(`   Email: ${adminEmail}`);
console.log(`   Pass:  ${adminPass}`);
