import React from 'react';
import { Link } from 'react-router-dom';

function toWaNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('56') && digits.length >= 11) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `56${digits}`;
  if (digits.startsWith('09') && digits.length === 10) return `56${digits.slice(1)}`;
  return `56${digits}`;
}

function StarRating({ rating, count }) {
  const filled = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className={`w-3.5 h-3.5 ${i <= filled ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-gray-400 text-xs">{Number(rating).toFixed(1)} ({count})</span>}
    </div>
  );
}

export default function TechnicianCard({ tech }) {
  const waText = encodeURIComponent(`Hola ${tech.name}, te encontré en UrgenteYa.cl. ¿Tienes disponibilidad?`);
  const waLink = `https://wa.me/${toWaNumber(tech.whatsapp || tech.phone)}?text=${waText}`;

  const isTop = tech.plan === 'top';
  const isPremium = tech.plan === 'premium';

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border ${isTop ? 'border-yellow-300 shadow-md' : isPremium ? 'border-blue-200 shadow-sm' : 'border-gray-100 shadow-sm'}`}>

      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
        {tech.image_url ? (
          <img
            src={tech.image_url}
            alt={tech.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 bg-gradient-to-br from-gray-50 to-gray-100">
            <svg className="w-14 h-14 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Plan badge top-left */}
        <div className="absolute top-2.5 left-2.5 flex gap-1 flex-wrap">
          {isTop && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
              ★ TOP
            </span>
          )}
          {isPremium && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
              Premium
            </span>
          )}
        </div>

        {/* Urgente 24h badge top-right */}
        {tech.is_urgent_24h && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              24h
            </span>
          </div>
        )}

        {/* Category bottom overlay */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <span className="text-white text-xs font-semibold drop-shadow-sm">{tech.category}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{tech.name}</h3>
          {tech.is_verified === 1 && (
            <span title="Maestro verificado por UrgenteYa">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.065 3.745 3.745 0 01-3.065.723A3.745 3.745 0 0112 21a3.745 3.745 0 01-3.068-1.593 3.745 3.745 0 01-3.065-.723 3.745 3.745 0 01-.723-3.065A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.065 3.745 3.745 0 013.065-.723A3.745 3.745 0 0112 3a3.745 3.745 0 013.068 1.593 3.745 3.745 0 013.065.723 3.745 3.745 0 01.723 3.065A3.745 3.745 0 0121 12z" />
              </svg>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{tech.comuna}</span>
          {tech.covers_rm === 1 && (
            <span className="ml-1 text-green-600 font-semibold">· Disponible en toda la RM</span>
          )}
        </div>

        {(tech.avg_rating > 0 || tech.review_count > 0) && (
          <StarRating rating={tech.avg_rating} count={tech.review_count} />
        )}

        {tech.price_from && (
          <div className="text-xs text-gray-500">
            Desde <span className="font-semibold text-gray-700">{tech.price_from}</span>
          </div>
        )}

        {tech.description && (
          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{tech.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
          </svg>
          WhatsApp
        </a>
        <Link
          to={`/tecnicos/${tech.id}`}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors text-center"
        >
          Ver perfil
        </Link>
      </div>
    </div>
  );
}
