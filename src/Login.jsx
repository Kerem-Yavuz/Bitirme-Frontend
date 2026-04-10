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
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/users/login', {
                usernameoremail: formData.username,
                password: formData.password
            });
            const loginData = response.data.data;

            const profileRes = await api.get(`/users/${loginData.id}`);
            const profileData = profileRes.data.data;

            const user = {
                id: loginData.id,
                email: loginData.email,
                fullName: loginData.fullName,
                privileges: profileData.privileges || []
            };
            localStorage.setItem('user', JSON.stringify(user));

            // Yetki bazlı yönlendirme
            if (user.privileges.includes('Admin')) {
                navigate('/admin-panel');
            } else if (user.privileges.includes('Teacher')) {
                navigate('/teacher-panel');
            } else {
                navigate('/anasayfa');
            }

        } catch (err) {
            console.error("Gerçek Hata Detayı:", err.response || err);
            const errorMessage = err.response?.data?.message || 'Giriş başarısız oldu, bilgilerinizi kontrol edin.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBypass = (role = 'Student') => {
        const fakeUser = {
            id: role === 'Admin' ? 1 : 2,
            email: role === 'Admin' ? "admin@bitirme.com" : "ahmet@bitirme.com",
            fullName: role === 'Admin' ? "Admin Kullanıcı" : "Ahmet Yılmaz (Bypass)",
            privileges: [role]
        };
        localStorage.setItem('user', JSON.stringify(fakeUser));
        
        if (role === 'Admin') navigate('/admin-panel');
        else if (role === 'Teacher') navigate('/teacher-panel');
        else navigate('/anasayfa');
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

                    <button type="submit" className="button" disabled={loading}>
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button 
                            type="button" 
                            className="button" 
                            style={{ backgroundColor: '#6c757d', flex: 1 }} 
                            onClick={() => handleBypass('Student')}
                        >
                            Öğrenci Bypass
                        </button>
                        <button 
                            type="button" 
                            className="button" 
                            style={{ backgroundColor: '#dc3545', flex: 1 }} 
                            onClick={() => handleBypass('Admin')}
                        >
                            Admin Bypass
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;