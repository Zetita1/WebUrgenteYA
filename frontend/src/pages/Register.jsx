import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
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

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '',
    whatsapp: '', comuna: '', category: '', description: '',
    is_urgent_24h: false, years_experience: '', price_from: '',
    availability: '', services_list: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres.');
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 9) {
      return setError('El teléfono debe tener 8 o 9 dígitos (ej: 912345678).');
    }

    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro exitoso</h2>
        <p className="text-gray-500 mb-6">
          Tu solicitud fue enviada. El administrador revisará tu perfil y te activará pronto.
        </p>
        <Link to="/" className="btn-primary inline-block px-8 py-3">
          Volver al inicio
        </Link>
      </div>
    </div>
  );

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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Enviando...' : 'Enviar solicitud de registro'}
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
