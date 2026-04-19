import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import TechnicianCard from '../components/TechnicianCard';
import { getTechnicians } from '../services/api';

const CATEGORIES = [
  'Electricidad', 'Gasfitería', 'Refrigeración', 'Computadores',
  'Cerrajería', 'Pintura', 'Albañilería', 'Jardinería',
  'Electrodomésticos', 'Climatización', 'Carpintería', 'Soldadura'
];

const COMUNAS = [
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

// Convierte slug a nombre legible: "santiago-centro" → "Santiago Centro"
function slugToName(slug) {
  if (!slug) return '';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Descripción introductoria para landing pages SEO
const CATEGORY_DESC = {
  Electricidad:      'trabajos de instalación eléctrica, cambio de enchufes, tableros, cortes de luz y emergencias eléctricas',
  Gasfitería:        'instalación y reparación de cañerías, filtraciones, grifos, calefones y urgencias de agua',
  Refrigeración:     'reparación e instalación de refrigeradores, freezers, vitrinas y equipos de frío',
  Computadores:      'reparación de PC y notebook, instalación de programas, recuperación de datos y redes',
  Cerrajería:        'apertura de puertas, cambio de chapa, copia de llaves y seguridad del hogar',
  Pintura:           'pintura de habitaciones, exteriores, cielos y terminaciones de alta calidad',
  Albañilería:       'reparación de muros, estucos, cerámica, baldosas y obras menores',
  Jardinería:        'corte de pasto, poda de árboles, mantención de jardines y paisajismo',
  Electrodomésticos: 'reparación de lavadoras, secadoras, lavavajillas, microondas y cocinas',
  Climatización:     'instalación y mantención de aire acondicionado, calefacción y ventilación',
  Carpintería:       'muebles a medida, reparación de puertas y ventanas, closets y terminaciones en madera',
  Soldadura:         'trabajos de soldadura, rejas, portones, estructuras metálicas y reparaciones en metal',
};

export default function TechniciansList() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Soporte para rutas tipo /tecnicos/electricidad/santiago-centro (SEO)
  const { categoria: slugCat, comuna: slugComuna } = useParams();

  const initialCategory = slugCat ? slugToName(slugCat) : (searchParams.get('category') || '');
  const initialComuna   = slugComuna ? slugToName(slugComuna) : (searchParams.get('comuna') || '');

  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]     = useState(searchParams.get('search') || '');
  const [comuna, setComuna]     = useState(initialComuna);
  const [category, setCategory] = useState(initialCategory);
  const [urgent, setUrgent]     = useState(false);
  const [sort, setSort]         = useState(searchParams.get('sort') || '');

  const fetchTechnicians = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)   params.search   = search;
    if (comuna)   params.comuna   = comuna;
    if (category) params.category = category;
    if (sort)     params.sort     = sort;

    getTechnicians(params)
      .then(r => {
        let results = Array.isArray(r.data) ? r.data : [];
        if (urgent) results = results.filter(t => t.is_urgent_24h);
        setTechnicians(results);
      })
      .catch(() => setTechnicians([]))
      .finally(() => setLoading(false));
  }, [search, comuna, category, urgent, sort]);

  useEffect(() => { fetchTechnicians(); }, [fetchTechnicians]);

  function handleFilter(e) {
    e.preventDefault();
    const params = {};
    if (search)   params.search   = search;
    if (comuna)   params.comuna   = comuna;
    if (category) params.category = category;
    setSearchParams(params);
    fetchTechnicians();
  }

  function clearFilters() {
    setSearch(''); setComuna(''); setCategory(''); setUrgent(false); setSort('');
    setSearchParams({});
  }

  // SEO dinámico
  const seoTitle = category && comuna
    ? `${category} en ${comuna} — Contacto directo`
    : category
    ? `${category} en Chile — Maestros disponibles`
    : comuna
    ? `Maestros en ${comuna} — UrgenteYa.cl`
    : 'Directorio de maestros en Chile';

  const seoDesc = category && comuna
    ? `Encuentra maestros de ${category} en ${comuna}. Contacto directo por WhatsApp, sin intermediarios. UrgenteYa.cl`
    : category
    ? `Los mejores maestros de ${category} en la Región Metropolitana. Reseñas, fotos y contacto directo. UrgenteYa.cl`
    : `Busca electricistas, gasfíteres, refrigeración y más cerca de ti. Directorio completo de maestros con contacto directo.`;

  const activeFilters = [category, comuna, search, urgent].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={seoTitle}
        description={seoDesc}
        url={slugCat ? `/maestros/${slugCat}${slugComuna ? `/${slugComuna}` : ''}` : '/tecnicos'}
        jsonLd={(category || comuna) ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://urgenteya.cl' },
            { '@type': 'ListItem', position: 2, name: 'Maestros', item: 'https://urgenteya.cl/tecnicos' },
            ...(category ? [{ '@type': 'ListItem', position: 3, name: category, item: `https://urgenteya.cl/maestros/${(slugCat || category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''))}` }] : []),
            ...(category && comuna ? [{ '@type': 'ListItem', position: 4, name: comuna, item: `https://urgenteya.cl/maestros/${slugCat}/${slugComuna}` }] : []),
          ],
        } : null}
      />
      <Header />

      {/* Header de página */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-orange-200 text-sm mb-2">
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <span>Maestros</span>
            {category && <><span>/</span><span>{category}</span></>}
            {comuna   && <><span>/</span><span>{comuna}</span></>}
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            {category && comuna ? `${category} en ${comuna}`
              : category ? `Maestros de ${category}`
              : comuna   ? `Maestros en ${comuna}`
              : 'Todos los maestros'}
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            Contacto directo por WhatsApp · Sin intermediarios
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">

        {/* Filtros */}
        <div className="card p-4 mb-6">
          <form onSubmit={handleFilter}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Ej: pintura interior, electricista..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                <option value="">Todas las categorías</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={comuna} onChange={e => setComuna(e.target.value)} className="input-field">
                <option value="">Todas las comunas</option>
                {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Filtrar</button>
                {activeFilters > 0 && (
                  <button type="button" onClick={clearFilters} className="btn-secondary px-3 text-sm">
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={e => setUrgent(e.target.checked)}
                  className="rounded text-brand-500 w-4 h-4"
                />
                <span className="text-sm text-gray-600">Solo urgente 24h</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 ml-0.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  24h
                </span>
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-400 whitespace-nowrap">Ordenar por</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                >
                  <option value="">Relevancia</option>
                  <option value="contactados">Más contactados</option>
                  <option value="rating">Mejor calificados</option>
                  <option value="recientes">Más recientes</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Filtros activos */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200">
                {category}
                <button onClick={() => setCategory('')} className="hover:text-brand-900">✕</button>
              </span>
            )}
            {comuna && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200">
                {comuna}
                <button onClick={() => setComuna('')} className="hover:text-brand-900">✕</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200">
                "{search}"
                <button onClick={() => setSearch('')} className="hover:text-brand-900">✕</button>
              </span>
            )}
          </div>
        )}

        {/* Contador */}
        <p className="text-gray-400 text-sm mb-5">
          {loading
            ? 'Buscando...'
            : `${technicians.length} maestro${technicians.length !== 1 ? 's' : ''} encontrado${technicians.length !== 1 ? 's' : ''}`}
        </p>

        {/* Resultados */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="h-44 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-700 mb-1">No encontramos maestros</p>
            <p className="text-gray-400 text-sm mb-5">Prueba con otros filtros o busca en otra comuna</p>
            <button onClick={clearFilters} className="btn-primary px-6">Ver todos los maestros</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {technicians.map(tech => (
              <TechnicianCard key={tech.id} tech={tech} />
            ))}
          </div>
        )}

        {/* Texto SEO para landing pages categoría+comuna */}
        {(category || comuna) && !loading && technicians.length > 0 && (
          <div className="mt-10 bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-2 text-base">
              {category && comuna
                ? `${category} en ${comuna} — Contacto directo`
                : category
                ? `Maestros de ${category} en Chile`
                : `Maestros en ${comuna}`}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {category && comuna
                ? `Encuentra maestros de ${category.toLowerCase()} en ${comuna} disponibles para ${CATEGORY_DESC[category] || 'trabajos del hogar'}. Todos los perfiles incluyen fotos, reseñas de clientes y contacto directo por WhatsApp. Sin intermediarios, sin comisiones.`
                : category
                ? `Directorio de maestros especializados en ${category.toLowerCase()} en la Región Metropolitana de Chile. Trabajan en ${CATEGORY_DESC[category] || 'servicios del hogar'}. Compara perfiles, lee reseñas y contacta directamente.`
                : `Directorio de maestros y técnicos en ${comuna}. Electricistas, gasfíteres, refrigeración y más servicios del hogar con contacto directo por WhatsApp.`}
            </p>
          </div>
        )}

        {/* Links SEO: categorías relacionadas */}
        {!category && !comuna && !search && technicians.length > 0 && (
          <div className="mt-12 border-t border-gray-100 pt-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Buscar por categoría</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 mt-6">Buscar por comuna</h2>
            <div className="flex flex-wrap gap-2">
              {COMUNAS.slice(0, 20).map(c => (
                <button
                  key={c}
                  onClick={() => setComuna(c)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
