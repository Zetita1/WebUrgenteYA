import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">

          {/* Marca */}
          <div>
            <div className="mb-3">
              <img src="/logo.png" alt="UrgenteYa.cl" className="h-10 w-auto brightness-0 invert" />
            </div>
            <p className="text-sm leading-relaxed">
              Directorio de maestros independientes en Chile. Rápido, simple y sin intermediarios.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Servicios</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/tecnicos?category=Electricidad" className="hover:text-white transition-colors">Electricistas</Link></li>
              <li><Link to="/tecnicos?category=Gasfitería" className="hover:text-white transition-colors">Gasfíteres</Link></li>
              <li><Link to="/tecnicos?category=Refrigeración" className="hover:text-white transition-colors">Refrigeración</Link></li>
              <li><Link to="/tecnicos?category=Computadores" className="hover:text-white transition-colors">Computadores</Link></li>
              <li><Link to="/tecnicos" className="hover:text-white transition-colors">Ver todos</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/terminos#privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/precios" className="hover:text-white transition-colors">Ver planes y precios</Link></li>
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
          <span>© {new Date().getFullYear()} UrgenteYa.cl — Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
}
