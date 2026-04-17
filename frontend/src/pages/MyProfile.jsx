import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getMyTechnicianProfile, updateMyProfile, uploadImages, deleteImage } from '../services/api';

const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP || '';

function toWaNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('56') && digits.length >= 11) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `56${digits}`;
  if (digits.startsWith('09') && digits.length === 10) return `56${digits.slice(1)}`;
  return `56${digits}`;
}

const STATUS_INFO = {
  pending: {
    label: 'Pendiente de aprobación',
    desc: 'Tu perfil está siendo revisado por el administrador. Te notificaremos cuando sea aprobado.',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  active: {
    label: 'Perfil activo',
    desc: 'Tu perfil está publicado y visible para todos los clientes.',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  rejected: {
    label: 'Perfil rechazado',
    desc: 'Tu perfil no fue aprobado. Contáctanos para más información.',
    color: 'bg-red-50 border-red-200 text-red-800',
  },
  expired: {
    label: 'Membresía vencida',
    desc: 'Tu perfil ya no está visible para los clientes.',
    color: 'bg-gray-50 border-gray-200 text-gray-700',
  },
};

function waRenewalLink(name) {
  if (!ADMIN_WHATSAPP) return null;
  const text = encodeURIComponent(`Hola, soy ${name} y quiero renovar mi membresía en UrgenteYa.cl`);
  return `https://wa.me/${toWaNumber(ADMIN_WHATSAPP)}?text=${text}`;
}

const PHOTO_LIMITS = { free: 5, premium: 5, top: 10 };

function ImageUploader({ techId, images, onUpdate, plan }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const MAX_IMAGES = PHOTO_LIMITS[plan] ?? 3;
  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setError('');

    const validFiles = Array.from(files).filter(f =>
      ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)
    );

    if (validFiles.length !== files.length) {
      setError('Solo se permiten imágenes JPG o PNG.');
      return;
    }

    if (validFiles.length > remaining) {
      setError(`Solo puedes subir ${remaining} imagen${remaining !== 1 ? 'es' : ''} más (máximo ${MAX_IMAGES}).`);
      return;
    }

    const oversize = validFiles.find(f => f.size > 10 * 1024 * 1024);
    if (oversize) {
      setError('Cada imagen debe pesar menos de 10MB.');
      return;
    }

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
    try {
      await deleteImage(techId, filename);
      onUpdate();
    } catch {
      setError('No se pudo eliminar la imagen.');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Fotos del perfil</h2>
        <span className="text-xs text-gray-400">{images.length} / {MAX_IMAGES} fotos</span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {images.map((img, idx) => (
            <div key={img.filename} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={`/uploads/technicians/${img.filename}`}
                alt={`Foto ${idx + 1}`}
                className="w-full h-32 object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-brand-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                  Principal
                </span>
              )}
              <button
                onClick={() => handleDelete(img.filename)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar foto"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <svg className="w-6 h-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm">Subiendo y procesando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Arrastra fotos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400">
                JPG o PNG — máx. 10MB por foto — puedes subir {remaining} más
              </p>
            </div>
          )}
        </div>
      )}

      {images.length >= MAX_IMAGES && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Has alcanzado el límite de {MAX_IMAGES} fotos. Elimina una para subir otra.
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400 mt-3">
        Las fotos se redimensionan automáticamente. La primera foto es la imagen principal del perfil.
      </p>
    </div>
  );
}

function EditProfileForm({ tech, onSaved }) {
  const [form, setForm] = useState({
    phone: tech.phone || '',
    whatsapp: tech.whatsapp || '',
    description: tech.description || '',
    is_urgent_24h: !!tech.is_urgent_24h,
    years_experience: tech.years_experience ?? '',
    price_from: tech.price_from || '',
    availability: tech.availability || '',
    services_list: tech.services_list || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateMyProfile(form);
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-bold text-gray-900 mb-4">Editar mi perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Teléfonos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              className="input-field"
              placeholder="912345678"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm flex-shrink-0">+56</span>
              <input
                type="tel"
                value={form.whatsapp.replace(/^56/, '')}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').replace(/^56/, '');
                  update('whatsapp', '56' + digits);
                }}
                className="input-field rounded-l-none"
                placeholder="912345678"
                maxLength={9}
              />
            </div>
          </div>
        </div>

        {/* Servicios que ofrece */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Servicios que ofreces</label>
          <textarea
            value={form.services_list}
            onChange={e => update('services_list', e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Ej: Instalación eléctrica, cambio de enchufes, fusibles, tableros..."
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">Describe los trabajos específicos que realizas.</p>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Descripción general</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Cuéntales a los clientes sobre ti y tu experiencia..."
            maxLength={500}
          />
        </div>

        {/* Experiencia y precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Años de experiencia</label>
            <input
              type="number"
              value={form.years_experience}
              onChange={e => update('years_experience', e.target.value)}
              className="input-field"
              placeholder="Ej: 5"
              min={0}
              max={60}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Precio desde (referencial)</label>
            <input
              type="text"
              value={form.price_from}
              onChange={e => update('price_from', e.target.value)}
              className="input-field"
              placeholder="Ej: $15.000"
              maxLength={50}
            />
          </div>
        </div>

        {/* Disponibilidad */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Horario y disponibilidad</label>
          <input
            type="text"
            value={form.availability}
            onChange={e => update('availability', e.target.value)}
            className="input-field"
            placeholder="Ej: Lunes a sábado, 8:00 a 20:00"
            maxLength={100}
          />
        </div>

        {/* Urgencia 24h */}
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={form.is_urgent_24h}
            onChange={e => update('is_urgent_24h', e.target.checked)}
            className="w-4 h-4 mt-0.5 text-brand-500 rounded flex-shrink-0"
          />
          <div>
            <span className="text-sm font-medium text-gray-700 block">Servicio urgente 24 horas</span>
            <span className="text-xs text-gray-400">Estoy disponible para emergencias a cualquier hora</span>
          </div>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
            Cambios guardados correctamente.
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

function RenewalBanner({ daysLeft, techName, status }) {
  const waLink = waRenewalLink(techName);
  const isExpired = status === 'expired';

  return (
    <div className={`border rounded-xl px-4 py-4 ${isExpired ? 'border-gray-300 bg-gray-50' : 'border-orange-300 bg-orange-50'}`}>
      <div className="flex items-start gap-3 mb-3">
        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isExpired ? 'text-gray-500' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <p className={`text-sm font-semibold ${isExpired ? 'text-gray-800' : 'text-orange-800'}`}>
            {isExpired
              ? 'Tu membresía ha vencido — tu perfil no está visible'
              : `Tu membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
          </p>
          <p className={`text-xs mt-0.5 ${isExpired ? 'text-gray-600' : 'text-orange-700'}`}>
            {isExpired
              ? 'Los clientes no pueden encontrarte hasta que renueves.'
              : 'Renueva antes para no perder visibilidad con los clientes.'}
          </p>
        </div>
      </div>
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
          </svg>
          Renovar membresía por WhatsApp
        </a>
      ) : (
        <p className="text-xs text-center text-gray-500">Contacta al administrador para renovar.</p>
      )}
    </div>
  );
}

export default function MyProfile() {
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  function fetchProfile() {
    setLoading(true);
    getMyTechnicianProfile()
      .then(r => setTech(r.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('No tienes un perfil de maestro. ¿Ya te registraste?');
        } else {
          setError('No se pudo cargar el perfil.');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchProfile(); }, []);

  const statusInfo = tech ? STATUS_INFO[tech.status] : null;

  function daysUntilExpiry(expiresAt) {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const daysLeft = tech ? daysUntilExpiry(tech.expires_at) : null;
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && tech?.status === 'active';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Mi perfil</h1>

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-7 h-7 animate-spin mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Cargando...
          </div>
        )}

        {error && (
          <div className="card p-8 text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/registro" className="btn-primary">Registrarme como maestro</Link>
          </div>
        )}

        {tech && (
          <div className="space-y-5">
            {/* Estado del perfil */}
            <div className={`border rounded-xl px-4 py-3 ${statusInfo.color}`}>
              <p className="font-semibold text-sm">{statusInfo.label}</p>
              <p className="text-xs mt-0.5 opacity-80">{statusInfo.desc}</p>
            </div>

            {/* Estadísticas de contacto — solo si está activo */}
            {tech.status === 'active' && (
              <div className="card p-5">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Estadísticas de contacto
                </h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-brand-50 rounded-xl p-3">
                    <p className="text-2xl font-black text-brand-600">{tech.contacts_this_month ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Este mes</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-black text-gray-700">{tech.contacts_last_month ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Mes anterior</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-black text-gray-700">{tech.contacts_total ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total histórico</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Personas que hicieron clic en tu botón de WhatsApp
                </p>
              </div>
            )}

            {/* Banner vencimiento próximo */}
            {expiringSoon && (
              <RenewalBanner
                daysLeft={daysLeft}
                techName={tech.name}
                status="expiring"
              />
            )}

            {/* Banner membresía vencida */}
            {tech.status === 'expired' && (
              <RenewalBanner techName={tech.name} status="expired" />
            )}

            {/* Banner perfil rechazado con WhatsApp */}
            {tech.status === 'rejected' && ADMIN_WHATSAPP && (
              <a
                href={waRenewalLink(tech.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-3 transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.396A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold">¿Tienes dudas? Contáctanos por WhatsApp</p>
                  <p className="text-xs opacity-80">Te respondemos a la brevedad</p>
                </div>
              </a>
            )}

            {/* Datos principales (solo lectura) */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Datos del perfil</h2>
                <button
                  onClick={() => setShowEdit(v => !v)}
                  className="text-sm text-brand-500 hover:text-brand-600 font-medium"
                >
                  {showEdit ? 'Ocultar edición' : 'Editar perfil'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Nombre</span>
                  <span className="font-medium text-gray-800">{tech.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Categoría</span>
                  <span className="font-medium text-gray-800">{tech.category}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Comuna</span>
                  <span className="font-medium text-gray-800">{tech.comuna}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Teléfono</span>
                  <span className="font-medium text-gray-800">{tech.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Plan</span>
                  <span className="font-medium text-gray-800 capitalize">{tech.plan}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">Vigencia hasta</span>
                  <span className="font-medium text-gray-800">
                    {tech.expires_at
                      ? new Date(tech.expires_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
                {tech.years_experience ? (
                  <div>
                    <span className="text-gray-400 block text-xs mb-0.5">Años de experiencia</span>
                    <span className="font-medium text-gray-800">{tech.years_experience} años</span>
                  </div>
                ) : null}
                {tech.price_from ? (
                  <div>
                    <span className="text-gray-400 block text-xs mb-0.5">Precio desde</span>
                    <span className="font-medium text-gray-800">{tech.price_from}</span>
                  </div>
                ) : null}
                {tech.availability ? (
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-xs mb-0.5">Disponibilidad</span>
                    <span className="font-medium text-gray-800">{tech.availability}</span>
                  </div>
                ) : null}
                {tech.is_urgent_24h ? (
                  <div className="col-span-2">
                    <span className="inline-block bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Servicio urgente 24 horas activo
                    </span>
                  </div>
                ) : null}
              </div>

              {tech.services_list && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-400 block text-xs mb-1">Servicios que ofreces</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{tech.services_list}</p>
                </div>
              )}

              {tech.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-400 block text-xs mb-1">Descripción</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{tech.description}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                Nombre, categoría y comuna solo pueden ser modificados por el administrador.
              </p>
            </div>

            {/* Formulario de edición */}
            {showEdit && (
              <EditProfileForm
                tech={tech}
                onSaved={() => {
                  fetchProfile();
                }}
              />
            )}

            {/* Uploader de fotos */}
            <ImageUploader
              techId={tech.id}
              images={tech.images || []}
              onUpdate={fetchProfile}
              plan={tech.plan}
            />

            {/* Ver perfil público */}
            {tech.status === 'active' && (
              <div className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Tu perfil público</p>
                  <p className="text-xs text-gray-400">Así te ven los clientes</p>
                </div>
                <Link to={`/tecnicos/${tech.id}`} className="btn-secondary text-sm py-2 px-4">
                  Ver perfil
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
