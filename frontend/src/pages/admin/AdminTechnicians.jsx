import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  adminGetTechnicians, adminApproveTechnician, adminRejectTechnician,
  adminExpireTechnician, adminDeleteTechnician, adminActivateTechnician,
  adminVerifyTechnician, adminGetStats, adminGetContactsMonthly
} from '../../services/api';

const STATUS_BADGE = {
  active: 'badge-active',
  pending: 'badge-pending',
  rejected: 'badge-rejected',
  expired: 'badge-expired',
};
const STATUS_LABEL = { active: 'Activo', pending: 'Pendiente', rejected: 'Rechazado', expired: 'Expirado' };
const PLAN_BADGE = { top: 'badge-top', premium: 'badge-premium', free: 'badge-free' };
const PLAN_LABEL = { top: 'TOP', premium: 'Premium', free: 'Free' };

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <p className="text-gray-800 font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-danger flex-1">Confirmar</button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const PLAN_PRESETS = [
  { label: 'Free (30 días)',                      plan: 'free',    days: 30, price: 'Gratis'  },
  { label: 'Fundador — $8.995 (3 meses)',         plan: 'premium', days: 90, price: '$8.995'  },
  { label: 'Premium — $17.990 (30 días)',         plan: 'premium', days: 30, price: '$17.990' },
  { label: 'TOP — $29.990 (30 días)',             plan: 'top',     days: 30, price: '$29.990' },
];

function ActivateModal({ techName, onConfirm, onCancel }) {
  const [preset, setPreset] = useState(2); // Premium por defecto
  const selected = PLAN_PRESETS[preset];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="font-bold text-gray-900 mb-4">Activar: {techName}</h3>
        <div className="space-y-2 mb-6">
          {PLAN_PRESETS.map((p, i) => (
            <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${preset === i ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="preset" checked={preset === i} onChange={() => setPreset(i)} className="text-brand-500" />
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-800">{p.label}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => onConfirm({ plan: selected.plan, days: selected.days })} className="btn-success flex-1">
            Activar {selected.days === 7 ? '(semanal)' : '(mensual)'}
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Exportar lista como CSV
function exportCSV(technicians) {
  const headers = ['ID', 'Nombre', 'Email', 'Categoría', 'Comuna', 'Plan', 'Estado', 'Teléfono', 'WhatsApp', 'Expira', 'Registrado'];
  const rows = technicians.map(t => [
    t.id,
    `"${(t.name || '').replace(/"/g, '""')}"`,
    t.email || '',
    t.category || '',
    t.comuna || '',
    t.plan || '',
    t.status || '',
    t.phone || '',
    t.whatsapp || '',
    t.expires_at ? new Date(t.expires_at).toLocaleDateString('es-CL') : '',
    t.created_at ? new Date(t.created_at).toLocaleDateString('es-CL') : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maestros_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function ContactChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm">Contactos WhatsApp por mes</h3>
        <span className="text-xs text-gray-400">{total} total (6 meses)</span>
      </div>
      <div className="flex items-end gap-2" style={{ height: '80px' }}>
        {data.map(d => {
          const [, month] = d.month.split('-');
          const heightPct = Math.max((d.count / max) * 100, 5);
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-xs text-gray-500 leading-none">{d.count}</span>
              <div
                className="w-full bg-brand-400 rounded-t-sm"
                style={{ height: `${heightPct}%` }}
                title={`${d.month}: ${d.count} contactos`}
              />
              <span className="text-xs text-gray-400 leading-none">{MONTH_NAMES[parseInt(month) - 1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState(null);
  const [contactsMonthly, setContactsMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [activateTarget, setActivateTarget] = useState(null);
  const [toast, setToast] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const fetchAll = useCallback(() => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterPlan) params.plan = filterPlan;
    if (search) params.search = search;

    setLoading(true);
    Promise.all([
      adminGetTechnicians(params),
      adminGetStats(),
      adminGetContactsMonthly(),
    ]).then(([techRes, statsRes, contactsRes]) => {
      setTechnicians(techRes.data);
      setStats(statsRes.data);
      setContactsMonthly(contactsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filterStatus, filterPlan, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function doAction(fn, successMsg) {
    try {
      await fn();
      showToast(successMsg);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error');
    }
  }

  function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function isExpiringSoon(expiresAt) {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-brand-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const pending = technicians.filter(t => t.status === 'pending');
  const others = [...technicians.filter(t => t.status !== 'pending')].sort((a, b) => {
    let va = a[sortField] ?? '';
    let vb = b[sortField] ?? '';
    if (sortDir === 'asc') return va > vb ? 1 : -1;
    return va < vb ? 1 : -1;
  });

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.fn(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Activate Modal */}
      {activateTarget && (
        <ActivateModal
          techName={activateTarget.name}
          onConfirm={(opts) => {
            doAction(() => adminActivateTechnician(activateTarget.id, opts), 'Maestro activado ✓');
            setActivateTarget(null);
          }}
          onCancel={() => setActivateTarget(null)}
        />
      )}

      {/* Stats — tarjetas clickeables que aplican filtro */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div
            className="card p-4 text-center cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
            onClick={() => { setFilterStatus(''); setFilterPlan(''); setSearch(''); }}
            title="Ver todos"
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Total maestros</div>
          </div>
          <div
            className="card p-4 text-center cursor-pointer hover:ring-2 hover:ring-yellow-300 transition-all"
            onClick={() => setFilterStatus('pending')}
            title="Filtrar pendientes"
          >
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-500 mt-1">Pendientes</div>
          </div>
          {stats.byStatus.find(s => s.status === 'active') && (
            <div
              className="card p-4 text-center cursor-pointer hover:ring-2 hover:ring-green-300 transition-all"
              onClick={() => setFilterStatus('active')}
              title="Filtrar activos"
            >
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.find(s => s.status === 'active').cnt}</div>
              <div className="text-xs text-gray-500 mt-1">Activos</div>
            </div>
          )}
          {stats.expiringSoon > 0 && (
            <div className="card p-4 text-center border-orange-200 bg-orange-50">
              <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
              <div className="text-xs text-orange-600 font-medium mt-1">Vencen en 7 días</div>
            </div>
          )}
          {stats.byStatus.find(s => s.status === 'expired') && (
            <div
              className="card p-4 text-center cursor-pointer hover:ring-2 hover:ring-red-200 transition-all"
              onClick={() => setFilterStatus('expired')}
              title="Filtrar expirados"
            >
              <div className="text-2xl font-bold text-red-600">{stats.byStatus.find(s => s.status === 'expired').cnt}</div>
              <div className="text-xs text-gray-500 mt-1">Expirados</div>
            </div>
          )}
        </div>
      )}

      {/* Gráfico de contactos mensuales */}
      <ContactChart data={contactsMonthly} />

      {/* Pendientes de aprobación */}
      {pending.length > 0 && !filterStatus && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-3">
            ⏳ {pending.length} técnico{pending.length !== 1 ? 's' : ''} esperando aprobación
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-xl border border-yellow-200 overflow-hidden">
              <thead className="bg-yellow-50 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-2">Nombre</th>
                  <th className="text-left px-4 py-2">Categoría / Comuna</th>
                  <th className="text-left px-4 py-2">Email</th>
                  <th className="text-left px-4 py-2">Teléfono</th>
                  <th className="text-left px-4 py-2">Registrado</th>
                  <th className="text-left px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(t => (
                  <tr key={t.id} className="border-t border-yellow-100 hover:bg-yellow-50/50">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.category}<br /><span className="text-gray-400">{t.comuna}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => doAction(() => adminApproveTechnician(t.id), 'Maestro aprobado ✓')}
                          className="btn-success text-xs py-1 px-3"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => setConfirm({
                            message: `¿Rechazar al maestro "${t.name}"?`,
                            fn: () => doAction(() => adminRejectTechnician(t.id), 'Maestro rechazado')
                          })}
                          className="btn-danger text-xs py-1 px-3"
                        >
                          Rechazar
                        </button>
                        <Link to={`/admin/editar/${t.id}`} className="btn-secondary text-xs py-1 px-3">
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros y tabla principal */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar nombre, comuna, categoría o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-xs"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="pending">Pendientes</option>
            <option value="rejected">Rechazados</option>
            <option value="expired">Expirados</option>
          </select>
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="input-field w-auto">
            <option value="">Todos los planes</option>
            <option value="top">TOP</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
          {(filterStatus || filterPlan || search) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterPlan(''); setSearch(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Limpiar filtros
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => exportCSV(technicians)}
              disabled={technicians.length === 0}
              className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-1.5 whitespace-nowrap"
              title="Exportar lista actual a Excel/CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
            <Link to="/admin/nuevo" className="btn-primary text-sm py-1.5 px-4 whitespace-nowrap">
              + Crear maestro
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase select-none">
                <tr>
                  <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('name')}>
                    Nombre <SortIcon field="name" />
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('category')}>
                    Categoría / Comuna <SortIcon field="category" />
                  </th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('plan')}>
                    Plan <SortIcon field="plan" />
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('status')}>
                    Estado <SortIcon field="status" />
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('expires_at')}>
                    Expira <SortIcon field="expires_at" />
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('contacts_this_month')} title="Clics en WhatsApp este mes">
                    Contactos <SortIcon field="contacts_this_month" />
                  </th>
                  <th className="text-left px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {others.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay técnicos con ese filtro</td></tr>
                )}
                {others.map(t => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-1 flex-wrap">
                        {t.name}
                        {t.is_verified === 1 && (
                          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Verificado">
                            <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.723 3.065 3.745 3.745 0 01-3.065.723A3.745 3.745 0 0112 21a3.745 3.745 0 01-3.068-1.593 3.745 3.745 0 01-3.065-.723 3.745 3.745 0 01-.723-3.065A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.723-3.065 3.745 3.745 0 013.065-.723A3.745 3.745 0 0112 3a3.745 3.745 0 013.068 1.593 3.745 3.745 0 013.065.723 3.745 3.745 0 01.723 3.065A3.745 3.745 0 0121 12z" />
                          </svg>
                        )}
                        {t.is_urgent_24h ? <span className="text-xs font-medium text-red-500">24h</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-gray-700">{t.category}</span>
                      <br /><span className="text-gray-400">{t.comuna}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{t.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={PLAN_BADGE[t.plan]}>{PLAN_LABEL[t.plan]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={isExpiringSoon(t.expires_at) ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                        {formatDate(t.expires_at)}
                        {isExpiringSoon(t.expires_at) && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.contacts_this_month > 0 ? (
                        <span className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-brand-600">{t.contacts_this_month}</span>
                          <span className="text-xs text-gray-400" title={`Total histórico: ${t.contacts_total ?? 0}`}>/{t.contacts_total ?? 0}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {t.status === 'active' && (
                          <a
                            href={`/tecnicos/${t.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs py-1 px-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
                            title="Ver perfil público"
                          >
                            Ver
                          </a>
                        )}
                        {t.status === 'pending' && (
                          <button onClick={() => doAction(() => adminApproveTechnician(t.id), 'Maestro aprobado ✓')} className="btn-success text-xs py-1 px-2">
                            Aprobar
                          </button>
                        )}
                        {(t.status === 'expired' || t.status === 'rejected') && (
                          <button onClick={() => setActivateTarget(t)} className="btn-success text-xs py-1 px-2">
                            Activar
                          </button>
                        )}
                        {t.status === 'active' && (
                          <button onClick={() => setConfirm({
                            message: `¿Expirar al maestro "${t.name}"?`,
                            fn: () => doAction(() => adminExpireTechnician(t.id), 'Maestro expirado')
                          })} className="text-xs py-1 px-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-semibold transition-colors">
                            Expirar
                          </button>
                        )}
                        <button
                          onClick={() => doAction(() => adminVerifyTechnician(t.id), t.is_verified === 1 ? 'Verificado desactivado' : 'Maestro verificado ✓')}
                          className={`text-xs py-1 px-2 rounded-lg font-semibold transition-colors ${t.is_verified === 1 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                          title={t.is_verified === 1 ? 'Quitar verificación' : 'Marcar como verificado'}
                        >
                          {t.is_verified === 1 ? '✓ Verif.' : 'Verificar'}
                        </button>
                        <Link to={`/admin/editar/${t.id}`} className="btn-secondary text-xs py-1 px-2">
                          Editar
                        </Link>
                        <button onClick={() => setConfirm({
                          message: `¿Eliminar permanentemente al maestro "${t.name}"?`,
                          fn: () => doAction(() => adminDeleteTechnician(t.id), 'Maestro eliminado')
                        })} className="btn-danger text-xs py-1 px-2">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {others.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                {others.length} resultado{others.length !== 1 ? 's' : ''}
                {(filterStatus || filterPlan || search) && ' (filtrado)'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
