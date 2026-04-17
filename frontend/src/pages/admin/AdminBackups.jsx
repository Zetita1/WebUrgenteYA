import React, { useEffect, useState } from 'react';
import { adminListBackups, adminRunBackup, adminDownloadBackup } from '../../services/api';

function fmtSize(kb) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CL', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await adminListBackups();
      setBackups(r.data);
    } catch (e) {
      setErr('No se pudieron cargar los backups');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRun() {
    setRunning(true); setErr(null); setMsg(null);
    try {
      const r = await adminRunBackup();
      setMsg(`Backup creado: ${r.data.file}`);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al generar backup');
    } finally {
      setRunning(false);
    }
  }

  async function handleDownload(name) {
    try {
      const r = await adminDownloadBackup(name);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr('No se pudo descargar el backup');
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Backups de la base de datos</h1>
          <p className="text-sm text-gray-500">
            El sistema genera un backup automático cada día a las 2:00 AM. Se guardan los últimos 30 días.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="btn-primary text-sm whitespace-nowrap disabled:opacity-50"
        >
          {running ? 'Generando…' : '+ Crear backup ahora'}
        </button>
      </div>

      {/* Mensajes */}
      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded text-sm">
          {msg}
        </div>
      )}
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {err}
        </div>
      )}

      {/* Listado */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-400 text-sm">Cargando…</p>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm mb-3">Aún no hay backups.</p>
            <p className="text-gray-400 text-xs">
              Dale al botón "Crear backup ahora" para generar el primero.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Archivo</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Tamaño</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {backups.map(b => (
                <tr key={b.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 break-all">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(b.created)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtSize(b.size_kb)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(b.name)}
                      className="text-brand-500 hover:text-brand-700 font-semibold text-sm"
                    >
                      Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">¿Cómo restaurar un backup?</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Descarga el archivo <code>.sqlite.gz</code> que quieras restaurar.</li>
          <li>Descomprímelo (con 7-Zip en Windows o <code>gunzip</code> en Linux).</li>
          <li>Detén el backend (<code>npm start</code>) y reemplaza <code>backend/database.sqlite</code> por el descomprimido.</li>
          <li>Vuelve a arrancar el backend.</li>
        </ol>
      </div>
    </div>
  );
}
