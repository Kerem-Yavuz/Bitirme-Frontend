import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Çerezleri (cookies) otomatik olarak gönder
});

// YANIT (RESPONSE) INTERCEPTOR'I — 401 gelirse oturumu sonlandır
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Oturum süresi dolmuş veya geçersiz
            localStorage.removeItem('user');
            // Login sayfasında değilsek yönlendir
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;