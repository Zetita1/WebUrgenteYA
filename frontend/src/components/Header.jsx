import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isTechnician = user?.role === 'technician';
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-28 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="UrgenteYa.cl"
            style={{ height: '160px', width: 'auto', marginTop: '-20px', marginBottom: '-20px' }}
            className="mix-blend-multiply object-contain"
          />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/tecnicos" className="text-gray-600 hover:text-brand-500 transition-colors">
            Encontrar Maestro
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-gray-600 hover:text-brand-500 transition-colors">
              Panel Admin
            </Link>
          )}
          {isTechnician && (
            <Link to="/mi-perfil" className="text-gray-600 hover:text-brand-500 transition-colors">
              Mi perfil
            </Link>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                Ingresar
              </Link>
              <Link to="/registro" className="btn-primary text-sm py-2 px-5">
                ¿Eres maestro?
              </Link>
            </>
          ) : (
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors">
              Salir
            </button>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link to="/tecnicos" className="text-gray-700" onClick={() => setMenuOpen(false)}>Encontrar Maestro</Link>
          {isAdmin && <Link to="/admin" className="text-gray-700" onClick={() => setMenuOpen(false)}>Panel Admin</Link>}
          {isTechnician && <Link to="/mi-perfil" className="text-gray-700" onClick={() => setMenuOpen(false)}>Mi perfil</Link>}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-gray-500" onClick={() => setMenuOpen(false)}>Ingresar</Link>
              <Link to="/registro" className="btn-primary text-center py-2" onClick={() => setMenuOpen(false)}>¿Eres maestro?</Link>
            </>
          ) : (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-left text-red-500">Salir</button>
          )}
        </div>
      )}
    </header>
  );
}
