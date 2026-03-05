import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeftIcon, PlusIcon, ClockIcon, TrashIcon } from '../icons';
import '../App.css';

const GUNLER = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAAT_OPTIONS = [
    "09:00:00", "10:00:00", "11:00:00", "12:00:00",
    "13:00:00", "14:00:00", "15:00:00", "16:00:00"
];

function formatHour(hourStr) {
    if (!hourStr) return '-';
    const parts = hourStr.split(':');
    const h = parseInt(parts[0]);
    return `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`;
}

function LessonManagement() {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [lessonGroups, setLessonGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);

    // Ders ekleme modal
    const [lessonModal, setLessonModal] = useState(false);
    const [lessonForm, setLessonForm] = useState({ lessonName: '', lessonTeacherID: '', departmentID: '', semesterNo: '' });
    const [lessonStatus, setLessonStatus] = useState({ message: '', error: '' });

    // Grup ekleme modal
    const [groupModal, setGroupModal] = useState(false);
    const [groupForm, setGroupForm] = useState({ lessonGroupName: '', maxNumber: '' });
    const [groupStatus, setGroupStatus] = useState({ message: '', error: '' });

    // Saat ekleme modal
    const [hourModal, setHourModal] = useState(false);
    const [hourForm, setHourForm] = useState({ hour: '', day: '', room: '' });
    const [hourStatus, setHourStatus] = useState({ message: '', error: '' });
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // Filtreler
    const [filterSemester, setFilterSemester] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

    const fetchLessons = async () => {
        try {
            const res = await api.get('/lessons');
            setLessons(res.data.data || []);
        } catch (err) {
            console.error('Dersler yüklenemedi:', err);
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
        fetchLessons();
        fetchDepartments();
    }, []);

    const fetchGroups = async (lessonID) => {
        setGroupsLoading(true);
        try {
            const res = await api.get(`/lessonGroups?lessonID=${lessonID}`);
            setLessonGroups(res.data.data || []);
        } catch (err) {
            console.error('Gruplar yüklenemedi:', err);
        } finally {
            setGroupsLoading(false);
        }
    };

    const toggleExpand = (lessonID) => {
        if (expandedLesson === lessonID) {
            setExpandedLesson(null);
            setLessonGroups([]);
        } else {
            setExpandedLesson(lessonID);
            fetchGroups(lessonID);
        }
    };

    const handleDeleteLesson = async (lessonID) => {
        if (!window.confirm('Bu dersi silmek istediğinize emin misiniz? Tüm grupları da silinecektir.')) return;
        try {
            await api.delete(`/lessons/${lessonID}`);
            setLessons(prev => prev.filter(l => l.lessonID !== lessonID));
            if (expandedLesson === lessonID) {
                setExpandedLesson(null);
                setLessonGroups([]);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Ders silinemedi.');
        }
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        setLessonStatus({ message: '', error: '' });
        try {
            await api.post('/lessons/', {
                lessonName: lessonForm.lessonName,
                lessonTeacherID: Number(lessonForm.lessonTeacherID) || null,
                departmentID: Number(lessonForm.departmentID),
                semesterNo: Number(lessonForm.semesterNo)
            });
            setLessonStatus({ message: 'Ders başarıyla eklendi!', error: '' });
            setLessonForm({ lessonName: '', lessonTeacherID: '', departmentID: '', semesterNo: '' });
            fetchLessons();
        } catch (err) {
            setLessonStatus({ message: '', error: err.response?.data?.message || 'Ders eklenirken hata oluştu.' });
        }
    };

    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        setGroupStatus({ message: '', error: '' });
        try {
            await api.post('/lessonGroups/', {
                lessonGroupName: groupForm.lessonGroupName,
                lessonID: expandedLesson,
                maxNumber: Number(groupForm.maxNumber) || null
            });
            setGroupStatus({ message: 'Grup başarıyla eklendi!', error: '' });
            setGroupForm({ lessonGroupName: '', maxNumber: '' });
            fetchGroups(expandedLesson);
        } catch (err) {
            setGroupStatus({ message: '', error: err.response?.data?.message || 'Grup eklenirken hata oluştu.' });
        }
    };

    const handleHourSubmit = async (e) => {
        e.preventDefault();
        setHourStatus({ message: '', error: '' });
        try {
            await api.post(`/lessonGroups/${selectedGroupId}/hours`, {
                hour: hourForm.hour,
                day: Number(hourForm.day),
                room: hourForm.room || null
            });
            setHourStatus({ message: 'Saat başarıyla eklendi!', error: '' });
            setHourForm({ hour: '', day: '', room: '' });
            fetchGroups(expandedLesson);
        } catch (err) {
            setHourStatus({ message: '', error: err.response?.data?.message || 'Saat eklenirken hata oluştu.' });
        }
    };

    const handleDeleteHour = async (hourID) => {
        if (!window.confirm('Bu saati silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/lessonGroups/hours/${hourID}`);
            fetchGroups(expandedLesson);
        } catch (err) {
            alert(err.response?.data?.message || 'Saat silinemedi.');
        }
    };

    const getDeptName = (id) => {
        const d = departments.find(dept => dept.departmentID === id);
        return d ? d.departmentName : '-';
    };

    const filteredLessons = lessons.filter(l => {
        if (filterSemester && Number(l.semesterNo) !== Number(filterSemester)) return false;
        if (filterDepartment && Number(l.departmentID) !== Number(filterDepartment)) return false;
        return true;
    });

    return (
        <div style={{ width: '100%', padding: '30px', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
            {/* Üst Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <button onClick={() => navigate('/admin-panel')} className="back-link">
                        <ChevronLeftIcon size={14} /> Admin Paneli
                    </button>
                    <h2 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>Ders Yönetimi</h2>
                </div>
                <button
                    onClick={() => { setLessonModal(true); setLessonStatus({ message: '', error: '' }); }}
                    className="admin-btn-green"
                    style={{ width: 'auto', padding: '10px 24px', marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                    <PlusIcon size={16} /> Yeni Ders Ekle
                </button>
            </div>

            {/* Filtreler */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="admin-input" style={{ width: '180px' }}>
                    <option value="">Tüm Dönemler</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}. Dönem</option>)}
                </select>
                <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="admin-input" style={{ width: '220px' }}>
                    <option value="">Tüm Bölümler</option>
                    {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
                </select>
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
                                <th>Ders Adı</th>
                                <th>Bölüm</th>
                                <th style={{ textAlign: 'center' }}>Dönem</th>
                                <th style={{ textAlign: 'center' }}>Öğretmen ID</th>
                                <th style={{ textAlign: 'center' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLessons.length > 0 ? filteredLessons.map(lesson => (
                                <React.Fragment key={lesson.lessonID}>
                                    <tr
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: expandedLesson === lesson.lessonID ? '#f0fdf4' : 'transparent'
                                        }}
                                        onClick={() => toggleExpand(lesson.lessonID)}
                                    >
                                        <td>{lesson.lessonID}</td>
                                        <td style={{ fontWeight: '600' }}>
                                            {expandedLesson === lesson.lessonID ? '▼' : '▶'} {lesson.lessonName}
                                        </td>
                                        <td>{getDeptName(lesson.departmentID)}</td>
                                        <td style={{ textAlign: 'center' }}>{lesson.semesterNo}</td>
                                        <td style={{ textAlign: 'center' }}>{lesson.lessonTeacherID || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.lessonID); }}
                                                className="btn-danger-sm"
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Genişletilmiş Grup Bölümü */}
                                    {expandedLesson === lesson.lessonID && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '0', backgroundColor: '#f8fffe' }}>
                                                <div style={{ padding: '15px 30px', borderLeft: '4px solid #27ae60' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <h4 style={{ margin: 0, color: '#2c3e50' }}>Ders Grupları</h4>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setGroupModal(true); setGroupStatus({ message: '', error: '' }); }}
                                                            className="btn-success-sm"
                                                        >
                                                            + Grup Ekle
                                                        </button>
                                                    </div>

                                                    {groupsLoading ? (
                                                        <p style={{ color: '#888', fontSize: '14px' }}>Gruplar yükleniyor...</p>
                                                    ) : lessonGroups.length > 0 ? (
                                                        <table className="modern-table nested-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Grup Adı</th>
                                                                    <th style={{ textAlign: 'center' }}>Kontenjan</th>
                                                                    <th>Saatler</th>
                                                                    <th style={{ textAlign: 'center' }}>İşlem</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {lessonGroups.map(g => (
                                                                    <tr key={g.lessonGroupID}>
                                                                        <td style={{ fontWeight: '600' }}>{g.lessonGroupName}</td>
                                                                        <td style={{ textAlign: 'center' }}>{g.maxNumber || '-'}</td>
                                                                        <td>
                                                                            {g.hours && g.hours.length > 0 ? (
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                                    {g.hours.map((h) => (
                                                                                        <div key={h.hourID} style={{
                                                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                                            fontSize: '12px', backgroundColor: '#e9ecef',
                                                                                            padding: '3px 8px', borderRadius: '4px', color: '#495057'
                                                                                        }}>
                                                                                            <ClockIcon size={12} color="#868e96" />
                                                                                            {GUNLER[h.day] || '?'} {formatHour(h.hour)}
                                                                                            {h.room && <span style={{ color: '#868e96' }}>({h.room})</span>}
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteHour(h.hourID); }}
                                                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex' }}
                                                                                                title="Saati sil"
                                                                                            >
                                                                                                <TrashIcon size={12} color="#e74c3c" />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : <span style={{ color: '#adb5bd', fontSize: '13px' }}>Saat tanımlanmamış</span>}
                                                                        </td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedGroupId(g.lessonGroupID);
                                                                                    setHourModal(true);
                                                                                    setHourStatus({ message: '', error: '' });
                                                                                    setHourForm({ hour: '', day: '', room: '' });
                                                                                }}
                                                                                className="btn-success-sm"
                                                                            >
                                                                                + Saat
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p style={{ color: '#e74c3c', fontSize: '14px' }}>Bu ders için henüz grup tanımlanmamış.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                        {lessons.length === 0 ? 'Kayıtlı ders bulunamadı.' : 'Filtre sonucu ders bulunamadı.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Ders Ekleme Modalı */}
            {lessonModal && (
                <div className="modal-overlay" onClick={() => setLessonModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setLessonModal(false)}>×</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Yeni Ders Ekle</h2>

                        {lessonStatus.error && <div className="admin-msg-error">{lessonStatus.error}</div>}
                        {lessonStatus.message && <div className="admin-msg-success">{lessonStatus.message}</div>}

                        <form onSubmit={handleLessonSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Ders Adı</label>
                                <input type="text" value={lessonForm.lessonName} onChange={(e) => setLessonForm({ ...lessonForm, lessonName: e.target.value })} className="admin-input" required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Öğretmen ID</label>
                                <input type="number" value={lessonForm.lessonTeacherID} onChange={(e) => setLessonForm({ ...lessonForm, lessonTeacherID: e.target.value })} className="admin-input" />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Bölüm</label>
                                <select value={lessonForm.departmentID} onChange={(e) => setLessonForm({ ...lessonForm, departmentID: e.target.value })} className="admin-input" required>
                                    <option value="">Bölüm Seçin</option>
                                    {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Dönem No</label>
                                <select value={lessonForm.semesterNo} onChange={(e) => setLessonForm({ ...lessonForm, semesterNo: e.target.value })} className="admin-input" required>
                                    <option value="">Dönem Seçin</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}. Dönem</option>)}
                                </select>
                            </div>
                            <button type="submit" className="admin-btn-green">Dersi Kaydet</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Grup Ekleme Modalı */}
            {groupModal && (
                <div className="modal-overlay" onClick={() => setGroupModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setGroupModal(false)}>×</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Yeni Grup Ekle</h2>

                        {groupStatus.error && <div className="admin-msg-error">{groupStatus.error}</div>}
                        {groupStatus.message && <div className="admin-msg-success">{groupStatus.message}</div>}

                        <form onSubmit={handleGroupSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Grup Adı</label>
                                <input type="text" value={groupForm.lessonGroupName} onChange={(e) => setGroupForm({ ...groupForm, lessonGroupName: e.target.value })} className="admin-input" required placeholder="ör: A Grubu" />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Kontenjan</label>
                                <input type="number" value={groupForm.maxNumber} onChange={(e) => setGroupForm({ ...groupForm, maxNumber: e.target.value })} className="admin-input" placeholder="ör: 40" />
                            </div>
                            <button type="submit" className="admin-btn-green">Grubu Kaydet</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Saat Ekleme Modalı */}
            {hourModal && (
                <div className="modal-overlay" onClick={() => setHourModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="close-btn" onClick={() => setHourModal(false)}>×</button>
                        <h2 className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>Saat Ekle</h2>

                        {hourStatus.error && <div className="admin-msg-error">{hourStatus.error}</div>}
                        {hourStatus.message && <div className="admin-msg-success">{hourStatus.message}</div>}

                        <form onSubmit={handleHourSubmit}>
                            <div className="admin-form-group">
                                <label className="admin-label">Gün</label>
                                <select value={hourForm.day} onChange={(e) => setHourForm({ ...hourForm, day: e.target.value })} className="admin-input" required>
                                    <option value="">Gün Seçin</option>
                                    {GUNLER.slice(1).map((g, i) => <option key={i + 1} value={i + 1}>{g}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Saat</label>
                                <select value={hourForm.hour} onChange={(e) => setHourForm({ ...hourForm, hour: e.target.value })} className="admin-input" required>
                                    <option value="">Saat Seçin</option>
                                    {SAAT_OPTIONS.map(k => <option key={k} value={k}>{formatHour(k)}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Derslik / Oda</label>
                                <input type="text" value={hourForm.room} onChange={(e) => setHourForm({ ...hourForm, room: e.target.value })} className="admin-input" placeholder="ör: B-201" />
                            </div>
                            <button type="submit" className="admin-btn-green">Saati Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LessonManagement;
