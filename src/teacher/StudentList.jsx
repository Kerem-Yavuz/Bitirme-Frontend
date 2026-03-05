import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { ChevronLeftIcon, DownloadIcon, CheckIcon } from '../icons';
import '../App.css';

function StudentList() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const [students, setStudents] = useState([]);
    const [groupInfo, setGroupInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingGrade, setEditingGrade] = useState(null);
    const [gradeValue, setGradeValue] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/lessonGroups/${groupId}/students`);
                if (res.data && res.data.status) {
                    setStudents(res.data.data.students || []);
                    setGroupInfo(res.data.data.groupInfo || null);
                }
            } catch (err) {
                console.error('Öğrenci listesi yüklenemedi:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [groupId]);

    const handleGradeSave = async (userId) => {
        setSaving(true);
        try {
            await api.put(`/lessonGroups/${groupId}/students/${userId}/grade`, {
                grade: gradeValue
            });
            // Listeyi güncelle
            setStudents(prev => prev.map(s =>
                s.userID === userId ? { ...s, grade: gradeValue } : s
            ));
            setEditingGrade(null);
            setGradeValue('');
        } catch (err) {
            alert(err.response?.data?.message || 'Not kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = () => {
        if (!students.length) return;
        const header = 'ID,Ad Soyad,Email,Not\n';
        const rows = students.map(s =>
            `${s.userID},"${s.fullName || '-'}","${s.email || '-'}","${s.grade || '-'}"`
        ).join('\n');

        const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ogrenci_listesi_grup_${groupId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ width: '100%', padding: '30px', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <button onClick={() => navigate('/teacher-panel/lessons')} className="back-link">
                        <ChevronLeftIcon size={14} /> Derslerim
                    </button>
                    <h2 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>
                        {groupInfo ? `${groupInfo.lessonName} — ${groupInfo.lessonGroupName}` : `Grup #${groupId}`}
                    </h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
                        Öğrenci listesi • {students.length} kayıtlı öğrenci
                    </p>
                </div>
                <button
                    onClick={exportCSV}
                    className="admin-btn-green"
                    style={{ width: 'auto', padding: '10px 20px', marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    disabled={students.length === 0}
                >
                    <DownloadIcon size={16} /> CSV İndir
                </button>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: '#888' }}>Yükleniyor...</p>
            ) : students.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Bu grupta kayıtlı öğrenci bulunamadı.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Ad Soyad</th>
                                <th>Email</th>
                                <th style={{ textAlign: 'center' }}>Not</th>
                                <th style={{ textAlign: 'center', width: '120px' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.userID}>
                                    <td>{s.userID}</td>
                                    <td style={{ fontWeight: '600' }}>{s.fullName || '-'}</td>
                                    <td>{s.email || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {editingGrade === s.userID ? (
                                            <input
                                                type="text"
                                                value={gradeValue}
                                                onChange={(e) => setGradeValue(e.target.value.toUpperCase())}
                                                className="admin-input"
                                                style={{ width: '70px', margin: 0, padding: '4px 8px', textAlign: 'center' }}
                                                maxLength={5}
                                                autoFocus
                                                placeholder="AA"
                                            />
                                        ) : (
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                backgroundColor: s.grade === 'PEND' ? '#fff3cd' : s.grade ? '#d4edda' : '#f1f3f5',
                                                color: s.grade === 'PEND' ? '#856404' : s.grade ? '#155724' : '#adb5bd'
                                            }}>
                                                {s.grade || '-'}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {editingGrade === s.userID ? (
                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleGradeSave(s.userID)}
                                                    className="btn-success-sm"
                                                    disabled={saving}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                >
                                                    <CheckIcon size={12} /> Kaydet
                                                </button>
                                                <button
                                                    onClick={() => { setEditingGrade(null); setGradeValue(''); }}
                                                    className="btn-secondary-sm"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingGrade(s.userID); setGradeValue(s.grade || ''); }}
                                                className="btn-warning-sm"
                                            >
                                                Not Ver
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default StudentList;
