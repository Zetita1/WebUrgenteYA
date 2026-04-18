import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminCreateTechnician, adminUpdateTechnician, adminGetTechnician,
  uploadImages, adminDeleteImage, reorderImages, adminGetTechnicianHistory
} from '../../services/api';

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

const EMPTY_FORM = {
  name: '', phone: '', whatsapp: '', comuna: '',
  category: '', description: '', is_urgent_24h: false,
  status: 'active', plan: 'free', expires_days: 30,
  years_experience: '', price_from: '', availability: '', services_list: ''
};

// ─── Image manager (solo en modo edición) ────────────────────────────────────
function ImageManager({ techId, images, onUpdate }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const MAX_IMAGES = 5;
  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setError('');
    const validFiles = Array.from(files).filter(f =>
      ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)
    );
    if (validFiles.length !== files.length) { setError('Solo JPG o PNG.'); return; }
    if (validFiles.length > remaining) { setError(`Máximo ${remaining} imagen${remaining !== 1 ? 'es' : ''} más.`); return; }
    if (validFiles.find(f => f.size > 25 * 1024 * 1024)) { setError('Máx. 25MB por foto.'); return; }

    setUploading(true);
    const formData = new FormData();
    validFiles.forEach(f => formData.append('images', f));
    try {
      await uploadImages(techId, formData);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir imágenes.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(filename) {
    try { await adminDeleteImage(techId, filename); onUpdate(); }
    catch { setError('No se pudo eliminar.'); }
  }

  async function handleMove(index, direction) {
    const newImages = [...images];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= newImages.length) return;
    [newImages[index], newImages[swapIdx]] = [newImages[swapIdx], newImages[index]];
    try { await reorderImages(techId, newImages.map(i => i.filename)); onUpdate(); }
    catch { setError('No se pudo reordenar.'); }
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
        Fotos del perfil <span className="font-normal normal-case text-gray-400">({images.length}/{MAX_IMAGES})</span>
      </h2>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {images.map((img, idx) => (
            <div key={img.filename} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={`/uploads/technicians/${img.filename}`}
                alt={`Foto ${idx + 1}`}
                className="w-full h-20 object-cover"
              />
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                  Portada
                </span>
              )}
              {/* Botones mover */}
              <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button type="button" onClick={() => handleMove(idx, -1)}
                    className="bg-white text-gray-700 rounded px-1 shadow text-xs font-bold" title="Mover izquierda">◀</button>
                )}
                {idx < images.length - 1 && (
                  <button type="button" onClick={() => handleMove(idx, 1)}
                    className="bg-white text-gray-700 rounded px-1 shadow text-xs font-bold" title="Mover derecha">▶</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(img.filename)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <svg className="w-4 h-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Subiendo...
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Arrastra fotos o haz clic — JPG/PNG máx. 25MB — puedes subir {remaining} más
              </p>
              <p className="text-xs text-brand-500 font-medium mt-1">
                💡 Puedes seleccionar varias fotos a la vez
              </p>
            </>
          )}
        </div>
      )}

      {images.length >= MAX_IMAGES && (
        <p className="text-xs text-gray-400 mt-1">Límite de 5 fotos alcanzado.</p>
      )}

      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function AdminTechnicianForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  function loadTechnician() {
    adminGetTechnician(id)
      .then(r => {
        const t = r.data;
        setForm({
          name: t.name || '',
          phone: t.phone || '',
          whatsapp: t.whatsapp || '',
          comuna: t.comuna || '',
          category: t.category || '',
          description: t.description || '',
          is_urgent_24h: !!t.is_urgent_24h,
          status: t.status || 'active',
          plan: t.plan || 'free',
          expires_at: t.expires_at || '',
          expires_days: 30,
          years_experience: t.years_experience ?? '',
          price_from: t.price_from || '',
          availability: t.availability || '',
          services_list: t.services_list || '',
        });
        setImages(t.images || []);
      })
      .catch(() => setError('No se pudo cargar el maestro'))
      .finally(() => setFetching(false));

    adminGetTechnicianHistory(id)
      .then(r => setHistory(r.data))
      .catch(() => {});
  }

  useEffect(() => {
    if (!isEdit) return;
    loadTechnician();
  }, [id, isEdit]);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await adminUpdateTechnician(id, form);
        navigate('/admin');
      } else {
        await adminCreateTechnician(form);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return (
    <div className="text-center py-16 text-gray-400">Cargando...</div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700 text-sm">← Volver</button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Editar maestro' : 'Crear maestro manualmente'}
        </h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Datos personales */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field" placeholder="+56912345678" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} className="input-field" placeholder="+56912345678" />
              </div>
            </div>
          </div>

          {/* Servicio */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Servicio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select value={form.category} onChange={e => update('category', e.target.value)} className="input-field" required>
                  <option value="">Selecciona...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comuna *</label>
                <select value={form.comuna} onChange={e => update('comuna', e.target.value)} className="input-field" required>
                  <option value="">Selecciona...</option>
                  {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicios que ofrece</label>
                <textarea
                  value={form.services_list}
                  onChange={e => update('services_list', e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Ej: Instalación eléctrica, cambio de enchufes, fusibles..."
                  maxLength={500}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción general</label>
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Años de experiencia</label>
                <input type="number" value={form.years_experience} onChange={e => update('years_experience', e.target.value)} className="input-field" placeholder="Ej: 5" min={0} max={60} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio desde (referencial)</label>
                <input type="text" value={form.price_from} onChange={e => update('price_from', e.target.value)} className="input-field" placeholder="Ej: $15.000" maxLength={50} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilidad</label>
                <input type="text" value={form.availability} onChange={e => update('availability', e.target.value)} className="input-field" placeholder="Ej: Lunes a sábado, 8:00 a 20:00" maxLength={100} />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_urgent_24h}
                    onChange={e => update('is_urgent_24h', e.target.checked)}
                    className="w-4 h-4 text-brand-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Servicio urgente disponible 24 horas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Plan y estado */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Plan y estado</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={form.status} onChange={e => update('status', e.target.value)} className="input-field">
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="rejected">Rechazado</option>
                  <option value="expired">Expirado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select value={form.plan} onChange={e => update('plan', e.target.value)} className="input-field">
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="top">TOP</option>
                </select>
              </div>
              {isEdit ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha expiración</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at ? new Date(form.expires_at).toISOString().slice(0, 16) : ''}
                    onChange={e => update('expires_at', new Date(e.target.value).toISOString())}
                    className="input-field"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Días de vigencia</label>
                  <input
                    type="number"
                    value={form.expires_days}
                    onChange={e => update('expires_days', Number(e.target.value))}
                    className="input-field"
                    min={1}
                    max={365}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fotos — solo en edición */}
          {isEdit && (
            <div className="border-t border-gray-100 pt-5">
              <ImageManager
                techId={id}
                images={images}
                onUpdate={() => {
                  adminGetTechnician(id).then(r => setImages(r.data.images || []));
                }}
              />
            </div>
          )}

          {/* Historial de activaciones — solo en edición */}
          {isEdit && history.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Historial
              </h3>
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                      h.event === 'approved'  ? 'bg-green-500' :
                      h.event === 'activated' ? 'bg-blue-500'  :
                      h.event === 'rejected'  ? 'bg-red-500'   :
                      h.event === 'expired'   ? 'bg-gray-400'  :
                      'bg-orange-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-700 capitalize">
                        {h.event === 'approved'  ? 'Aprobado'        :
                         h.event === 'activated' ? 'Activado/Renovado':
                         h.event === 'rejected'  ? 'Rechazado'       :
                         h.event === 'expired'   ? 'Expirado'        :
                         h.event === 'created'   ? 'Creado'          : h.event}
                      </span>
                      {h.plan && (
                        <span className="ml-2 text-xs text-gray-400">Plan {h.plan}</span>
                      )}
                      {h.expires_at && (
                        <span className="ml-2 text-xs text-gray-400">
                          → hasta {new Date(h.expires_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {h.note && (
                        <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(h.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
              Podrás subir fotos una vez que el maestro sea creado, desde el botón "Editar" en el panel.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear maestro'}
            </button>
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary px-6 py-3">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
