import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 1. Giriş yap ve temel bilgileri al
            const response = await api.post('/users/login', {
                usernameoremail: formData.username,
                password: formData.password
            });
            const loginData = response.data.data;

            // 2. İkinci isteği atabilmek için Token'ı kaydet
            localStorage.setItem('token', loginData.accessToken);

            // 3. Kullanıcının YETKİLERİNİ çekmek için kendi profiline istek at
            const profileRes = await api.get(`/users/${loginData.id}`);
            const profileData = profileRes.data.data;

            // 4. Yetkileri loginDatasına ekleyip localStorage'a son halini yaz
            const finalUser = {
                ...loginData,
                privileges: profileData.privileges || [] // Backend'den gelen yetki dizisi
            };
            localStorage.setItem('user', JSON.stringify(finalUser));

            // 5. Yönlendirme Kontrolü (Veritabanında Admin mi?)
            if (finalUser.privileges.includes('Admin')) {
                navigate('/admin-panel');
            } else {
                navigate('/anasayfa');
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Giriş başarısız oldu, bilgilerinizi kontrol edin.';
            setError(errorMessage);
            localStorage.removeItem('token'); // Hata olursa bozuk veriyi sil
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h2 className="title">Sisteme Giriş</h2>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Kullanıcı Adı veya Email</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input"
                            placeholder="ör: test@test.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Şifre</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            placeholder="******"
                            required
                        />
                    </div>

                    <button type="submit" className="button">Giriş Yap</button>
                </form>
            </div>
        </div>
    );
};

export default Login;