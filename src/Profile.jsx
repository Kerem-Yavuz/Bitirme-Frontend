import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState({ fullName: '', email: '' });

    useEffect(() => {
        // Hafızadaki bilgileri çekip ekrana basıyoruz
        const kayitliKullanici = localStorage.getItem('user');
        if (kayitliKullanici) {
            setUser(JSON.parse(kayitliKullanici));
        } else {
            navigate('/');
        }
    }, [navigate]);

    const handleFakeSave = (e) => {
        e.preventDefault();
        alert("Backend düzenlemesi yapılamadığı için şifre değiştirme özelliği şu an aktif değildir.");
    };

    return (
        <div className="profil-container">
            <div className="profil-kart">
                <div className="profil-header">
                    <div className="profil-avatar-buyuk">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <h2>{user.fullName}</h2>
                    <p style={{ color: '#888' }}>Öğrenci Hesabı</p>
                </div>

                <form onSubmit={handleFakeSave}>
                    <div className="form-group">
                        <label>Kullanıcı Adı / İsim</label>
                        <input type="text" value={user.fullName} disabled className="input-disabled" />
                    </div>

                    <div className="form-group">
                        <label>E-posta Adresi</label>
                        <input type="text" value={user.email} disabled className="input-disabled" />
                    </div>

                    <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

                    <div className="form-group">
                        <label>Yeni Şifre (Devre Dışı)</label>
                        <input type="password" placeholder="Yeni şifreniz" />
                    </div>

                    <button type="submit" className="btn-fake-save">Şifreyi Güncelle</button>
                </form>

                <button onClick={() => navigate('/ders-programi')} className="btn-geri">
                    ← Ders Programına Dön
                </button>
            </div>
        </div>
    );
}

export default Profile;