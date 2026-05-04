import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Çerezleri (cookies) otomatik olarak gönder/al
});

// YANIT (RESPONSE) INTERCEPTOR'I — 401 gelirse çıkış yap
// (Not: Yenileme işlemi artık backend middleware'i tarafından otomatik yapılıyor)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Eğer 401 hatası alıyorsak, hem access hem refresh token geçersiz demektir.
        if (error.response?.status === 401) {
            console.error("Yetkilendirme hatası: Giriş sayfasına yönlendiriliyorsunuz.");
            localStorage.removeItem('user');
            
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;