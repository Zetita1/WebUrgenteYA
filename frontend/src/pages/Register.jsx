import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { register, uploadImages } from '../services/api';
import SEO from '../components/SEO';

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

// ─── Indicador de pasos ───────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4 mb-2">
      {[{ n: 1, label: 'Datos' }, { n: 2, label: 'Fotos' }].map(({ n, label }, i) => (
        <React.Fragment key={n}>
          {i > 0 && <div className={`w-10 h-px ${current > 1 ? 'bg-brand-500' : 'bg-gray-300'}`} />}
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${current > n ? 'bg-green-500 text-white' :
                current === n ? 'bg-brand-500 text-white' :
                'bg-gray-200 text-gray-500'}`}>
              {current > n
                ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                : n}
            </div>
            <span className={`text-xs font-medium ${current === n ? 'text-brand-500' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState('form'); // 'form' | 'photos' | 'done'
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '',
    whatsapp: '', comuna: '', category: '', description: '',
    is_urgent_24h: false, covers_rm: false, years_experience: '', price_from: '',
    availability: '', services_list: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fotos
  const [techId, setTechId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();
  const MAX_PHOTOS = 5;
  const remaining = MAX_PHOTOS - photos.length;

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 9) return setError('El teléfono debe tener 8 o 9 dígitos (ej: 912345678).');
    setLoading(true);
    try {
      const res = await register(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ role: 'technician' }));
      setTechId(res.data.technicianId);
      setStep('photos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoFiles(files) {
    if (!files || files.length === 0) return;
    setUploadError('');
    const valid = Array.from(files).filter(f => ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type));
    if (valid.length !== files.length) { setUploadError('Solo se permiten imágenes JPG o PNG.'); return; }
    if (valid.length > remaining) { setUploadError(`Puedes subir ${remaining} foto${remaining !== 1 ? 's' : ''} más.`); return; }
    if (valid.find(f => f.size > 10 * 1024 * 1024)) { setUploadError('Cada imagen debe pesar menos de 10MB.'); return; }

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    valid.forEach(f => formData.append('images', f));
    try {
      const res = await uploadImages(techId, formData, p => setUploadProgress(p));
      const saved = res.data.files || [];
      if (saved.length > 0) {
        setPhotos(prev => [
          ...prev,
          ...saved.map(fn => ({ filename: fn, url: `/uploads/technicians/${fn}` }))
        ]);
      }
      if (res.data.warning) {
        setUploadError(`⚠️ ${res.data.warning} Las demás se subieron correctamente.`);
      }
      if (saved.length === 0) {
        setUploadError('No se pudieron procesar las fotos. Intenta con otras imágenes.');
      }
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Error al subir fotos. Intenta con otras imágenes.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  // ─── PASO DONE ───────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro completo!</h2>
        {photos.length > 0 ? (
          <p className="text-gray-500 mb-2">
            Tu perfil fue enviado con <strong>{photos.length} foto{photos.length !== 1 ? 's' : ''}</strong>.
          </p>
        ) : (
          <p className="text-amber-600 text-sm mb-2">
            ⚠️ No subiste fotos. Tu perfil tendrá menos visibilidad.
          </p>
        )}
        <p className="text-gray-500 mb-6">
          El administrador revisará tu perfil y te avisará cuando esté activo.
        </p>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {photos.slice(0, 3).map((p, i) => (
              <img key={p.filename} src={p.url} alt="" className="w-full h-20 object-cover rounded-lg" />
            ))}
          </div>
        )}
        <Link to="/" className="btn-primary inline-block px-8 py-3">
          Volver al inicio
        </Link>
      </div>
    </div>
  );

  // ─── PASO FOTOS ───────────────────────────────────────────────────────────────
  if (step === 'photos') return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Link to="/">
            <img src="/logo.png" alt="UrgenteYa.cl" className="h-12 w-auto mx-auto" />
          </Link>
          <StepIndicator current={2} />
          <h1 className="text-xl font-bold text-gray-900 mt-3">Sube fotos de tus trabajos</h1>
          <p className="text-sm text-gray-500">Las fotos generan confianza y más clientes</p>
        </div>

        <div className="card p-5 sm:p-6 space-y-4">
          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <span className="text-amber-500 text-lg flex-shrink-0">📸</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Se requiere al menos 1 foto</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Los perfiles con fotos reciben hasta 4 veces más contactos de clientes.
              </p>
            </div>
          </div>

          {/* Grid de fotos subidas */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={p.filename} className="relative rounded-lg overflow-hidden border-2 border-green-300 aspect-square">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                      Portada
                    </span>
                  )}
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Zona de upload */}
          {remaining > 0 && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handlePhotoFiles(e.dataTransfer.files); }}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                className="hidden"
                onChange={e => handlePhotoFiles(e.target.files)}
              />
              {uploading ? (
                <div className="space-y-3">
                  <svg className="w-6 h-6 animate-spin text-brand-500 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Subiendo y procesando fotos...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-brand-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{uploadProgress}%</p>
                </div>
              ) : (
                <div>
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">
                    {photos.length === 0 ? 'Arrastra fotos aquí o haz clic para subir' : 'Agregar más fotos'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG o PNG · máx. 10MB · puedes subir {remaining} foto{remaining !== 1 ? 's' : ''} más
                  </p>
                  <p className="text-xs text-brand-500 font-medium mt-1">
                    💡 Puedes seleccionar varias fotos a la vez
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {uploadError}
            </div>
          )}

          {/* Botón continuar */}
          <button
            onClick={() => setStep('done')}
            disabled={photos.length === 0 || uploading}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {photos.length === 0
              ? '📷 Sube al menos 1 foto para continuar'
              : `Finalizar registro con ${photos.length} foto${photos.length !== 1 ? 's' : ''} ✓`}
          </button>

          {/* Saltar (solo si no subió nada) */}
          {photos.length === 0 && !uploading && (
            <button
              onClick={() => setStep('done')}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline pt-1"
            >
              ⚠️ Saltar fotos (tu perfil tendrá mucho menos visibilidad)
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── PASO FORM ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <SEO
        title="Publica tu perfil de maestro"
        description="Regístrate gratis en UrgenteYa.cl y llega a más clientes en tu comuna. Sin intermediarios, contacto directo."
        url="/registro"
      />
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1">
            <img src="/logo.png" alt="UrgenteYa.cl" className="h-12 w-auto mx-auto" />
          </Link>
          <StepIndicator current={1} />
          <h1 className="text-xl font-bold text-gray-900 mt-3">Registra tu perfil de maestro</h1>
          <p className="text-sm text-gray-500">Llega a más clientes en tu comuna</p>
        </div>

        <div className="card p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                className="input-field" placeholder="Juan Pérez" required />
            </div>

            {/* Email y contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  className="input-field" placeholder="tu@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                  className="input-field" placeholder="Mínimo 8 caracteres" required minLength={8} />
              </div>
            </div>

            {/* Teléfonos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input type="tel" value={form.phone}
                  onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                  className="input-field" placeholder="912345678" required maxLength={9} />
                <p className="text-xs text-gray-400 mt-1">Solo números, sin +56</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm flex-shrink-0">+56</span>
                  <input type="tel"
                    value={form.whatsapp.replace(/^56/, '')}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').replace(/^56/, '');
                      update('whatsapp', '56' + digits);
                    }}
                    className="input-field rounded-l-none" placeholder="912345678" maxLength={9} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Si es distinto al teléfono</p>
              </div>
            </div>

            {/* Categoría y comuna */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select value={form.category} onChange={e => update('category', e.target.value)}
                  className="input-field" required>
                  <option value="">Selecciona...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comuna *</label>
                <select value={form.comuna} onChange={e => update('comuna', e.target.value)}
                  className="input-field" required>
                  <option value="">Selecciona...</option>
                  {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Servicios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicios que ofreces</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción general</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                className="input-field resize-none"
                rows={2}
                placeholder="Cuéntales a los clientes sobre ti..."
                maxLength={500}
              />
            </div>

            {/* Experiencia y precio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Años de experiencia</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio desde (referencial)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario y disponibilidad</label>
              <input
                type="text"
                value={form.availability}
                onChange={e => update('availability', e.target.value)}
                className="input-field"
                placeholder="Ej: Lunes a sábado, 8:00 a 20:00"
                maxLength={100}
              />
            </div>

            {/* Urgencia */}
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

            {/* Cobertura RM */}
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.covers_rm}
                onChange={e => update('covers_rm', e.target.checked)}
                className="w-4 h-4 mt-0.5 text-brand-500 rounded flex-shrink-0"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">Atiendo en toda la Región Metropolitana</span>
                <span className="text-xs text-gray-400">Puedo desplazarme a cualquier comuna de Santiago</span>
              </div>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Enviando...' : 'Continuar →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Al registrarte aceptas nuestros{' '}
            <Link to="/terminos" className="underline hover:text-gray-600">Términos y Condiciones</Link>
            {' '}y que tu perfil sea revisado antes de publicarse.
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold">Ingresar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
