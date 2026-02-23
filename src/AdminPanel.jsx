import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için eklendi
import api from './api';
import './App.css';

const AdminPanel = () => {
    const [activeModal, setActiveModal] = useState(null);
    const navigate = useNavigate(); // Yönlendirme fonksiyonunu tanımladık

    // --- STATE'LER ---
    const [userForm, setUserForm] = useState({ fullName: '', email: '', password: '', phoneNo: '', departmentID: '' });
    const [userStatus, setUserStatus] = useState({ message: '', error: '' });

    const [lessonForm, setLessonForm] = useState({ lessonName: '', lessonTeacherID: '', departmentID: '', semesterNo: '' });
    const [lessonStatus, setLessonStatus] = useState({ message: '', error: '' });

    const handleUserChange = (e) => setUserForm({ ...userForm, [e.target.name]: e.target.value });
    const handleLessonChange = (e) => setLessonForm({ ...lessonForm, [e.target.name]: e.target.value });

    const closeModal = () => {
        setActiveModal(null);
        setUserStatus({ message: '', error: '' });
        setLessonStatus({ message: '', error: '' });
    };

    // --- ÇIKIŞ YAPMA İŞLEMİ ---
    const handleLogout = async () => {
        try {
            // Backend'deki logout rotasına istek at (Token'ı veritabanında isRevoked = 1 yapar)
            await api.post('/users/logout');
        } catch (error) {
            console.error("Çıkış işlemi sırasında sunucu hatası:", error);
        } finally {
            // Sunucu hata verse bile tarayıcıdaki oturum bilgilerini sil ve anasayfaya dön
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/'); // Giriş sayfasına (Login) yönlendir
        }
    };

    // --- FORM GÖNDERME İŞLEMLERİ ---
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setUserStatus({ message: '', error: '' });
        try {
            const response = await api.post('/users/', {
                ...userForm,
                departmentID: Number(userForm.departmentID),
                active: true
            });
            setUserStatus({ message: `✅ Kullanıcı eklendi! ID: ${response.data.data.id}`, error: '' });
            setUserForm({ fullName: '', email: '', password: '', phoneNo: '', departmentID: '' });
        } catch (err) {
            setUserStatus({ message: '', error: err.response?.data?.message || 'Kullanıcı eklenirken hata oluştu.' });
        }
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        setLessonStatus({ message: '', error: '' });
        try {
            await api.post('/lessons/', {
                lessonName: lessonForm.lessonName,
                lessonTeacherID: Number(lessonForm.lessonTeacherID),
                departmentID: Number(lessonForm.departmentID),
                semesterNo: Number(lessonForm.semesterNo)
            });
            setLessonStatus({ message: '✅ Ders başarıyla eklendi!', error: '' });
            setLessonForm({ lessonName: '', lessonTeacherID: '', departmentID: '', semesterNo: '' });
        } catch (err) {
            setLessonStatus({ message: '', error: err.response?.data?.message || 'Ders eklenirken hata oluştu.' });
        }
    };

    return (
        <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#f4f7f6', position: 'absolute', top: 0, left: 0 }}>

            {/* SAĞ ÜST KÖŞEDEKİ ÇIKIŞ BUTONU */}
            <button className="logout-btn" onClick={handleLogout}>
                🚪 Çıkış Yap
            </button>

            <h1 style={{ textAlign: 'center', marginTop: '50px', color: '#333' }}>🛠️ Admin Paneli</h1>

            <div className="admin-dashboard">
                <button className="admin-menu-btn" onClick={() => setActiveModal('user')}>
                    ➕ Yeni Öğrenci Ekle
                </button>
                <button className="admin-menu-btn" onClick={() => setActiveModal('lesson')}>
                    📚 Yeni Ders Ekle
                </button>
            </div>

            {/* KULLANICI EKLEME MODALI */}
            {activeModal === 'user' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeModal}>✖</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Öğrenci Kayıt Formu</h2>

                        {userStatus.error && <div className="admin-msg-error">{userStatus.error}</div>}
                        {userStatus.message && <div className="admin-msg-success">{userStatus.message}</div>}

                        <form onSubmit={handleUserSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Ad Soyad</label>
                                <input type="text" name="fullName" value={userForm.fullName} onChange={handleUserChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Email</label>
                                <input type="email" name="email" value={userForm.email} onChange={handleUserChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Şifre</label>
                                <input type="password" name="password" value={userForm.password} onChange={handleUserChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Telefon No</label>
                                <input type="text" name="phoneNo" value={userForm.phoneNo} onChange={handleUserChange} className="admin-input" />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Departman ID</label>
                                <input type="number" name="departmentID" value={userForm.departmentID} onChange={handleUserChange} className="admin-input" required />
                            </div>
                            <button type="submit" className="admin-btn-blue">Kullanıcıyı Kaydet</button>
                        </form>
                    </div>
                </div>
            )}

            {/* DERS EKLEME MODALI */}
            {activeModal === 'lesson' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeModal}>✖</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Yeni Ders Kayıt Formu</h2>

                        {lessonStatus.error && <div className="admin-msg-error">{lessonStatus.error}</div>}
                        {lessonStatus.message && <div className="admin-msg-success">{lessonStatus.message}</div>}

                        <form onSubmit={handleLessonSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Ders Adı</label>
                                <input type="text" name="lessonName" value={lessonForm.lessonName} onChange={handleLessonChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Öğretmen ID</label>
                                <input type="number" name="lessonTeacherID" value={lessonForm.lessonTeacherID} onChange={handleLessonChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Departman ID</label>
                                <input type="number" name="departmentID" value={lessonForm.departmentID} onChange={handleLessonChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Dönem No (Semester)</label>
                                <input type="number" name="semesterNo" value={lessonForm.semesterNo} onChange={handleLessonChange} className="admin-input" required />
                            </div>
                            <button type="submit" className="admin-btn-green">Dersi Kaydet</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPanel;