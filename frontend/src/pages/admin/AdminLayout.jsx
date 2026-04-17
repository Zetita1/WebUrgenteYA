import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminGetPendingReviewsCount } from '../../services/api';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    adminGetPendingReviewsCount()
      .then(r => setPendingReviews(r.data.count))
      .catch(() => {});
  }, [location.pathname]); // refresca al cambiar de sección

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLink = (to, label, exact = false) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
          active ? 'text-white border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 text-white px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 mr-4">
            <span className="font-black text-brand-500 text-lg">Urgente</span>
            <span className="font-black text-white text-lg">Ya</span>
            <span className="text-gray-400 text-xs self-end">.cl</span>
          </Link>
          <span className="text-gray-400 text-sm">|</span>
          <span className="text-gray-300 text-sm font-semibold">Panel Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/tecnicos" className="text-gray-400 hover:text-white text-sm">Ver sitio</Link>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm transition-colors">
            Salir →
          </button>
        </div>
      </header>

      {/* Nav admin */}
      <nav className="bg-gray-800 px-4 flex gap-1 overflow-x-auto">
        {navLink('/admin', 'Técnicos', true)}
        {navLink('/admin/nuevo', '+ Crear maestro')}
        <Link
          to="/admin/resenas"
          className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            location.pathname === '/admin/resenas'
              ? 'text-white border-b-2 border-brand-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Reseñas
          {pendingReviews > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingReviews}
            </span>
          )}
        </Link>
        {navLink('/admin/backups', 'Backups')}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
