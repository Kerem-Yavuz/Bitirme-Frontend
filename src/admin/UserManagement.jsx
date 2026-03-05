import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeftIcon, PlusIcon, EditIcon, TrashIcon } from '../icons';
import '../App.css';

const ALL_PRIVILEGES = ['Admin', 'Student', 'Teacher'];

function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);

    // Yeni kullanıcı ekleme modalı
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', phoneNo: '', departmentID: '', privileges: [] });
    const [addStatus, setAddStatus] = useState({ message: '', error: '' });

    // Kullanıcı detay/düzenleme modalı
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({ fullName: '', email: '', phoneNo: '', departmentID: '', active: true, privileges: [] });
    const [editLoading, setEditLoading] = useState(false);
    const [editStatus, setEditStatus] = useState({ message: '', error: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data || []);
        } catch (err) {
            console.error('Kullanıcılar yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.data || []);
        } catch (err) {
            console.error('Bölümler yüklenemedi:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    // ===== YENİ KULLANICI EKLEME =====
    const handleAddChange = (e) => setAddForm({ ...addForm, [e.target.name]: e.target.value });

    const handleAddPrivToggle = (priv) => {
        setAddForm(prev => ({
            ...prev,
            privileges: prev.privileges.includes(priv)
                ? prev.privileges.filter(p => p !== priv)
                : [...prev.privileges, priv]
        }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddStatus({ message: '', error: '' });
        try {
            const res = await api.post('/users/', {
                ...addForm,
                departmentID: Number(addForm.departmentID),
                active: true
            });
            setAddStatus({ message: `Kullanıcı eklendi! ID: ${res.data.data.id}`, error: '' });
            setAddForm({ fullName: '', email: '', password: '', phoneNo: '', departmentID: '', privileges: [] });
            fetchUsers();
        } catch (err) {
            setAddStatus({ message: '', error: err.response?.data?.message || 'Kullanıcı eklenirken hata oluştu.' });
        }
    };

    // ===== KULLANICI DETAY MODALI =====
    const openDetailModal = async (user) => {
        setDetailModalOpen(true);
        setIsEditing(false);
        setEditStatus({ message: '', error: '' });
        setEditLoading(true);

        try {
            const res = await api.get(`/users/${user.userID}`);
            const userData = res.data.data;
            setSelectedUser(userData);
            setEditForm({
                fullName: userData.fullName || '',
                email: userData.email || '',
                phoneNo: userData.phoneNo || '',
                departmentID: userData.departmentID || '',
                active: userData.active ?? true,
                privileges: userData.privileges || []
            });
        } catch (err) {
            console.error('Kullanıcı detayı yüklenemedi:', err);
            setSelectedUser(user);
            setEditForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNo: user.phoneNo || '',
                departmentID: user.departmentID || '',
                active: user.active ?? true,
                privileges: []
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

    const handleEditPrivToggle = (priv) => {
        setEditForm(prev => ({
            ...prev,
            privileges: prev.privileges.includes(priv)
                ? prev.privileges.filter(p => p !== priv)
                : [...prev.privileges, priv]
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditStatus({ message: '', error: '' });
        try {
            await api.put(`/users/${selectedUser.userID}`, {
                fullName: editForm.fullName,
                email: editForm.email,
                phoneNo: editForm.phoneNo,
                departmentID: Number(editForm.departmentID),
                active: editForm.active,
                privileges: editForm.privileges
            });
            setEditStatus({ message: 'Kullanıcı başarıyla güncellendi!', error: '' });
            setIsEditing(false);
            fetchUsers();
        } catch (err) {
            setEditStatus({ message: '', error: err.response?.data?.message || 'Güncelleme başarısız.' });
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        if (!window.confirm(`"${selectedUser.fullName || selectedUser.userID}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
        try {
            await api.delete(`/users/${selectedUser.userID}`);
            setDetailModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            setEditStatus({ message: '', error: err.response?.data?.message || 'Kullanıcı silinemedi.' });
        }
    };

    const getDepartmentName = (id) => {
        const dept = departments.find(d => d.departmentID === id);
        return dept ? dept.departmentName : '-';
    };

    const getPrivBadgeStyle = (priv) => {
        const styles = {
            Admin: { backgroundColor: '#ffeaa7', color: '#d68910' },
            Teacher: { backgroundColor: '#d4edda', color: '#155724' },
            Student: { backgroundColor: '#d6eaf8', color: '#1b4f72' }
        };
        return {
            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
            ...(styles[priv] || { backgroundColor: '#eee', color: '#666' })
        };
    };

    return (
        <div style={{ width: '100%', padding: '30px', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
            {/* Üst Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <button onClick={() => navigate('/admin-panel')} className="back-link">
                        <ChevronLeftIcon size={14} /> Admin Paneli
                    </button>
                    <h2 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>Kullanıcı Yönetimi</h2>
                </div>
                <button
                    onClick={() => { setAddModalOpen(true); setAddStatus({ message: '', error: '' }); }}
                    className="admin-btn-blue"
                    style={{ width: 'auto', padding: '10px 24px', marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                    <PlusIcon size={16} /> Yeni Kullanıcı Ekle
                </button>
            </div>

            {/* Tablo */}
            {loading ? (
                <p style={{ textAlign: 'center', color: '#888' }}>Yükleniyor...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Ad Soyad</th>
                                <th>Email</th>
                                <th>Telefon</th>
                                <th>Bölüm</th>
                                <th style={{ textAlign: 'center' }}>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map(u => (
                                <tr
                                    key={u.userID}
                                    onClick={() => openDetailModal(u)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{u.userID}</td>
                                    <td style={{ fontWeight: '600' }}>{u.fullName || '-'}</td>
                                    <td>{u.email || '-'}</td>
                                    <td>{u.phoneNo || '-'}</td>
                                    <td>{getDepartmentName(u.departmentID)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`status-badge ${u.active ? 'status-active' : 'status-inactive'}`}>
                                            {u.active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Kayıtlı kullanıcı bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== KULLANICI DETAY / DÜZENLEME MODALI ===== */}
            {detailModalOpen && (
                <div className="modal-overlay" onClick={() => setDetailModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <button className="close-btn" onClick={() => setDetailModalOpen(false)}>×</button>

                        {editLoading ? (
                            <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</p>
                        ) : selectedUser ? (
                            <>
                                {/* Header */}
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '60px', height: '60px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #8f2b3a 0%, #6b1d2b 100%)',
                                        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '24px', fontWeight: 'bold', margin: '0 auto 10px auto'
                                    }}>
                                        {(selectedUser.fullName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <h2 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>
                                        {selectedUser.fullName || `Kullanıcı #${selectedUser.userID}`}
                                    </h2>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {(editForm.privileges || []).map((priv, i) => (
                                            <span key={i} style={getPrivBadgeStyle(priv)}>{priv}</span>
                                        ))}
                                    </div>
                                    <p style={{ color: '#95a5a6', fontSize: '13px', margin: '6px 0 0 0' }}>ID: {selectedUser.userID}</p>
                                </div>

                                {editStatus.error && <div className="admin-msg-error">{editStatus.error}</div>}
                                {editStatus.message && <div className="admin-msg-success">{editStatus.message}</div>}

                                {isEditing ? (
                                    /* ===== DÜZENLEME MODU ===== */
                                    <form onSubmit={handleEditSubmit}>
                                        <div className="admin-form-group">
                                            <label className="admin-label">Ad Soyad</label>
                                            <input type="text" name="fullName" value={editForm.fullName} onChange={handleEditChange} className="admin-input" required />
                                        </div>
                                        <div className="admin-form-group">
                                            <label className="admin-label">Email</label>
                                            <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className="admin-input" required />
                                        </div>
                                        <div className="admin-form-group">
                                            <label className="admin-label">Telefon No</label>
                                            <input type="text" name="phoneNo" value={editForm.phoneNo} onChange={handleEditChange} className="admin-input" />
                                        </div>
                                        <div className="admin-form-group">
                                            <label className="admin-label">Bölüm</label>
                                            <select name="departmentID" value={editForm.departmentID} onChange={handleEditChange} className="admin-input">
                                                <option value="">Bölüm Seçin</option>
                                                {departments.map(d => (
                                                    <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="admin-form-group">
                                            <label className="admin-label">Durum</label>
                                            <select name="active" value={editForm.active ? 'true' : 'false'} onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'true' })} className="admin-input">
                                                <option value="true">Aktif</option>
                                                <option value="false">Pasif</option>
                                            </select>
                                        </div>
                                        <div className="admin-form-group">
                                            <label className="admin-label">Yetkiler</label>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                {ALL_PRIVILEGES.map(priv => (
                                                    <label key={priv} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px', color: '#333' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={editForm.privileges.includes(priv)}
                                                            onChange={() => handleEditPrivToggle(priv)}
                                                        />
                                                        {priv}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button type="submit" className="admin-btn-blue" style={{ flex: 1 }}>Kaydet</button>
                                            <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                                                İptal
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* ===== GÖRÜNTÜLEME MODU ===== */
                                    <>
                                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px', marginBottom: '15px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 12px', fontSize: '14px' }}>
                                                <span style={{ color: '#868e96', fontWeight: '600' }}>Ad Soyad</span>
                                                <span style={{ color: '#2c3e50' }}>{editForm.fullName || '-'}</span>

                                                <span style={{ color: '#868e96', fontWeight: '600' }}>Email</span>
                                                <span style={{ color: '#2c3e50' }}>{editForm.email || '-'}</span>

                                                <span style={{ color: '#868e96', fontWeight: '600' }}>Telefon</span>
                                                <span style={{ color: '#2c3e50' }}>{editForm.phoneNo || '-'}</span>

                                                <span style={{ color: '#868e96', fontWeight: '600' }}>Bölüm</span>
                                                <span style={{ color: '#2c3e50' }}>{getDepartmentName(editForm.departmentID)}</span>

                                                <span style={{ color: '#868e96', fontWeight: '600' }}>Durum</span>
                                                <span>
                                                    <span className={`status-badge ${editForm.active ? 'status-active' : 'status-inactive'}`}>
                                                        {editForm.active ? 'Aktif' : 'Pasif'}
                                                    </span>
                                                </span>

                                                <span style={{ color: '#868e96', fontWeight: '600' }}>Yetkiler</span>
                                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                    {editForm.privileges.length > 0
                                                        ? editForm.privileges.map((p, i) => <span key={i} style={getPrivBadgeStyle(p)}>{p}</span>)
                                                        : <span style={{ color: '#adb5bd' }}>Yetki yok</span>
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => { setIsEditing(true); setEditStatus({ message: '', error: '' }); }}
                                                className="admin-btn-blue"
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                            >
                                                <EditIcon size={16} /> Düzenle
                                            </button>
                                            <button
                                                onClick={handleDeleteUser}
                                                style={{
                                                    padding: '12px 20px', backgroundColor: '#dc3545', color: 'white',
                                                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                                                    fontWeight: 'bold', fontSize: '15px',
                                                    display: 'flex', alignItems: 'center', gap: '6px'
                                                }}
                                            >
                                                <TrashIcon size={16} /> Sil
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {/* ===== YENİ KULLANICI EKLEME MODALI ===== */}
            {addModalOpen && (
                <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setAddModalOpen(false)}>×</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Yeni Kullanıcı Ekle</h2>

                        {addStatus.error && <div className="admin-msg-error">{addStatus.error}</div>}
                        {addStatus.message && <div className="admin-msg-success">{addStatus.message}</div>}

                        <form onSubmit={handleAddSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Ad Soyad</label>
                                <input type="text" name="fullName" value={addForm.fullName} onChange={handleAddChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Email</label>
                                <input type="email" name="email" value={addForm.email} onChange={handleAddChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Şifre</label>
                                <input type="password" name="password" value={addForm.password} onChange={handleAddChange} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Telefon No</label>
                                <input type="text" name="phoneNo" value={addForm.phoneNo} onChange={handleAddChange} className="admin-input" />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Bölüm</label>
                                <select name="departmentID" value={addForm.departmentID} onChange={handleAddChange} className="admin-input" required>
                                    <option value="">Bölüm Seçin</option>
                                    {departments.map(d => (
                                        <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Yetkiler</label>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {ALL_PRIVILEGES.map(priv => (
                                        <label key={priv} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px', color: '#333' }}>
                                            <input
                                                type="checkbox"
                                                checked={addForm.privileges.includes(priv)}
                                                onChange={() => handleAddPrivToggle(priv)}
                                            />
                                            {priv}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="admin-btn-blue">Kullanıcıyı Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagement;
