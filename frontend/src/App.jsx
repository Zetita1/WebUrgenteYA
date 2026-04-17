import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';

import ScrollToTop from './components/ScrollToTop';
import InstallBanner from './components/InstallBanner';
import Home from './pages/Home';
import TechniciansList from './pages/TechniciansList';
import TechnicianProfile from './pages/TechnicianProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import MyProfile from './pages/MyProfile';
import Terminos from './pages/Terminos';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Precios from './pages/Precios';
import AdminLayout from './pages/admin/AdminLayout';
import AdminTechnicians from './pages/admin/AdminTechnicians';
import AdminTechnicianForm from './pages/admin/AdminTechnicianForm';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBackups from './pages/admin/AdminBackups';

function RequireAdmin({ children }) {
  const { isAdmin, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <InstallBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tecnicos" element={<TechniciansList />} />
          <Route path="/tecnicos/:id" element={<TechnicianProfile />} />
          {/* Rutas SEO: /maestros/electricidad/santiago-centro */}
          <Route path="/maestros/:categoria" element={<TechniciansList />} />
          <Route path="/maestros/:categoria/:comuna" element={<TechniciansList />} />
          <Route path="/mi-perfil" element={<MyProfile />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/precios" element={<Precios />} />
          <Route path="/olvide-contrasena" element={<ForgotPassword />} />
          <Route path="/recuperar-contrasena" element={<ResetPassword />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminTechnicians />} />
            <Route path="nuevo" element={<AdminTechnicianForm />} />
            <Route path="editar/:id" element={<AdminTechnicianForm />} />
            <Route path="resenas" element={<AdminReviews />} />
            <Route path="backups" element={<AdminBackups />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  );
}
