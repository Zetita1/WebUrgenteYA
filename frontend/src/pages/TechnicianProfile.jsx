import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { getTechnician, createReview, recordContact } from '../services/api';

// Normaliza cualquier formato de número chileno a 56XXXXXXXXX
function toWaNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('56') && digits.length >= 11) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `56${digits}`;
  if (digits.startsWith('09') && digits.length === 10) return `56${digits.slice(1)}`;
  if (digits.startsWith('569')) return digits;
  return `56${digits}`;
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`text-2xl ${i <= value ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ShareButtons({ tech }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = window.location.href;
  const shareText = encodeURIComponent(`Te recomiendo a ${tech.name} (${tech.category}) en UrgenteYa.cl: ${profileUrl}`);
  const waShareLink = `https://wa.me/?text=${shareText}`;

  function handleCopy() {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-1">
      <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Compartir perfil</p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-gray-600"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">¡Copiado!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar link
            </>
          )}
        </button>
        <a
          href={waShareLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors font-medium text-green-700"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null); // índice de imagen abierta o null
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', reviewer_name: '', _hp: '' });
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getTechnician(id)
      .then(r => setTech(r.data))
      .catch(() => setError('Técnico no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReview(e) {
    e.preventDefault();
    setReviewError('');

    if (reviewForm.reviewer_name && reviewForm.reviewer_name.trim().length < 3) {
      return setReviewError('El nombre debe tener al menos 3 caracteres.');
    }
    if (reviewForm.comment && reviewForm.comment.trim().length < 10) {
      return setReviewError('El comentario debe tener al menos 10 caracteres.');
    }

    setSending(true);
    try {
      await createReview(id, reviewForm);
      setReviewSent(true);
      setReviewForm({ rating: 5, comment: '', reviewer_name: '', _hp: '' });
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Error al enviar reseña');
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <svg className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p>Cargando...</p>
        </div>
      </div>
    </div>
  );

  if (error || !tech) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-4">{error || 'Técnico no encontrado'}</p>
          <Link to="/tecnicos" className="btn-primary">Ver técnicos</Link>
        </div>
      </div>
    </div>
  );

  const seoDesc = [
    `${tech.name} es ${tech.category} en ${tech.comuna}.`,
    tech.description ? tech.description.substring(0, 120) : '',
    `Contacto directo en UrgenteYa.cl. Sin intermediarios.`
  ].filter(Boolean).join(' ');
  const seoImage = tech.image_url ? `https://urgenteya.cl${tech.image_url}` : undefined;

  // JSON-LD: Google muestra estrellas y datos del negocio en resultados de búsqueda
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tech.name,
    description: tech.description || `${tech.category} en ${tech.comuna}`,
    telephone: tech.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: tech.comuna,
      addressRegion: 'Región Metropolitana',
      addressCountry: 'CL',
    },
    areaServed: tech.comuna,
    ...(seoImage && { image: seoImage }),
    url: `https://urgenteya.cl/tecnicos/${tech.id}`,
    ...(tech.avg_rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(tech.avg_rating),
        reviewCount: String(tech.review_count),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    ...(tech.reviews?.length > 0 && {
      review: tech.reviews.slice(0, 3).map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.reviewer_name || 'Cliente' },
        reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
        ...(r.comment && { reviewBody: r.comment }),
      })),
    }),
  };

  const waText = encodeURIComponent(`Hola ${tech.name}, te encontré en UrgenteYa.cl, necesito un servicio urgente`);
  const waLink = `https://wa.me/${toWaNumber(tech.whatsapp || tech.phone)}?text=${waText}`;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${tech.name} — ${tech.category} en ${tech.comuna}`}
        description={seoDesc}
        image={seoImage}
        url={`/tecnicos/${tech.id}`}
        jsonLd={jsonLd}
      />
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-6 flex items-center gap-1">
          ← Volver
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar — arriba en móvil, derecha en desktop */}
          <div className="md:col-span-1 md:order-2">
            <div className="card p-5 md:sticky md:top-16">
              <h2 className="font-bold text-gray-900 mb-4">Contactar</h2>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordContact(id).catch(() => {})}
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors mb-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                Contactar por WhatsApp
              </a>

              <a
                href={`tel:${tech.phone}`}
                className="flex items-center justify-center gap-2 w-full btn-secondary py-3 rounded-xl mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Llamar: {tech.phone}
              </a>

              <ShareButtons tech={tech} />

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Categoría</span>
                  <span className="font-medium">{tech.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comuna</span>
                  <span className="font-medium">{tech.comuna}</span>
                </div>
                {tech.years_experience ? (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experiencia</span>
                    <span className="font-medium">{tech.years_experience} años</span>
                  </div>
                ) : null}
                {tech.price_from ? (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Precio desde</span>
                    <span className="font-medium text-brand-600">{tech.price_from}</span>
                  </div>
                ) : null}
                {tech.availability ? (
                  <div className="pt-1">
                    <span className="text-gray-400 block mb-0.5">Disponibilidad</span>
                    <span className="font-medium">{tech.availability}</span>
                  </div>
                ) : null}
                {tech.is_urgent_24h ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center text-red-700 text-xs font-semibold">
                    Disponible urgencias 24 horas
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Columna principal */}
          <div className="md:col-span-2 md:order-1 space-y-6">
            {/* Card perfil */}
            <div className="card overflow-hidden">
              {tech.image_url && (
                <img src={tech.image_url} alt={tech.name} className="w-full h-56 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-gray-900">{tech.name}</h1>
                      {tech.is_verified === 1 && (
                        <span title="Maestro verificado por UrgenteYa" className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.065 3.745 3.745 0 01-3.065.723A3.745 3.745 0 0112 21a3.745 3.745 0 01-3.068-1.593 3.745 3.745 0 01-3.065-.723 3.745 3.745 0 01-.723-3.065A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.065 3.745 3.745 0 013.065-.723A3.745 3.745 0 0112 3a3.745 3.745 0 013.068 1.593 3.745 3.745 0 013.065.723 3.745 3.745 0 01.723 3.065A3.745 3.745 0 0121 12z" />
                          </svg>
                          Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-brand-500 font-semibold text-lg">{tech.category}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{tech.comuna}</span>
                    </div>
                    {tech.covers_rm === 1 && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mt-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Atiende toda la Región Metropolitana
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {tech.plan === 'top' && <span className="badge-top">TOP</span>}
                    {tech.plan === 'premium' && <span className="badge-premium">Premium</span>}
                    {tech.is_urgent_24h ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Urgente 24h</span> : null}
                  </div>
                </div>

                {tech.avg_rating > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} className={`w-5 h-5 ${i <= Math.round(tech.avg_rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm font-medium">{tech.avg_rating} ({tech.review_count} reseña{tech.review_count !== 1 ? 's' : ''})</span>
                  </div>
                )}

                {tech.description && (
                  <p className="text-gray-600 mt-4 leading-relaxed">{tech.description}</p>
                )}
              </div>
            </div>

            {/* Servicios y detalles */}
            {(tech.services_list || tech.years_experience || tech.price_from || tech.availability) && (
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-gray-900">Información del servicio</h2>
                {tech.services_list && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Trabajos que realiza</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{tech.services_list}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {tech.years_experience ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand-500">{tech.years_experience}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Años de experiencia</p>
                    </div>
                  ) : null}
                  {tech.price_from ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-gray-800">{tech.price_from}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Precio desde (referencial)</p>
                    </div>
                  ) : null}
                  {tech.availability ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm font-semibold text-gray-800">{tech.availability}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Disponibilidad</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Galería */}
            {tech.images?.length > 0 && (
              <div className="card p-4">
                <h2 className="font-bold text-gray-900 mb-3">Galería de trabajos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tech.images.map((img, idx) => (
                    <button
                      key={img.filename}
                      onClick={() => setLightbox(idx)}
                      className="relative group overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <img
                        src={`/uploads/technicians/${img.filename}`}
                        alt={`Trabajo ${idx + 1}`}
                        className="w-full h-32 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lightbox */}
            {lightbox !== null && tech.images?.length > 0 && (() => {
              const imgs = tech.images;
              const prev = () => setLightbox(i => (i - 1 + imgs.length) % imgs.length);
              const next = () => setLightbox(i => (i + 1) % imgs.length);
              return (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                  onClick={() => setLightbox(null)}
                  onKeyDown={e => { if (e.key === 'Escape') setLightbox(null); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); }}
                  tabIndex={0}
                  ref={el => el?.focus()}
                >
                  {/* Botón cerrar */}
                  <button
                    className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
                    onClick={() => setLightbox(null)}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Contador */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
                    {lightbox + 1} / {imgs.length}
                  </div>

                  {/* Flecha izquierda */}
                  {imgs.length > 1 && (
                    <button
                      className="absolute left-3 sm:left-6 text-white bg-black/40 hover:bg-black/70 rounded-full p-3 transition-colors z-10"
                      onClick={e => { e.stopPropagation(); prev(); }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Imagen */}
                  <img
                    src={`/uploads/technicians/${imgs[lightbox].filename}`}
                    alt={`Trabajo ${lightbox + 1}`}
                    className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  />

                  {/* Flecha derecha */}
                  {imgs.length > 1 && (
                    <button
                      className="absolute right-3 sm:right-6 text-white bg-black/40 hover:bg-black/70 rounded-full p-3 transition-colors z-10"
                      onClick={e => { e.stopPropagation(); next(); }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Reseñas */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">Reseñas ({tech.review_count || 0})</h2>

              {tech.reviews?.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {tech.reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`text-sm ${i <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{r.reviewer_name || 'Anónimo'}</span>
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                      {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">Aún no hay reseñas. ¡Sé el primero!</p>
              )}

              {/* Formulario reseña */}
              {reviewSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
                  <p className="font-semibold">¡Gracias por tu reseña!</p>
                  <p className="text-green-600 text-xs mt-1">Será publicada una vez que sea revisada por nuestro equipo.</p>
                </div>
              ) : (
                <form onSubmit={handleReview} className="space-y-3 border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-700 text-sm">Dejar reseña</h3>
                  <StarPicker value={reviewForm.rating} onChange={v => setReviewForm(f => ({...f, rating: v}))} />
                  <div>
                    <input
                      type="text"
                      placeholder="Tu nombre (opcional, mín. 3 caracteres)"
                      value={reviewForm.reviewer_name}
                      onChange={e => setReviewForm(f => ({...f, reviewer_name: e.target.value}))}
                      className="input-field"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Cuéntanos tu experiencia... (mín. 10 caracteres)"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))}
                      className="input-field resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    {reviewForm.comment.length > 0 && reviewForm.comment.length < 10 && (
                      <p className="text-xs text-orange-500 mt-1">
                        {10 - reviewForm.comment.length} caracteres más para continuar
                      </p>
                    )}
                  </div>
                  {/* Honeypot — campo trampa invisible para bots */}
                  <input
                    type="text"
                    name="website"
                    value={reviewForm._hp}
                    onChange={e => setReviewForm(f => ({...f, _hp: e.target.value}))}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
                  <button type="submit" disabled={sending} className="btn-primary w-full">
                    {sending ? 'Enviando...' : 'Enviar reseña'}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
