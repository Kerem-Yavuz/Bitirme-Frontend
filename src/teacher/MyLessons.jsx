import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeftIcon, ClockIcon, UsersIcon } from '../icons';
import '../App.css';

const GUNLER = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function formatHour(hourStr) {
    if (!hourStr) return '-';
    const parts = hourStr.split(':');
    const h = parseInt(parts[0]);
    return `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`;
}

function MyLessons() {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [lessonGroups, setLessonGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);

    useEffect(() => {
        const fetchMyLessons = async () => {
            try {
                const res = await api.get('/lessons/my-teaching');
                setLessons(res.data.data || []);
            } catch (err) {
                console.error('Dersler yüklenemedi:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyLessons();
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

    return (
        <div style={{ width: '100%', padding: '30px', boxSizing: 'border-box', overflowY: 'auto', height: '100%' }}>
            <div style={{ marginBottom: '25px' }}>
                <button onClick={() => navigate('/teacher-panel')} className="back-link">
                    <ChevronLeftIcon size={14} /> Öğretmen Paneli
                </button>
                <h2 style={{ margin: '5px 0 0 0', color: '#2c3e50' }}>Derslerim</h2>
                <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Size atanmış dersleri ve gruplarını görüntülüyorsunuz. Öğrenci listesi için gruba tıklayın.</p>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: '#888' }}>Yükleniyor...</p>
            ) : lessons.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Size atanmış ders bulunamadı.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Ders Adı</th>
                                <th>Bölüm</th>
                                <th style={{ textAlign: 'center' }}>Dönem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lessons.map(lesson => (
                                <React.Fragment key={lesson.lessonID}>
                                    <tr
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: expandedLesson === lesson.lessonID ? '#f0fdf4' : 'transparent'
                                        }}
                                        onClick={() => toggleExpand(lesson.lessonID)}
                                    >
                                        <td style={{ fontWeight: '600' }}>
                                            {expandedLesson === lesson.lessonID ? '▼' : '▶'} {lesson.lessonName}
                                        </td>
                                        <td>{lesson.departmentName || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>{lesson.semesterNo}. Dönem</td>
                                    </tr>

                                    {expandedLesson === lesson.lessonID && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '0', backgroundColor: '#f8fffe' }}>
                                                <div style={{ padding: '15px 30px', borderLeft: '4px solid #27ae60' }}>
                                                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Ders Grupları</h4>

                                                    {groupsLoading ? (
                                                        <p style={{ color: '#888', fontSize: '14px' }}>Gruplar yükleniyor...</p>
                                                    ) : lessonGroups.length > 0 ? (
                                                        <table className="modern-table nested-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Grup Adı</th>
                                                                    <th style={{ textAlign: 'center' }}>Kontenjan</th>
                                                                    <th>Saatler</th>
                                                                    <th style={{ textAlign: 'center' }}>Öğrenciler</th>
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
                                                                                        <span key={h.hourID} style={{
                                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                            fontSize: '12px', backgroundColor: '#e9ecef',
                                                                                            padding: '3px 8px', borderRadius: '4px', color: '#495057'
                                                                                        }}>
                                                                                            <ClockIcon size={12} color="#868e96" />
                                                                                            {GUNLER[h.day] || '?'} {formatHour(h.hour)}
                                                                                            {h.room && <span style={{ color: '#868e96' }}>({h.room})</span>}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : <span style={{ color: '#adb5bd', fontSize: '13px' }}>-</span>}
                                                                        </td>
                                                                        <td style={{ textAlign: 'center' }}>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigate(`/teacher-panel/students/${g.lessonGroupID}`);
                                                                                }}
                                                                                className="btn-success-sm"
                                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                            >
                                                                                <UsersIcon size={14} /> Listele
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p style={{ color: '#888', fontSize: '14px' }}>Bu ders için henüz grup tanımlanmamış.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default MyLessons;
