import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import TechnicianCard from '../components/TechnicianCard';
import SearchBox from '../components/SearchBox';
import { getTechnicians } from '../services/api';

/* ── Iconos SVG por categoría ── */
const CategoryIcon = ({ name, className = 'w-6 h-6' }) => {
  const icons = {
    Electricidad: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    Gasfitería: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5.5 5 9c0 2.8 1.5 5.2 3.8 6.5V20h6.4v-4.5C17.5 14.2 19 11.8 19 9c0-3.5-3-7-7-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20h6" />
      </svg>
    ),
    Refrigeración: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    Computadores: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
      </svg>
    ),
    Cerrajería: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      </svg>
    ),
    Pintura: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 7h7a2 2 0 012 2v.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 13.5c0 1.5 1.5 2 1.5 3.5a1.5 1.5 0 01-3 0c0-1.5 1.5-2 1.5-3.5z" />
      </svg>
    ),
    Albañilería: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
        <rect x="13" y="13" width="8" height="8" rx="1" />
      </svg>
    ),
    Jardinería: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12C12 12 7 10 5 6c3 0 5.5 1 7 4 1.5-3 4-4 7-4-2 4-7 6-7 6z" />
      </svg>
    ),
    Electrodomésticos: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
        <circle cx="7.5" cy="7" r="1" fill="currentColor" />
        <circle cx="11" cy="7" r="1" fill="currentColor" />
      </svg>
    ),
    Climatización: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M5.6 7.8l12.8 8.4M5.6 16.2l12.8-8.4" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
    Carpintería: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 4 4-6 4 10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h18" />
      </svg>
    ),
    Soldadura: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 2.5l7 7-10 10H4v-7.5l10.5-9.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 9l1 1" />
      </svg>
    ),
  };
  return icons[name] || null;
};

const CATEGORIES = [
  'Electricidad', 'Gasfitería', 'Refrigeración', 'Computadores',
  'Cerrajería', 'Pintura', 'Albañilería', 'Jardinería',
  'Electrodomésticos', 'Climatización', 'Carpintería', 'Soldadura',
];

const CATEGORY_COLORS = [
  'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
  'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
  'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100',
  'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-100',
  'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
  'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100',
  'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100',
  'bg-green-50 text-green-600 border-green-100 hover:bg-green-100',
  'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
  'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100',
  'bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100',
  'bg-red-50 text-red-600 border-red-100 hover:bg-red-100',
];

const COMUNAS_PRINCIPALES = [
  'Alhué', 'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia',
  'Colina', 'Conchalí', 'Curacaví', 'El Bosque', 'El Monte',
  'Estación Central', 'Huechuraba', 'Independencia', 'Isla de Maipo',
  'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina',
  'Lampa', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado',
  'Macul', 'Maipú', 'María Pinto', 'Melipilla', 'Padre Hurtado',
  'Paine', 'Pedro Aguirre Cerda', 'Peñaflor', 'Peñalolén', 'Pirque',
  'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura', 'Quinta Normal',
  'Recoleta', 'Renca', 'San Bernardo', 'San José de Maipo', 'San Miguel',
  'San Pedro', 'San Ramón', 'Santiago Centro', 'Talagante', 'Tiltil',
  'Vitacura', 'Ñuñoa',
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [comuna, setComuna] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTechnicians({ plan: 'top' })
      .then(r => setFeatured(r.data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (comuna) params.set('comuna', comuna);
    navigate(`/tecnicos?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Maestros de confianza en Chile"
        description="Encuentra electricistas, gasfíteres, refrigeración y más cerca de ti. Directorio de maestros independientes en Chile. Contacto directo, sin intermediarios."
        url="/"
      />
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700 text-white">
        {/* Imagen decorativa de fondo */}
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-20 mix-blend-soft-light pointer-events-none"
          style={{ backgroundImage: "url('/fondo-og.jpg')" }}
          aria-hidden="true"
        />
        {/* Degradado para asegurar contraste del texto */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-brand-500/30 via-transparent to-brand-700/40 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto py-16 px-4 text-center">

          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase border border-white/10">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse flex-shrink-0" />
            Servicio de urgencia disponible 24/7
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight drop-shadow-sm">
            Maestros de confianza<br />cerca de ti
          </h1>
          <p className="text-orange-50 text-lg mb-10 max-w-lg mx-auto drop-shadow-sm">
            Electricistas, gasfíteres, refrigeración y más — contacto directo, sin intermediarios
          </p>

          <SearchBox className="max-w-2xl mx-auto w-full" />
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">¿Qué servicio necesitas?</h2>
            <p className="text-gray-400 text-sm mt-2">Elige una categoría y encuentra al especialista ideal</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {CATEGORIES.map((name, i) => (
              <button
                key={name}
                onClick={() => navigate(`/tecnicos?category=${name}`)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${CATEGORY_COLORS[i]}`}
              >
                <CategoryIcon name={name} className="w-6 h-6" />
                <span className="text-xs font-semibold text-center leading-tight">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">¿Cómo funciona?</h2>
            <p className="text-gray-400 text-sm mt-2">Simple y directo, sin complicaciones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connector lines on desktop */}
            <div className="hidden sm:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gray-200" />

            {[
              {
                n: '1',
                title: 'Busca tu maestro',
                desc: 'Filtra por servicio y comuna. Revisa fotos, reseñas y precios antes de contactar.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                n: '2',
                title: 'Contáctalo por WhatsApp',
                desc: 'Un clic y le escribes directo al maestro. Sin formularios, sin esperas.',
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                ),
              },
              {
                n: '3',
                title: 'Acuerdan y listo',
                desc: 'Coordinan los detalles y el maestro va a tu domicilio. Rápido y de confianza.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.n} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm relative">
                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-brand-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                  {step.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maestros TOP ── */}
      {(loading || featured.length > 0) && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-brand-500 uppercase tracking-widest">Destacados</span>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">Maestros TOP</h2>
              </div>
              <button
                onClick={() => navigate('/tecnicos')}
                className="text-brand-500 hover:text-brand-600 text-sm font-semibold flex items-center gap-1 mb-0.5"
              >
                Ver todos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {loading
                ? [1,2,3].map(i => (
                    <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                      <div className="h-44 bg-gray-100 animate-pulse" />
                      <div className="p-4 space-y-2.5">
                        <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-2/3" />
                        <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                        <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                      </div>
                    </div>
                  ))
                : featured.map(tech => <TechnicianCard key={tech.id} tech={tech} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* ── CTA maestros ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500/20 rounded-2xl mb-5">
            <svg className="w-7 h-7 text-brand-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">¿Eres maestro?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
            Publica tu perfil gratis y llega a cientos de clientes en tu comuna.
          </p>
          <button
            onClick={() => navigate('/registro')}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-base px-8 py-3 rounded-xl transition-colors"
          >
            Publicar mi perfil gratis
          </button>
          <p className="mt-4 text-gray-500 text-sm">
            ¿Quieres ver los planes?{' '}
            <button onClick={() => navigate('/precios')} className="text-gray-400 hover:text-gray-300 underline underline-offset-2 transition-colors">
              Ver precios
            </button>
          </p>
          <p className="text-gray-600 text-xs mt-5">
            Los primeros 30 días son completamente gratis · Sin tarjeta de crédito
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
