import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api';
import { ClockIcon } from './icons';
import './App.css';

const GUNLER = ["", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function formatHour(hourStr) {
    if (!hourStr) return '-';
    const parts = hourStr.split(':');
    const h = parseInt(parts[0]);
    return `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`;
}

function DersProgrami() {
    const navigate = useNavigate();
    const { semesterId } = useParams();

    const [dersler, setDersler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState('');

    const [modalAcik, setModalAcik] = useState(false);
    const [seciliDers, setSeciliDers] = useState(null);
    const [seciliDersGruplari, setSeciliDersGruplari] = useState([]);
    const [gruplarYukleniyor, setGruplarYukleniyor] = useState(false);

    const [kayitliDersler, setKayitliDersler] = useState([]);

    // ==========================================
    // OTOMATİK TARİH VE DÖNEM KONTROLÜ
    // ==========================================
    const currentMonth = new Date().getMonth() + 1;
    const isSpring = currentMonth >= 2 && currentMonth <= 7;
    const availableSemesters = isSpring ? [2, 4, 6, 8] : [1, 3, 5, 7];

    useEffect(() => {
        if (semesterId && !availableSemesters.includes(Number(semesterId))) {
            navigate(`/ders-secimi/${availableSemesters[0]}`, { replace: true });
        }
    }, [semesterId, navigate, availableSemesters]);

    useEffect(() => {
        const kayitlilariGetir = async () => {
            try {
                const res = await api.get('/lessonGroups/my');
                if (res.data && res.data.status) {
                    setKayitliDersler(res.data.data || []);
                }
            } catch (err) {
                console.error('Kayıtlı dersler çekilemedi:', err);
            }
        };
        kayitlilariGetir();
    }, []);

    useEffect(() => {
        if (!semesterId || !availableSemesters.includes(Number(semesterId))) return;

        const dersleriGetir = async () => {
            setYukleniyor(true);
            setHata('');
            try {
                const response = await api.get('/lessons');
                if (response.data && response.data.status) {
                    const tumDersler = response.data.data;
                    const filtrelenmisDersler = tumDersler.filter(
                        (ders) => Number(ders.semesterNo) === Number(semesterId) && availableSemesters.includes(Number(ders.semesterNo))
                    );
                    setDersler(filtrelenmisDersler);
                }
                setYukleniyor(false);
            } catch (error) {
                console.error("Dersler çekilirken hata:", error);
                setHata("Ders listesi yüklenemedi. Lütfen bağlantınızı kontrol edin.");
                setYukleniyor(false);
            }
        };
        dersleriGetir();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [semesterId]);

    const handleDersTikla = async (ders, isLocked) => {
        // Eğer ders geçilmişse tıklanmasını engelle
        if (isLocked) return;

        setSeciliDers(ders);
        setModalAcik(true);
        setGruplarYukleniyor(true);
        setSeciliDersGruplari([]);

        try {
            const response = await api.get(`/lessonGroups?lessonID=${ders.lessonID}`);
            if (response.data && response.data.status) {
                setSeciliDersGruplari(response.data.data);
            }
            setGruplarYukleniyor(false);
        } catch (error) {
            console.error("Gruplar çekilirken hata:", error);
            setGruplarYukleniyor(false);
        }
    };

    const derseKayitOl = async (grup) => {
        try {
            const response = await api.post('/lessonGroups/register', {
                lessonGroupID: grup.lessonGroupID
            });

            if (response.data && response.data.status) {
                const res = await api.get('/lessonGroups/my');
                if (res.data && res.data.status) {
                    setKayitliDersler(res.data.data || []);
                }
            }
        } catch (error) {
            const mesaj = error.response?.data?.message || "Kayıt olurken bir hata oluştu veya zaten kayıtlısınız.";
            alert(mesaj);
        }
    };

    const derseCikisYap = async (grup) => {
        if (!window.confirm(`${seciliDers?.lessonName} dersini bırakmak istediğinize emin misiniz?`)) {
            return;
        }
        try {
            const response = await api.delete(`/lessonGroups/drop/${grup.lessonGroupID}`);

            if (response.data && response.data.status) {
                const res = await api.get('/lessonGroups/my');
                if (res.data && res.data.status) {
                    setKayitliDersler(res.data.data || []);
                }
            }
        } catch (error) {
            const mesaj = error.response?.data?.message || "Dersten çıkarken bir hata oluştu.";
            alert(mesaj);
        }
    };

    // ==========================================
    // NOT KONTROLÜ VE DERS DURUMU HESAPLAMA
    // ==========================================
    const getLessonStatus = (ders) => {
        // Öğrencinin geçmişte veya şimdi aldığı bu dersin kayıtlarını bul
        const records = kayitliDersler.filter(kd => kd.lessonID === ders.lessonID || kd.lessonName === ders.lessonName);

        if (records.length === 0) return { status: 'NEW', gradeText: '' };

        // Geçer notlar dışındakiler (Başarısız sayılan veya bekleyen notlar)
        const retakeGrades = ['FF', 'FD', 'DD', 'DC', 'PEND', null, ''];

        // Herhangi bir kayıtta dersi geçmiş mi kontrol et (Eğer grade var ve başarısız listesinde değilse geçmiştir)
        const passedRecord = records.find(r => r.grade && !retakeGrades.includes(r.grade.toUpperCase()));
        if (passedRecord) {
            return { status: 'PASSED', gradeText: `Geçildi (${passedRecord.grade})` };
        }

        // Şu an aktif olarak alıyor mu? (Not girilmemiş veya PEND)
        const pendingRecord = records.find(r => !r.grade || r.grade.toUpperCase() === 'PEND');
        if (pendingRecord) {
            return { status: 'TAKING', gradeText: 'Kayıtlı' };
        }

        // Geçememiş ama şu an da almıyor (Yani FF, FD, DD, DC almış, tekrar seçebilir)
        // En son aldığı notu göster
        const lastRecord = records[records.length - 1];
        return { status: 'RETAKE', gradeText: `Tekrar (${lastRecord.grade})` };
    };

    const kayitliIdler = kayitliDersler.map(d => d.lessonGroupID);

    if (yukleniyor) return <div className="ana-ekran merkez-ekran"><h2>Dersler Yükleniyor...</h2></div>;
    if (hata) return <div className="ana-ekran merkez-ekran hata-mesaji"><h2>{hata}</h2></div>;

    return (
        <div className="ana-ekran ders-secimi-ekrani" style={{ position: 'relative' }}>

            {/* YATAY DÖNEM MENÜSÜ */}
            <div className="yatay-donem-menusu">
                {availableSemesters.map(donem => (
                    <button
                        key={donem}
                        className={`donem-btn ${Number(semesterId) === donem ? 'aktif' : ''}`}
                        onClick={() => navigate(`/ders-secimi/${donem}`)}
                    >
                        {donem}. Dönem
                    </button>
                ))}
            </div>

            <h2 className="ders-secimi-baslik" style={{ marginTop: '70px' }}>
                {semesterId ? `${semesterId}. Dönem Açılan Dersler` : 'Açılan Dersler'}
            </h2>
            <p className="ders-secimi-aciklama">Alt gruplarını ve gün/saat detaylarını görmek istediğiniz dersin üzerine tıklayın.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', maxWidth: '1000px' }}>
                {dersler.length > 0 ? (
                    dersler.map((ders) => {
                        const statusInfo = getLessonStatus(ders);
                        const isLocked = statusInfo.status === 'PASSED';
                        const isRetake = statusInfo.status === 'RETAKE';

                        return (
                            <div
                                key={ders.lessonID}
                                onClick={() => handleDersTikla(ders, isLocked)}
                                style={{
                                    backgroundColor: isLocked ? '#f8f9fa' : 'white',
                                    padding: '25px',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    width: '250px',
                                    textAlign: 'center',
                                    borderTop: `6px solid ${isLocked ? '#2ecc71' : isRetake ? '#e74c3c' : '#3498db'}`,
                                    transition: 'transform 0.2s',
                                    opacity: isLocked ? 0.7 : 1
                                }}
                                onMouseOver={(e) => { if (!isLocked) e.currentTarget.style.transform = 'translateY(-5px)' }}
                                onMouseOut={(e) => { if (!isLocked) e.currentTarget.style.transform = 'translateY(0)' }}
                            >
                                <h3 style={{ margin: '0 0 10px 0', color: isLocked ? '#7f8c8d' : '#2c3e50' }}>{ders.lessonName}</h3>
                                <p style={{ margin: '0', fontSize: '13px', color: '#7f8c8d' }}>Bölüm: {ders.departmentName || '-'}</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#7f8c8d', fontWeight: 'bold' }}>{ders.semesterNo}. Dönem</p>

                                {/* NOT DURUMU GÖSTERGESİ */}
                                {statusInfo.gradeText && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        backgroundColor: isLocked ? '#e8f8f5' : isRetake ? '#fdedec' : '#ebf5fb',
                                        color: isLocked ? '#27ae60' : isRetake ? '#c0392b' : '#2980b9',
                                        display: 'inline-block'
                                    }}>
                                        {statusInfo.gradeText}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p style={{ color: '#888', fontSize: '16px', marginTop: '20px' }}>
                        Bu dönem için sistemde kayıtlı ders bulunmuyor.
                    </p>
                )}
            </div>

            {/* DERS SEÇİM MODALI */}
            {modalAcik && (
                <div className="modal-overlay" onClick={() => setModalAcik(false)}>
                    <div className="modal-icerik" style={{ width: '750px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: '0', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                            {seciliDers?.lessonName} — Grup Seçimi
                        </h3>

                        {gruplarYukleniyor ? (<p style={{ padding: '20px 0' }}>Gruplar aranıyor...</p>
                        ) : seciliDersGruplari.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="modern-table" style={{ marginTop: '15px', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Grup Adı</th>
                                            <th>Kontenjan</th>
                                            <th>Saatler</th>
                                            <th style={{ textAlign: 'center' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {seciliDersGruplari.map(grup => {
                                            const isSelected = kayitliIdler.includes(grup.lessonGroupID);
                                            const registeredRecord = kayitliDersler.find(kd => kd.lessonGroupID === grup.lessonGroupID);
                                            const hours = grup.hours || [];

                                            return (
                                                <tr key={grup.lessonGroupID} style={{
                                                    backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                                                    transition: 'background-color 0.3s'
                                                }}>
                                                    <td style={{ fontWeight: 'bold' }}>{grup.lessonGroupName}</td>
                                                    <td style={{ textAlign: 'center' }}>{grup.maxNumber || '-'}</td>
                                                    <td>
                                                        {hours.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                {hours.map((h, idx) => (
                                                                    <span key={idx} style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                        fontSize: '12px', backgroundColor: '#f1f3f5',
                                                                        padding: '3px 8px', borderRadius: '4px', color: '#495057'
                                                                    }}>
                                                                        <ClockIcon size={12} color="#868e96" />
                                                                        {GUNLER[h.day] || '?'} {formatHour(h.hour)}
                                                                        {h.room && <span style={{ color: '#868e96' }}>({h.room})</span>}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isSelected ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                                                <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
                                                                    ✓ Seçildi
                                                                </span>
                                                                {(!registeredRecord || !registeredRecord.grade || registeredRecord.grade.toUpperCase() === 'PEND') ? (
                                                                    <button 
                                                                        onClick={() => derseCikisYap(grup)}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#e74c3c',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '11px',
                                                                            fontWeight: 'bold',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                                                                    >
                                                                        Dersi Bırak
                                                                    </button>
                                                                ) : (
                                                                    <span style={{ fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' }}>
                                                                        Not: {registeredRecord.grade}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <button className="btn-kayit-ol" onClick={() => derseKayitOl(grup)}>
                                                                Seç ve Kaydol
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: '#e74c3c', margin: '30px 0', fontWeight: 'bold' }}>
                                Bu ders için henüz tanımlanmış bir grup/saat bulunmuyor.
                            </p>
                        )}

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button onClick={() => setModalAcik(false)} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DersProgrami;