import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }

        const userObj = JSON.parse(storedUser);

        // Canlı veriyi API'den çek
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/users/${userObj.id}`);
                if (res.data && res.data.status) {
                    setUser(res.data.data);
                }
            } catch (err) {
                console.error('Profil yüklenemedi:', err);
                setError('Profil bilgileri yüklenemedi.');
                // API hata verirse localStorage'daki bilgileri kullan
                setUser(userObj);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="profil-container">
                <p style={{ color: '#888' }}>Yükleniyor...</p>
            </div>
        );
    }

    if (!user) return null;

    const isAdmin = user.privileges && user.privileges.includes('Admin');

    return (
        <div className="profil-container">
            <div className="profil-kart">
                <div className="profil-header">
                    <div className="profil-avatar-buyuk">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <h2>{user.fullName || '-'}</h2>
                    <p style={{ color: '#888' }}>
                        {user.privileges && user.privileges.join(' / ') + ' Hesabı' || 'Kullanıcı Hesabı'}
                    </p>
                    {user.privileges && user.privileges.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {user.privileges.map((priv, i) => (
                                <span key={i} style={{
                                    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                    backgroundColor: priv === 'Admin' ? '#ffeaa7' : priv === 'Teacher' ? '#d4edda' : '#dfe6e9',
                                    color: priv === 'Admin' ? '#d68910' : priv === 'Teacher' ? '#155724' : '#636e72'
                                }}>
                                    {priv}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {error && <div className="admin-msg-error" style={{ marginBottom: '15px' }}>{error}</div>}

                <div className="form-group">
                    <label>Kullanıcı ID</label>
                    <input type="text" value={user.userID || user.id || '-'} disabled className="input-disabled" />
                </div>

                <div className="form-group">
                    <label>Ad Soyad</label>
                    <input type="text" value={user.fullName || '-'} disabled className="input-disabled" />
                </div>

                <div className="form-group">
                    <label>E-posta Adresi</label>
                    <input type="text" value={user.email || '-'} disabled className="input-disabled" />
                </div>

                <div className="form-group">
                    <label>Telefon Numarası</label>
                    <input type="text" value={user.phoneNo || '-'} disabled className="input-disabled" />
                </div>

                <div className="form-group">
                    <label>Durum</label>
                    <input type="text" value={user.active ? 'Aktif' : 'Pasif'} disabled className="input-disabled" />
                </div>

                <button onClick={() => navigate('/anasayfa')} className="btn-geri">
                    ← Anasayfaya Dön
                </button>
            </div>
        </div>
    );
}

export default Profile;