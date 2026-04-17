import React, { useState, useEffect, useCallback } from 'react';
import { adminGetPendingReviews, adminGetAllReviews, adminApproveReview, adminDeleteReview } from '../../services/api';

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-base ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
    </span>
  );
}

const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

function exportCSV(reviews) {
  const headers = ['ID', 'Técnico', 'Categoría', 'Comuna', 'Estrellas', 'Nombre', 'Comentario', 'Estado', 'Fecha'];
  const rows = reviews.map(r => [
    r.id,
    `"${(r.tech_name || '').replace(/"/g, '""')}"`,
    r.category || '',
    r.comuna || '',
    r.rating,
    `"${(r.reviewer_name || 'Anónimo').replace(/"/g, '""')}"`,
    `"${(r.comment || '').replace(/"/g, '""')}"`,
    r.status || '',
    r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resenas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // 'pending' | 'all'
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const fn = tab === 'pending' ? adminGetPendingReviews : adminGetAllReviews;
    fn()
      .then(r => setReviews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleApprove(id) {
    try {
      await adminApproveReview(id);
      showToast('Reseña aprobada ✓');
      fetchReviews();
    } catch {
      showToast('Error al aprobar');
    }
  }

  async function handleDelete(id) {
    try {
      await adminDeleteReview(id);
      showToast('Reseña eliminada');
      fetchReviews();
    } catch {
      showToast('Error al eliminar');
    }
  }

  const pending = reviews.filter(r => r.status === 'pending');

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reseñas</h1>
          <p className="text-sm text-gray-500 mt-1">Modera las reseñas antes de publicarlas</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && tab === 'pending' && (
            <div className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-4 py-2 rounded-xl">
              {reviews.length} pendiente{reviews.length !== 1 ? 's' : ''}
            </div>
          )}
          {!loading && reviews.length > 0 && (
            <button
              onClick={() => exportCSV(reviews)}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pendientes {pending.length > 0 && tab !== 'pending' ? `(${pending.length})` : ''}
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Todas
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400">Cargando...</div>
      ) : reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {tab === 'pending' ? 'No hay reseñas pendientes' : 'No hay reseñas aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-1 flex-wrap">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Para: <span className="font-semibold text-gray-600">{r.tech_name}</span>
                    <span className="text-gray-300 mx-1">·</span>
                    {r.category} — {r.comuna}
                    {tab === 'all' && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Stars rating={r.rating} />
                    <span className="text-sm font-semibold text-gray-700">{r.reviewer_name || 'Anónimo'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {r.comment ? (
                    <p className="text-gray-700 text-sm bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs italic">Sin comentario</p>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="btn-success text-sm py-2 px-4 flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprobar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="btn-danger text-sm py-2 px-4 flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
