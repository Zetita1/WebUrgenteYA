import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTechnicians } from '../services/api';

const CATEGORIES = [
  'Electricidad', 'Gasfitería', 'Refrigeración', 'Computadores',
  'Cerrajería', 'Pintura', 'Albañilería', 'Jardinería',
  'Electrodomésticos', 'Climatización', 'Carpintería', 'Soldadura',
];

const COMUNAS = [
  'Santiago Centro', 'Providencia', 'Las Condes', 'Maipú', 'La Florida',
  'Ñuñoa', 'San Miguel', 'Pudahuel', 'Quilicura', 'Recoleta',
  'Puente Alto', 'La Pintana', 'Peñalolén', 'Conchalí', 'Vitacura',
  'Lo Barnechea', 'Macul', 'Renca', 'San Bernardo', 'Colina',
];

// Sugerencias rápidas de categoría basadas en lo que escribe
function getCategorySuggestions(text) {
  if (!text || text.length < 2) return [];
  const lower = text.toLowerCase();
  return CATEGORIES.filter(c => c.toLowerCase().includes(lower)).slice(0, 3);
}

export default function SearchBox({ className = '' }) {
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [comuna, setComuna]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults]     = useState([]);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const debounceRef = useRef(null);
  const boxRef      = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Búsqueda en vivo con debounce 350ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search || search.length < 2) {
      setSuggestions(getCategorySuggestions(search));
      setResults([]);
      setOpen(search.length > 0);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { search };
        if (comuna) params.comuna = comuna;
        const res = await getTechnicians(params);
        setResults(res.data.slice(0, 5));
        setSuggestions(getCategorySuggestions(search));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [search, comuna]);

  function handleSubmit(e) {
    e.preventDefault();
    setOpen(false);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (comuna) params.set('comuna', comuna);
    const qs = params.toString();
    navigate(qs ? `/tecnicos?${qs}` : '/tecnicos');
  }

  function goToTech(id) {
    setOpen(false);
    navigate(`/tecnicos/${id}`);
  }

  function goToCategory(cat) {
    setOpen(false);
    setSearch(cat);
    navigate(`/tecnicos?category=${cat}`);
  }

  function goToSearch() {
    setOpen(false);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (comuna) params.set('comuna', comuna);
    navigate(`/tecnicos?${params.toString()}`);
  }

  const showDropdown = open && (suggestions.length > 0 || results.length > 0 || loading);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl overflow-visible flex flex-col sm:flex-row"
      >
        {/* Input búsqueda */}
        <div className="flex items-center gap-2.5 flex-1 px-4 py-1">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="¿Qué servicio necesitas?"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => search.length > 0 && setOpen(true)}
            className="flex-1 py-3 text-gray-800 text-sm outline-none placeholder-gray-400 bg-transparent"
            autoComplete="off"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setOpen(false); }}
              className="text-gray-300 hover:text-gray-500 text-lg leading-none">✕</button>
          )}
        </div>

        <div className="hidden sm:block w-px bg-gray-100 my-2" />

        {/* Selector comuna */}
        <select
          value={comuna}
          onChange={e => setComuna(e.target.value)}
          className="px-4 text-gray-600 text-sm outline-none bg-transparent border-t sm:border-t-0 border-gray-100 py-2 sm:py-0"
        >
          <option value="">Todas las comunas</option>
          {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          type="submit"
          className="m-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          Buscar
        </button>
      </form>

      {/* Dropdown sugerencias */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">

          {loading && (
            <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Buscando...
            </div>
          )}

          {/* Sugerencias de categoría */}
          {suggestions.length > 0 && (
            <div className="border-b border-gray-50">
              {suggestions.map(cat => (
                <button
                  key={cat}
                  onClick={() => goToCategory(cat)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">Maestros de <strong>{cat}</strong></span>
                </button>
              ))}
            </div>
          )}

          {/* Resultados en vivo */}
          {results.length > 0 && (
            <div>
              <p className="px-4 pt-2 pb-1 text-xs text-gray-400 font-semibold uppercase tracking-wide">Maestros</p>
              {results.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => goToTech(tech.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  {tech.image_url ? (
                    <img src={tech.image_url} alt={tech.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-600 font-bold text-sm">{tech.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{tech.name}</p>
                    <p className="text-xs text-gray-400 truncate">{tech.category} · {tech.comuna}</p>
                  </div>
                  {tech.is_urgent_24h === 1 && (
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">24h</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Ver todos los resultados */}
          {search.length >= 2 && !loading && (
            <button
              onClick={goToSearch}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100"
            >
              <span className="text-sm text-brand-600 font-semibold">
                Ver todos los resultados para "{search}"
              </span>
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
