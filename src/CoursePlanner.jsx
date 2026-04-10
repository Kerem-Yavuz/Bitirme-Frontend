import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAATLER = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const RENK_PALETI = [
    '#2980b9', '#8e44ad', '#16a085', '#d35400', '#c0392b',
    '#2c3e50', '#27ae60', '#e67e22', '#1abc9c', '#9b59b6',
    '#34495e', '#e74c3c', '#3498db', '#f39c12', '#2ecc71'
];

function stringToColorIndex(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % RENK_PALETI.length;
}

function saatToRowIndex(hourStr) {
    if (!hourStr) return -1;
    const parts = hourStr.split(':');
    return parseInt(parts[0]) - 9;
}

function CoursePlanner() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);

    // Data
    const [lessons, setLessons] = useState([]);
    const [enrolledGroups, setEnrolledGroups] = useState([]);
    const [groupsByLesson, setGroupsByLesson] = useState({});

    // UI state
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [plannedGroups, setPlannedGroups] = useState([]);
    const [conflicts, setConflicts] = useState([]);

    // Semester
    const currentMonth = new Date().getMonth() + 1;
    const isSpring = currentMonth >= 2 && currentMonth <= 7;
    const availableSemesters = isSpring ? [2, 4, 6, 8] : [1, 3, 5, 7];
    const [activeSemester, setActiveSemester] = useState(availableSemesters[0]);

    // ── Fetch data ──
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) { navigate('/'); return; }
        fetchData();
    }, [activeSemester]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lessonsRes, myGroupsRes] = await Promise.all([
                api.get(`/lessons?semesterNo=${activeSemester}`),
                api.get('/lessonGroups/my')
            ]);

            const fetchedLessons = lessonsRes.data?.data || [];
            const myGroups = myGroupsRes.data?.data || [];

            setLessons(fetchedLessons);
            setEnrolledGroups(myGroups);
            setPlannedGroups([]);
            setConflicts([]);
            setExpandedLesson(null);

        } catch (err) {
            console.error("Veri çekilirken hata:", err);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch groups when a lesson is expanded ──
    const toggleLesson = async (lessonID) => {
        if (expandedLesson === lessonID) {
            setExpandedLesson(null);
            return;
        }
        setExpandedLesson(lessonID);

        if (!groupsByLesson[lessonID]) {
            try {
                const res = await api.get(`/lessonGroups?lessonID=${lessonID}`);
                const groups = res.data?.data || [];
                setGroupsByLesson(prev => ({ ...prev, [lessonID]: groups }));
            } catch (err) {
                console.error("Grup bilgisi çekilemedi:", err);
            }
        }
    };

    // ── Build timetable data ──
    const buildTimetable = () => {
        const cells = {};

        // 1. Enrolled courses (green)
        enrolledGroups
            .filter(g => {
                // Only show current season's courses
                return availableSemesters.includes(Number(g.semesterNo));
            })
            .forEach(grup => {
                const name = grup.lessonName || "?";
                const renkIdx = stringToColorIndex(name);
                const shortGroup = grup.lessonGroupName?.split(' (')[0] || '';

                (grup.hours || []).forEach(h => {
                    if (h.day != null && h.hour != null) {
                        const col = h.day - 1;
                        const row = saatToRowIndex(h.hour);
                        if (col >= 0 && row >= 0 && row < SAATLER.length) {
                            cells[`${col}-${row}`] = {
                                ad: name,
                                grupAdi: shortGroup,
                                oda: h.room || '',
                                renk: RENK_PALETI[renkIdx],
                                type: 'enrolled'
                            };
                        }
                    }
                });
            });

        // 2. Planned courses (blue preview)
        plannedGroups.forEach(grup => {
            const name = grup.lessonName || "?";
            const shortGroup = grup.lessonGroupName?.split(' (')[0] || '';

            (grup.hours || []).forEach(h => {
                if (h.day != null && h.hour != null) {
                    const col = h.day - 1;
                    const row = saatToRowIndex(h.hour);
                    if (col >= 0 && row >= 0 && row < SAATLER.length) {
                        const key = `${col}-${row}`;
                        const existing = cells[key];
                        if (existing) {
                            // Conflict!
                            cells[key] = {
                                ...existing,
                                conflict: true,
                                conflictWith: `${name} (${shortGroup})`
                            };
                        } else {
                            cells[key] = {
                                ad: name,
                                grupAdi: shortGroup,
                                oda: h.room || '',
                                renk: '#3498db',
                                type: 'planned'
                            };
                        }
                    }
                }
            });
        });

        return cells;
    };

    // ── Conflict detection ──
    const detectConflicts = (group) => {
        const conflictList = [];
        const allOccupied = [];

        // Collect all occupied slots from enrolled + planned
        [...enrolledGroups, ...plannedGroups].forEach(g => {
            (g.hours || []).forEach(h => {
                if (h.day != null && h.hour != null) {
                    allOccupied.push({
                        day: h.day,
                        hour: h.hour,
                        name: g.lessonName,
                        groupName: g.lessonGroupName
                    });
                }
            });
        });

        (group.hours || []).forEach(h => {
            if (h.day != null && h.hour != null) {
                const match = allOccupied.find(o => o.day === h.day && o.hour === h.hour);
                if (match) {
                    conflictList.push(`${GUNLER[h.day - 1]} ${h.hour} → ${match.name} ile çakışıyor`);
                }
            }
        });

        return conflictList;
    };

    // ── Toggle a group in/out of plan ──
    const toggleGroupPlan = (group, lesson) => {
        const isPlanned = plannedGroups.some(g => g.lessonGroupID === group.lessonGroupID);

        if (isPlanned) {
            setPlannedGroups(prev => prev.filter(g => g.lessonGroupID !== group.lessonGroupID));
            setConflicts([]);
        } else {
            // Remove any other group from the same lesson
            const withoutSameLesson = plannedGroups.filter(g => g.lessonID !== group.lessonID);

            const enriched = { ...group, lessonName: lesson.lessonName };
            const newConflicts = detectConflicts(enriched);
            setConflicts(newConflicts);

            setPlannedGroups([...withoutSameLesson, enriched]);
        }
    };

    // ── Check if a group is already enrolled ──
    const isEnrolled = (lessonID) => {
        return enrolledGroups.some(g => g.lessonID === lessonID);
    };

    // ── Save all planned groups ──
    const saveSelections = async () => {
        if (plannedGroups.length === 0) return;
        if (conflicts.length > 0) {
            alert("Çakışmalar mevcut! Önce çakışmaları çözün.");
            return;
        }

        setSaving(true);
        setSaveMsg(null);
        let success = 0;
        let errors = [];

        for (const group of plannedGroups) {
            try {
                await api.post('/lessonGroups/register', {
                    lessonGroupID: group.lessonGroupID
                });
                success++;
            } catch (err) {
                errors.push(`${group.lessonName}: ${err.response?.data?.message || 'Hata'}`);
            }
        }

        if (errors.length === 0) {
            setSaveMsg({ type: 'success', text: `${success} ders başarıyla kaydedildi!` });
            setPlannedGroups([]);
            fetchData(); // refresh
        } else {
            setSaveMsg({ type: 'error', text: errors.join('; ') });
        }
        setSaving(false);
    };

    const timetable = buildTimetable();

    if (loading) {
        return (
            <div className="planner-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h2>Yükleniyor...</h2>
            </div>
        );
    }

    return (
        <div className="planner-container">
            {/* ── Header ── */}
            <div className="planner-header">
                <h2>📅 Ders Planlayıcı</h2>
                <div className="planner-semester-tabs">
                    {availableSemesters.map(s => (
                        <button
                            key={s}
                            className={`donem-btn ${activeSemester === s ? 'aktif' : ''}`}
                            onClick={() => setActiveSemester(s)}
                        >
                            {s}. Dönem
                        </button>
                    ))}
                </div>
            </div>

            <div className="planner-body">
                {/* ── Left Panel: Course List ── */}
                <div className="planner-sidebar">
                    <h3 className="planner-sidebar-title">📚 Dersler</h3>

                    {lessons.length === 0 && (
                        <p style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: '14px' }}>
                            Bu dönem için ders bulunamadı.
                        </p>
                    )}

                    {lessons.map(lesson => {
                        const enrolled = isEnrolled(lesson.lessonID);
                        const expanded = expandedLesson === lesson.lessonID;
                        const groups = groupsByLesson[lesson.lessonID] || [];

                        return (
                            <div key={lesson.lessonID} className="planner-lesson-card">
                                <div
                                    className={`planner-lesson-header ${expanded ? 'expanded' : ''} ${enrolled ? 'enrolled' : ''}`}
                                    onClick={() => toggleLesson(lesson.lessonID)}
                                >
                                    <span className="planner-lesson-name">
                                        {expanded ? '▾' : '▸'} {lesson.lessonName}
                                    </span>
                                    {enrolled && <span className="planner-badge enrolled-badge">Kayıtlı</span>}
                                </div>

                                {expanded && (
                                    <div className="planner-groups-list">
                                        {groups.length === 0 ? (
                                            <div className="planner-group-loading">Yükleniyor...</div>
                                        ) : (
                                            groups.map(group => {
                                                const isThisPlanned = plannedGroups.some(g => g.lessonGroupID === group.lessonGroupID);
                                                const isFull = group.enrolledCount >= group.maxNumber && group.maxNumber != null;
                                                const quota = group.maxNumber != null ? group.maxNumber : '∞';
                                                const enrolled_count = group.enrolledCount || 0;

                                                const hours = (group.hours || [])
                                                    .map(h => `${GUNLER[h.day - 1]?.slice(0, 3)} ${h.hour}`)
                                                    .join(', ');

                                                return (
                                                    <div
                                                        key={group.lessonGroupID}
                                                        className={`planner-group-item ${isThisPlanned ? 'planned' : ''} ${isFull ? 'full' : ''}`}
                                                        onClick={() => {
                                                            if (!isFull && !enrolled) {
                                                                toggleGroupPlan(group, lesson);
                                                            }
                                                        }}
                                                    >
                                                        <div className="planner-group-top">
                                                            <span className="planner-group-name">
                                                                {isThisPlanned ? '✓ ' : ''}{group.lessonGroupName}
                                                            </span>
                                                            <span className={`planner-quota ${isFull ? 'full' : ''}`}>
                                                                {isFull ? 'DOLU' : `${enrolled_count}/${quota}`}
                                                            </span>
                                                        </div>
                                                        {hours && (
                                                            <div className="planner-group-hours">{hours}</div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Right Panel: Timetable ── */}
                <div className="planner-timetable-area">
                    {/* Conflict warnings */}
                    {conflicts.length > 0 && (
                        <div className="planner-conflict-banner">
                            ⚠️ Çakışma tespit edildi:
                            {conflicts.map((c, i) => (
                                <div key={i} className="planner-conflict-item">• {c}</div>
                            ))}
                        </div>
                    )}

                    {/* Save message */}
                    {saveMsg && (
                        <div className={`planner-save-msg ${saveMsg.type}`}>
                            {saveMsg.text}
                        </div>
                    )}

                    {/* Timetable grid */}
                    <div className="planner-table-wrapper">
                        <table className="modern-table schedule-table planner-grid">
                            <thead>
                                <tr>
                                    <th>Saat</th>
                                    {GUNLER.map(g => <th key={g}>{g}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {SAATLER.map((saat, row) => (
                                    <tr key={row}>
                                        <td className="planner-hour-cell">
                                            {saat}-{String(parseInt(saat) + 1).padStart(2, '0')}:00
                                        </td>
                                        {GUNLER.map((_, col) => {
                                            const key = `${col}-${row}`;
                                            const cell = timetable[key];

                                            if (!cell) {
                                                return <td key={col} className="planner-empty-cell"></td>;
                                            }

                                            const isConflict = cell.conflict;
                                            const isPlanned = cell.type === 'planned';
                                            const isEnrolledCell = cell.type === 'enrolled';

                                            let cellClass = 'planner-filled-cell';
                                            if (isConflict) cellClass += ' conflict';
                                            else if (isPlanned) cellClass += ' planned';
                                            else if (isEnrolledCell) cellClass += ' enrolled';

                                            return (
                                                <td key={col} className={cellClass}>
                                                    <div
                                                        className="planner-cell-content"
                                                        style={{
                                                            backgroundColor: isConflict ? '#e74c3c' : cell.renk,
                                                        }}
                                                    >
                                                        <span className="planner-cell-name">{cell.ad}</span>
                                                        <span className="planner-cell-group">{cell.grupAdi}</span>
                                                        {cell.oda && <span className="planner-cell-room">{cell.oda}</span>}
                                                        {isConflict && (
                                                            <span className="planner-cell-conflict">⚡ ÇAKIŞMA</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend + Save */}
                    <div className="planner-footer">
                        <div className="planner-legend">
                            <span className="legend-item"><span className="legend-dot enrolled"></span> Kayıtlı</span>
                            <span className="legend-item"><span className="legend-dot planned"></span> Planlanan</span>
                            <span className="legend-item"><span className="legend-dot conflict"></span> Çakışma</span>
                        </div>

                        {plannedGroups.length > 0 && (
                            <button
                                className="planner-save-btn"
                                onClick={saveSelections}
                                disabled={saving || conflicts.length > 0}
                            >
                                {saving ? 'Kaydediliyor...' : `💾 ${plannedGroups.length} Dersi Kaydet`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CoursePlanner;
