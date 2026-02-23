import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [menuAcik, setMenuAcik] = useState(false);
    const [dersMenuAcik, setDersMenuAcik] = useState(false);
    const donemler = [1, 2, 3, 4, 5, 6, 7, 8];

    // Kullanıcı ismini ve Yetkisini çekme
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userObj = JSON.parse(userStr);
            setKullaniciAdi(userObj.fullName);

            // --- GERÇEK VE DİNAMİK ADMİN KONTROLÜ ---
            // Backend'den gelen privileges dizisinde 'Admin' var mı kontrolü yapıyoruz
            if (userObj.privileges && userObj.privileges.includes('Admin')) {
                setIsAdmin(true);
            }
        }
    }, []);

    const toggleMenu = () => {
        setMenuAcik(!menuAcik);
    };

    const cikisYap = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="layout-container">
            {/* SOL GLOBAL MENÜ */}
            <div className="sidebar-menu">
                {/* ... Anasayfa, Admin Paneli ve Ders Seçimi link kısımları tamamen aynı kalacak ... */}

                {/* Herkes İçin Anasayfa */}
                <div
                    className={`menu-item ${location.pathname === '/anasayfa' ? 'active' : ''}`}
                    onClick={() => navigate('/anasayfa')}
                >
                    <div className="icon">🏠</div>
                    <span className="tooltip">Anasayfa</span>
                </div>

                {isAdmin ? (
                    /* SADECE ADMİNLERİN GÖRECEĞİ BUTON */
                    <div
                        className={`menu-item ${location.pathname.startsWith('/admin-panel') ? 'active' : ''}`}
                        onClick={() => navigate('/admin-panel')}
                    >
                        <div className="icon">🛠️</div>
                        <span className="tooltip">Admin Paneli</span>
                    </div>
                ) : (
                    /* SADECE ÖĞRENCİLERİN GÖRECEĞİ BUTON VE ALT MENÜSÜ */
                    <>
                        <div
                            className={`menu-item ${location.pathname.startsWith('/ders-secimi') ? 'active' : ''}`}
                            onClick={() => setDersMenuAcik(!dersMenuAcik)}
                        >
                            <div className="icon">📚</div>
                            <span className="tooltip">Ders Seçimi {dersMenuAcik ? '▼' : '▶'}</span>
                        </div>

                        {dersMenuAcik && (
                            <div className="donemler-menu" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
                                {donemler.map((donem) => (
                                    <div
                                        key={donem}
                                        className={`menu-item ${location.pathname === `/ders-secimi/${donem}` ? 'active' : ''}`}
                                        onClick={() => navigate(`/ders-secimi/${donem}`)}
                                        style={{ transform: 'scale(0.85)', margin: '0' }}
                                    >
                                        <div className="icon" style={{ fontWeight: 'bold' }}>{donem}</div>
                                        <span className="tooltip">{donem}. Dönem</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* SAĞ İÇERİK ALANI */}
            <div className="content-area">

                {/* SAĞ ÜST KULLANICI KUTUSU */}
                <div className="user-box" onClick={toggleMenu} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}>
                    <div className="avatar">
                        {kullaniciAdi ? kullaniciAdi.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{kullaniciAdi}</span>
                        {/* Yetkiye göre "Admin" veya "Öğrenci" yazdırıyoruz */}
                        <span className="user-role" style={{ fontSize: '10px' }}>
                            {isAdmin ? 'Admin ▼' : 'Öğrenci ▼'}
                        </span>
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

                <Outlet />
            </div>
        </div>
    );
};

export default Layout;