import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Çerezleri (cookies) otomatik olarak gönder
});

// İSTEK (REQUEST) INTERCEPTOR'I — Her isteğe token ekle
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// YANIT (RESPONSE) INTERCEPTOR'I — 401 gelirse token yenilemeyi dene
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 hatası ve daha önce tekrar denenmemiş bir istekse
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const user = JSON.parse(localStorage.getItem('user'));

            if (user && user.refreshToken) {
                try {
                    // Token yenileme isteği
                    const res = await axios.post('/api/users/refresh', {
                        refreshToken: user.refreshToken
                    });

                    if (res.data.status) {
                        const newToken = res.data.data.token;
                        
                        // Yeni token'ı kaydet
                        user.token = newToken;
                        localStorage.setItem('user', JSON.stringify(user));

                        // Orijinal isteği yeni token ile tekrarla
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    console.error("Token yenileme başarısız:", refreshError);
                }
            }

            // Yenileme başarısızsa veya refresh token yoksa çıkış yap
            localStorage.removeItem('user');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;