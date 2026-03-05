import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import api from './api';
import { DownloadIcon } from './icons';
import './App.css';

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAATLER = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// Saat string'inden (HH:MM:SS veya HH:MM) satır indexi hesapla
function saatToRowIndex(hourStr) {
    if (!hourStr) return -1;
    const parts = hourStr.split(':');
    const saat = parseInt(parts[0]);
    return saat - 9; // 09:00 = index 0, 10:00 = index 1, ...
}

// Ders adına göre tutarlı renk üretme
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

function Anasayfa() {
    const [yerlesim, setYerlesim] = useState({});
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();
    const tabloRef = useRef(null);

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/');
            return;
        } else {
            setKullaniciAdi(JSON.parse(user).fullName);
        }

        const programiGetir = async () => {
            try {
                const myGroupsRes = await api.get('/lessonGroups/my');
                const dersGruplari = myGroupsRes.data?.data || [];

                const yeniYerlesim = {};

                dersGruplari.forEach((grup) => {
                    const hours = grup.hours || [];
                    const anaDersAdi = grup.lessonName || "Bilinmeyen Ders";
                    const kisaGrupAdi = grup.lessonGroupName.split(' (')[0];
                    const renkIndex = stringToColorIndex(anaDersAdi);

                    hours.forEach((h) => {
                        if (h.day !== null && h.day !== undefined && h.hour !== null) {
                            const colIndex = h.day - 1; // day 1-7 → col 0-6
                            const rowIndex = saatToRowIndex(h.hour);

                            if (colIndex >= 0 && rowIndex >= 0 && rowIndex < SAATLER.length) {
                                yeniYerlesim[`${colIndex}-${rowIndex}`] = {
                                    ad: anaDersAdi,
                                    grupAdi: kisaGrupAdi,
                                    oda: h.room || '',
                                    renk: RENK_PALETI[renkIndex]
                                };
                            }
                        }
                    });
                });

                setYerlesim(yeniYerlesim);
                setYukleniyor(false);

            } catch (error) {
                console.error("Program çekilirken hata oluştu:", error);
                setYukleniyor(false);
            }
        };

        programiGetir();
    }, [navigate]);

    const jpgIndir = async () => {
        const element = tabloRef.current;
        if (!element) return;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ecf0f1", useCORS: true });
        const data = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.href = data;
        link.download = `${kullaniciAdi}_ders_programi.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (yukleniyor) return <div className="anasayfa-container" style={{ justifyContent: 'center' }}><h2>Program Yükleniyor...</h2></div>;

    return (
        <div className="anasayfa-container">
            <div className="anasayfa-header">
                <h2>Merhaba, {kullaniciAdi} </h2>
                <p>İşte mevcut ders programın.</p>

                <div ref={tabloRef} className="tablo-wrapper" style={{ padding: '20px', backgroundColor: '#ecf0f1' }}>
                    <table className="modern-table schedule-table">
                        <thead>
                            <tr>
                                <th>Saat / Gün</th>
                                {GUNLER.map(g => <th key={g}>{g}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {SAATLER.map((saat, row) => (
                                <tr key={row}>
                                    <td style={{ fontWeight: 'bold', backgroundColor: '#f1f3f5', color: '#495057' }}>
                                        {saat}-{String(parseInt(saat) + 1).padStart(2, '0')}:00
                                    </td>
                                    {GUNLER.map((_, col) => {
                                        const key = `${col}-${row}`;
                                        const dersVerisi = yerlesim[key];

                                        return (
                                            <td key={col}>
                                                {dersVerisi && (
                                                    <div
                                                        className="yerlesmis-ders"
                                                        style={{
                                                            cursor: 'default',
                                                            backgroundColor: dersVerisi.renk,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            padding: '4px',
                                                            borderRadius: '5px'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '2px' }}>{dersVerisi.ad}</span>
                                                        <span style={{ fontSize: '11px', opacity: 0.9, fontStyle: 'italic' }}>{dersVerisi.grupAdi}</span>
                                                        {dersVerisi.oda && <span style={{ fontSize: '10px', opacity: 0.8 }}>{dersVerisi.oda}</span>}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button className="btn-jpg-indir" onClick={jpgIndir}>
                    <DownloadIcon size={18} color="white" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Programı JPG Olarak İndir
                </button>
            </div>
        </div>
    );
}

export default Anasayfa;