import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import { HomeIcon, SettingsIcon, BookIcon, UserIcon, LogOutIcon, GraduationCapIcon } from './icons';
import './App.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [privileges, setPrivileges] = useState([]);
    const [menuAcik, setMenuAcik] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userObj = JSON.parse(userStr);
            setKullaniciAdi(userObj.fullName);
            setPrivileges(userObj.privileges || []);
        }
    }, []);

    const isAdmin = privileges.includes('Admin');
    const isTeacher = privileges.includes('Teacher');
    const isStudent = privileges.includes('Student');

    const toggleMenu = () => {
        setMenuAcik(!menuAcik);
    };

    const cikisYap = async () => {
        try {
            await api.post('/users/logout');
        } catch (err) {
            console.error('Çıkış hatası:', err);
        } finally {
            localStorage.removeItem('user');
            navigate('/');
        }
    };

    const currentMonth = new Date().getMonth() + 1;
    const isSpring = currentMonth >= 2 && currentMonth <= 6;
    const defaultSemester = isSpring ? 2 : 1;

    return (
        <div className="layout-container">
            {/* SOL GLOBAL MENÜ */}
            <div className="sidebar-menu">

                {/* Anasayfa — herkes görür */}
                <div
                    className={`menu-item ${location.pathname === '/anasayfa' ? 'active' : ''}`}
                    onClick={() => navigate('/anasayfa')}
                >
                    <div className="icon"><HomeIcon size={22} color="white" /></div>
                    <span className="tooltip">Anasayfa</span>
                </div>

                {/* Student paneli */}
                {isStudent && (
                    <div
                        className={`menu-item ${location.pathname.startsWith('/ders-secimi') ? 'active' : ''}`}
                        onClick={() => navigate(`/ders-secimi/${defaultSemester}`)}
                    >
                        <div className="icon"><BookIcon size={22} color="white" /></div>
                        <span className="tooltip">Ders Seçimi</span>
                    </div>
                )}

                {/* Teacher paneli */}
                {isTeacher && (
                    <div
                        className={`menu-item ${location.pathname.startsWith('/teacher-panel') ? 'active' : ''}`}
                        onClick={() => navigate('/teacher-panel')}
                    >
                        <div className="icon"><GraduationCapIcon size={22} color="white" /></div>
                        <span className="tooltip">Öğretmen Paneli</span>
                    </div>
                )}

                {/* Admin paneli */}
                {isAdmin && (
                    <div
                        className={`menu-item ${location.pathname.startsWith('/admin-panel') ? 'active' : ''}`}
                        onClick={() => navigate('/admin-panel')}
                    >
                        <div className="icon"><SettingsIcon size={22} color="white" /></div>
                        <span className="tooltip">Admin Paneli</span>
                    </div>
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
                        <span className="user-role" style={{ fontSize: '10px' }}>
                            {privileges.join(', ') || 'Kullanıcı'} ▼
                        </span>
                    </div>

                    {/* Açılır Menü */}
                    <div className="dropdown-menu" style={{ display: menuAcik ? 'block' : 'none' }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/profil'); }} className="dropdown-item">
                            <UserIcon size={16} /> Profilim
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/transkript'); }} className="dropdown-item">
                            <BookIcon size={16} /> Tüm Derslerim
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cikisYap(); }} className="dropdown-item" style={{ color: '#dc3545' }}>
                            <LogOutIcon size={16} /> Çıkış Yap
                        </button>
                    </div>
                </div>

                <Outlet />
            </div>
        </div>
    );
};

export default Layout;