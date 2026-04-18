import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar 401 globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// ─── Técnicos públicos ────────────────────────────────────────────────────────
export const getMyTechnicianProfile = () => api.get('/technicians/me');
export const updateMyProfile = (data) => api.put('/technicians/me', data);
export const getTechnicians = (params) => api.get('/technicians', { params });
export const getTechnician = (id) => api.get(`/technicians/${id}`);
export const createReview = (id, data) => api.post(`/technicians/${id}/reviews`, data);
export const recordContact = (id) => api.post(`/technicians/${id}/contact`);
export const uploadImages = (id, formData) => api.post(`/technicians/${id}/images`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteImage = (id, filename) => api.delete(`/technicians/${id}/images/${filename}`);
export const reorderImages = (id, order) => api.put(`/technicians/${id}/images/reorder`, { order });
export const adminDeleteImage = (id, filename) => api.delete(`/admin/technicians/${id}/images/${filename}`);

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetTechnicians = (params) => api.get('/admin/technicians', { params });
export const adminGetTechnician = (id) => api.get(`/admin/technicians/${id}`);
export const adminCreateTechnician = (data) => api.post('/admin/technicians', data);
export const adminUpdateTechnician = (id, data) => api.put(`/admin/technicians/${id}`, data);
export const adminApproveTechnician = (id) => api.post(`/admin/technicians/${id}/approve`);
export const adminRejectTechnician = (id) => api.post(`/admin/technicians/${id}/reject`);
export const adminActivateTechnician = (id, data) => api.post(`/admin/technicians/${id}/activate`, data);
export const adminExpireTechnician = (id) => api.post(`/admin/technicians/${id}/expire`);
export const adminVerifyTechnician = (id) => api.post(`/admin/technicians/${id}/verify`);
export const adminDeleteTechnician = (id) => api.delete(`/admin/technicians/${id}`);
export const adminGetStats = () => api.get('/admin/stats');
export const adminGetOptions = () => api.get('/admin/options');
export const adminDeleteReview = (id) => api.delete(`/admin/reviews/${id}`);
export const adminGetAllReviews = () => api.get('/admin/reviews');
export const adminGetPendingReviews = () => api.get('/admin/reviews/pending');
export const adminGetPendingReviewsCount = () => api.get('/admin/reviews/pending-count');
export const adminApproveReview = (id) => api.post(`/admin/reviews/${id}/approve`);
export const adminGetTechnicianHistory = (id) => api.get(`/admin/technicians/${id}/history`);
export const adminGetContactsMonthly = () => api.get('/admin/stats/contacts-monthly');

// Backups
export const adminListBackups = () => api.get('/admin/backups');
export const adminRunBackup   = () => api.post('/admin/backups/run');
export const adminDownloadBackup = (name) =>
  api.get(`/admin/backups/${name}/download`, { responseType: 'blob' });

export default api;
