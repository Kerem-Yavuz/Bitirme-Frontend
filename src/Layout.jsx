import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- KULLANICI MENÜSÜ İÇİN STATE'LER ---
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [menuAcik, setMenuAcik] = useState(false);

    // --- DERS SEÇİMİ ALT MENÜSÜ İÇİN STATE ---
    const [dersMenuAcik, setDersMenuAcik] = useState(false);
    // 8 Dönemi otomatik oluşturmak için dizi
    const donemler = [1, 2, 3, 4, 5, 6, 7, 8];

    // Kullanıcı ismini çekme
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setKullaniciAdi(JSON.parse(user).fullName);
        }
    }, []);

    // Menü Aç/Kapa Mantığı 
    const toggleMenu = () => {
        setMenuAcik(!menuAcik); // Açıksa kapatır, kapalıysa açar
    };

    // Çıkış Yapma
    const cikisYap = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="layout-container">
            {/* SOL GLOBAL MENÜ */}
            <div className="sidebar-menu">
                <div
                    className={`menu-item ${location.pathname === '/anasayfa' ? 'active' : ''}`}
                    onClick={() => navigate('/anasayfa')}
                >
                    <div className="icon">🏠</div>
                    <span className="tooltip">Anasayfa</span>
                </div>

                {/* --- DERS SEÇİMİ ANA BUTONU --- */}
                <div
                    // Eğer URL '/ders-secimi' ile başlıyorsa bu butonu hep aktif (renkli) tut
                    className={`menu-item ${location.pathname.startsWith('/ders-secimi') ? 'active' : ''}`}
                    onClick={() => setDersMenuAcik(!dersMenuAcik)}
                >
                    <div className="icon">📚</div>
                    <span className="tooltip">Ders Seçimi {dersMenuAcik ? '▼' : '▶'}</span>
                </div>

                {/* --- DERS SEÇİMİ ALT MENÜSÜ (1-8 DÖNEMLER) --- */}
                {dersMenuAcik && (
                    <div className="donemler-menu" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                        {donemler.map((donem) => (
                            <div
                                key={donem}
                                // Tıklanan dönem aktifse onu işaretle
                                className={`menu-item ${location.pathname === `/ders-secimi/${donem}` ? 'active' : ''}`}
                                onClick={() => navigate(`/ders-secimi/${donem}`)}
                                // Alt menü olduğunu belli etmek için biraz küçültüyoruz
                                style={{ transform: 'scale(0.85)', margin: '0' }}
                            >
                                <div className="icon" style={{ fontWeight: 'bold' }}>{donem}</div>
                                <span className="tooltip">{donem}. Dönem</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SAĞ İÇERİK ALANI */}
            <div className="content-area">

                {/* --- SAĞ ÜST KULLANICI KUTUSU */}
                <div className="user-box" onClick={toggleMenu} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                    <div className="avatar">
                        {kullaniciAdi ? kullaniciAdi.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{kullaniciAdi}</span>
                        <span className="user-role" style={{ fontSize: '10px' }}>Öğrenci ▼</span>
                    </div>
                    {/* Açılır Menü */}
                    <div className="dropdown-menu" style={{ display: menuAcik ? 'block' : 'none' }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/profil'); }} className="dropdown-item">
                            👤 Profilim
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cikisYap(); }} className="dropdown-item" style={{ color: '#dc3545' }}>
                            🚪 Çıkış Yap
                        </button>
                    </div>
                </div>

                {/* Sayfa İçeriği Buraya Gelecek */}
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;