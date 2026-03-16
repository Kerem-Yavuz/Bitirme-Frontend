import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeftIcon, PlusIcon } from '../icons';
import '../App.css';

function DepartmentManagement() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ departmentName: '' });
    const [status, setStatus] = useState({ message: '', error: '' });
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.data || []);
        } catch (err) {
            console.error('Bölümler yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ message: '', error: '' });
        try {
            await api.post('/departments/', { departmentName: form.departmentName });
            setStatus({ message: 'Bölüm başarıyla eklendi!', error: '' });
            setForm({ departmentName: '' });
            fetchDepartments();
        } catch (err) {
            setStatus({ message: '', error: err.response?.data?.message || 'Bölüm eklenirken hata oluştu.' });
        }
    };

    const startEdit = (dept) => {
        setEditingId(dept.departmentID);
        setEditName(dept.departmentName);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (id) => {
        try {
            await api.put(`/departments/${id}`, { departmentName: editName });
            setEditingId(null);
            setEditName('');
            fetchDepartments();
        } catch (err) {
            alert(err.response?.data?.message || 'Güncelleme başarısız.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu bölümü silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/departments/${id}`);
            setDepartments(prev => prev.filter(d => d.departmentID !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Bölüm silinemedi.');
        }
    };

    return (
        <div style={{ width: '100%', padding: '30px', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
            {/* Üst Bar - Sadece Başlık Var */}
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => navigate('/admin-panel')} className="back-link" style={{ marginBottom: '10px' }}>
                    <ChevronLeftIcon size={14} /> Admin Paneli
                </button>
                <h2 style={{ margin: '0', color: '#2c3e50' }}>Bölüm Yönetimi</h2>
            </div>

            {/* Yeni Bölüm Ekle Butonu - Alt Satıra Alındı */}
            <div style={{ marginBottom: '25px' }}>
                <button
                    onClick={() => { setModalOpen(true); setStatus({ message: '', error: '' }); }}
                    style={{ padding: '10px 24px', backgroundColor: '#8f2b3a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                    <PlusIcon size={16} /> Yeni Bölüm Ekle
                </button>
            </div>

            {/* Tablo */}
            {loading ? (
                <p style={{ textAlign: 'center', color: '#888' }}>Yükleniyor...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table" style={{ maxWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Bölüm Adı</th>
                                <th style={{ textAlign: 'center', width: '180px' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.length > 0 ? departments.map(d => (
                                <tr key={d.departmentID}>
                                    <td>{d.departmentID}</td>
                                    <td>
                                        {editingId === d.departmentID ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="admin-input"
                                                style={{ margin: 0, padding: '6px 10px' }}
                                                autoFocus
                                            />
                                        ) : (
                                            <span style={{ fontWeight: '600' }}>{d.departmentName}</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {editingId === d.departmentID ? (
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button onClick={() => saveEdit(d.departmentID)} className="btn-success-sm">
                                                    Kaydet
                                                </button>
                                                <button onClick={cancelEdit} className="btn-secondary-sm">
                                                    İptal
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button onClick={() => startEdit(d)} className="btn-warning-sm">
                                                    Düzenle
                                                </button>
                                                <button onClick={() => handleDelete(d.departmentID)} className="btn-danger-sm">
                                                    Sil
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Kayıtlı bölüm bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bölüm Ekleme Modalı */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Yeni Bölüm Ekle</h2>

                        {status.error && <div className="admin-msg-error">{status.error}</div>}
                        {status.message && <div className="admin-msg-success">{status.message}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Bölüm Adı</label>
                                <input type="text" value={form.departmentName} onChange={(e) => setForm({ departmentName: e.target.value })} className="admin-input" required placeholder="ör: Bilgisayar Mühendisliği" />
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#8f2b3a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                                Bölümü Kaydet
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DepartmentManagement;