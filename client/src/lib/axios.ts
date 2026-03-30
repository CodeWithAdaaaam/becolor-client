import axios from 'axios';

// --- CORRECTION ICI ---
// On utilise localhost par défaut pour le développement
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Debug: afficher l'URL utilisée (Regarde ta console navigateur F12)
console.log('🔗 API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important pour les cookies/sessions
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;