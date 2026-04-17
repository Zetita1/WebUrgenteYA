import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP || '';

function waLink(plan) {
  if (!ADMIN_WHATSAPP) return '/registro';
  const text = encodeURIComponent(`Hola, quiero publicar mi perfil en UrgenteYa.cl con el plan ${plan}`);
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
}

const PLANES = [
  {
    id: 'free',
    nombre: 'Free',
    precio: 'Gratis',
    subtitulo: '30 días',
    descripcion: 'Ideal para conocer la plataforma sin compromiso.',
    color: 'border-gray-200',
    badge: null,
    btnClass: 'bg-gray-800 hover:bg-gray-900 text-white',
    beneficios: [
      { ok: true,  texto: 'Perfil visible en el directorio' },
      { ok: true,  texto: 'Contacto directo por WhatsApp y teléfono' },
      { ok: true,  texto: 'Galería de hasta 5 fotos' },
      { ok: true,  texto: 'Reseñas de clientes' },
      { ok: false, texto: 'Posición destacada en búsquedas' },
      { ok: false, texto: 'Badge "Premium" en el perfil' },
      { ok: false, texto: 'Posición TOP en el listado' },
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: '$17.990',
    subtitulo: 'al mes',
    descripcion: 'Para maestros que quieren recibir más clientes de forma constante. Precio Fundador: $8.995 los primeros 3 meses (cupos limitados).',
    color: 'border-brand-400 ring-2 ring-brand-300',
    badge: 'Más popular',
    badgeColor: 'bg-brand-500 text-white',
    btnClass: 'bg-brand-500 hover:bg-brand-600 text-white',
    beneficios: [
      { ok: true, texto: 'Perfil visible en el directorio' },
      { ok: true, texto: 'Contacto directo por WhatsApp y teléfono' },
      { ok: true, texto: 'Galería de hasta 5 fotos' },
      { ok: true, texto: 'Reseñas de clientes' },
      { ok: true, texto: 'Posición destacada en búsquedas' },
      { ok: true, texto: 'Badge "Premium" en el perfil' },
      { ok: false, texto: 'Posición TOP en el listado' },
    ],
  },
  {
    id: 'top',
    nombre: 'TOP',
    precio: '$29.990',
    subtitulo: 'al mes',
    descripcion: 'Para maestros que quieren máxima visibilidad y más trabajos.',
    color: 'border-yellow-400',
    badge: 'Máxima visibilidad',
    badgeColor: 'bg-yellow-400 text-yellow-900',
    btnClass: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold',
    beneficios: [
      { ok: true, texto: 'Perfil visible en el directorio' },
      { ok: true, texto: 'Contacto directo por WhatsApp y teléfono' },
      { ok: true, texto: 'Galería de hasta 10 fotos' },
      { ok: true, texto: 'Reseñas de clientes' },
      { ok: true, texto: 'Posición destacada en búsquedas' },
      { ok: true, texto: 'Posición TOP en el listado' },
      { ok: true, texto: 'Badge "TOP" destacado' },
    ],
  },
];

const FAQS = [
  {
    q: '¿Cómo funciona el Precio Fundador de $8.995?',
    a: 'A los primeros 20 maestros aprobados de cada comuna les aplicamos 50% de descuento en el plan Premium ($8.995 en vez de $17.990) durante los primeros 3 meses. Es nuestra forma de agradecer a los que confían desde el inicio. Una vez que se complete el cupo de tu comuna, el precio vuelve a la tarifa normal.',
  },
  {
    q: '¿Cómo se realiza el pago?',
    a: 'El pago se coordina directamente por WhatsApp con el administrador. Aceptamos transferencia bancaria.',
  },
  {
    q: '¿Puedo cambiar de plan después?',
    a: 'Sí, puedes subir o bajar de plan en cualquier momento. Escríbenos por WhatsApp y lo cambiamos de inmediato.',
  },
  {
    q: '¿Qué pasa si no renuevo a tiempo?',
    a: 'Tu perfil se desactiva automáticamente al vencer la membresía. Los clientes dejarán de verte. Puedes reactivarlo cuando quieras.',
  },
  {
    q: '¿El plan Free es realmente gratis?',
    a: 'Sí. Los primeros 30 días desde que te aprobamos son completamente gratis, sin tarjeta ni compromiso.',
  },
  {
    q: '¿Cuánto tiempo tarda en aprobarse mi perfil?',
    a: 'Revisamos los perfiles en menos de 24 horas hábiles. Te avisamos por correo cuando esté activo.',
  },
];

function CheckIcon({ ok }) {
  if (ok) return (
    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
  return (
    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{q}</span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Precios() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Planes y precios"
        description="Publica tu perfil de maestro en UrgenteYa.cl. Plan gratuito disponible. Llega a más clientes en tu comuna sin intermediarios."
        url="/precios"
      />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white pt-14 pb-10 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block bg-brand-100 text-brand-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Planes y precios
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
            Llega a más clientes<br />en tu comuna
          </h1>
          <p className="text-gray-500 text-lg">
            Elige el plan que mejor se adapte a ti. Sin contratos, sin permanencia mínima.
          </p>
        </div>
      </section>

      {/* Banner Precio Fundador */}
      <section className="px-4 pb-2 pt-8 max-w-4xl mx-auto w-full">
        <div className="relative bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 md:p-8 text-center">
          {/* Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-wide inline-flex items-center gap-1 whitespace-nowrap z-10">
            <span>🏆</span> Oferta de lanzamiento
          </div>

          <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 mt-2">
            Precio Fundador — 50% OFF por 3 meses
          </h3>

          {/* Precio destacado centrado */}
          <div className="inline-flex items-baseline gap-3 bg-white rounded-xl px-6 py-3 border border-yellow-300 mb-4 shadow-sm">
            <span className="text-sm text-gray-400 line-through">$17.990</span>
            <span className="text-3xl md:text-4xl font-black text-green-600">$8.995</span>
            <span className="text-xs text-gray-500">al mes · 3 meses</span>
          </div>

          <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Después de los 30 días gratis, el plan <strong>Premium</strong> normal cuesta <strong>$17.990</strong>.
            Pero a los <strong className="text-orange-600">primeros 20 maestros de cada comuna</strong> los dejamos en{' '}
            <strong className="text-green-600">$8.995 por 3 meses</strong>.
          </p>

          <p className="text-xs text-gray-500 mt-4">
            ✓ Sin comisión por cliente &nbsp;·&nbsp; ✓ Sin contratos &nbsp;·&nbsp; ✓ Precio garantizado los 3 meses
          </p>
        </div>
      </section>

      {/* Planes */}
      <section className="px-4 pb-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANES.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${plan.color}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}

              {/* Encabezado */}
              <div className="mb-5">
                <h2 className="text-xl font-black text-gray-900">{plan.nombre}</h2>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-black text-gray-900">{plan.precio}</span>
                  {plan.subtitulo && (
                    <span className="text-gray-400 text-sm mb-1">{plan.subtitulo}</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{plan.descripcion}</p>
              </div>

              {/* Beneficios */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.beneficios.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckIcon ok={b.ok} />
                    <span className={`text-sm ${b.ok ? 'text-gray-700' : 'text-gray-400'}`}>
                      {b.texto}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.id === 'free' ? (
                <Link
                  to="/registro"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.btnClass}`}
                >
                  Registrarme gratis
                </Link>
              ) : (
                <a
                  href={waLink(plan.nombre)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.btnClass}`}
                >
                  Quiero el plan {plan.nombre}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Nota pago */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Pagos por transferencia bancaria · Sin contratos · Cancela cuando quieras
        </p>
      </section>

      {/* Cómo funciona */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { n: '1', title: 'Regístrate gratis', desc: 'Crea tu perfil con tus datos, categoría y fotos. Sin costo inicial.' },
              { n: '2', title: 'Te aprobamos', desc: 'Revisamos tu perfil en menos de 24 horas y te avisamos por correo.' },
              { n: '3', title: 'Recibe clientes', desc: 'Los clientes te encuentran y te contactan directo por WhatsApp.' },
            ].map(step => (
              <div key={step.n} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-brand-500 text-white font-black text-xl rounded-full flex items-center justify-center mb-3">
                  {step.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gray-900 py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-black text-white mb-3">¿Listo para empezar?</h2>
          <p className="text-gray-400 mb-6">Los primeros 30 días son completamente gratis.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/registro" className="btn-primary px-8 py-3 text-base font-bold">
              Crear mi perfil gratis
            </Link>
            {ADMIN_WHATSAPP && (
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent('Hola, tengo dudas sobre los planes de UrgenteYa.cl')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-semibold text-base transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
