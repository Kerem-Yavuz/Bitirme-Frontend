import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [menuAcik, setMenuAcik] = useState(false);

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

    const currentMonth = new Date().getMonth() + 1;
    // Şubat (2) ile Haziran (6) arası Çift Dönemler
    const isSpring = currentMonth >= 2 && currentMonth <= 6;
    const defaultSemester = isSpring ? 2 : 1;

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
                            onClick={() => navigate(`/ders-secimi/${defaultSemester}`)}
                        >
                            <div className="icon">📚</div>
                            <span className="tooltip">Ders Seçimi</span>
                        </div>
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