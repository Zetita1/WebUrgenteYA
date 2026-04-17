import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import SEO from '../components/SEO';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      loginUser(res.data.user, res.data.token);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      setForm(f => ({ ...f, password: '' }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <SEO title="Iniciar sesión" url="/login" noindex />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <img src="/logo.png" alt="UrgenteYa.cl" className="h-14 w-auto mx-auto" />
            <span className="text-sm text-gray-400 self-end mb-1">.cl</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Ingresa a tu cuenta</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({...f, email: e.target.value}))}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-brand-500 hover:text-brand-600 font-semibold">
                Regístrate gratis
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/olvide-contrasena" className="text-gray-400 hover:text-gray-600 text-xs">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
