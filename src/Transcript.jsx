import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './App.css';

function Transcript() {
    const navigate = useNavigate();
    const [transcript, setTranscript] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        const userObj = JSON.parse(storedUser);

        const fetchTranscript = async () => {
            try {
                const res = await api.get(`/users/${userObj.id}/transcript`);
                if (res.data && res.data.status) {
                    setTranscript(res.data.data);
                } else {
                    setError('Transkript alınamadı.');
                }
            } catch (err) {
                console.error('Transkript hatası:', err);
                setError('Transkript bilgileri yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };

        fetchTranscript();
    }, [navigate]);

    if (loading) {
        return (
            <div className="profil-container">
                <p style={{ color: '#888' }}>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="profil-container" style={{ maxWidth: '800px' }}>
            <div className="profil-kart" style={{ width: '100%', padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2d3436' }}>Tüm Derslerim (Transkript)</h2>
                {error && <div className="admin-msg-error" style={{ marginBottom: '15px' }}>{error}</div>}
                
                {Object.keys(transcript).length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#636e72' }}>Henüz alınmış bir ders bulunmamaktadır.</p>
                ) : (
                    Object.keys(transcript).sort((a, b) => parseInt(a) - parseInt(b)).map((semester) => (
                        <div key={semester} style={{ marginBottom: '25px' }}>
                            <h3 style={{ borderBottom: '2px solid #6c5ce7', paddingBottom: '8px', marginBottom: '15px', color: '#6c5ce7', fontSize: '18px' }}>
                                {semester}. Dönem
                            </h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f2f6', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', color: '#2d3436' }}>Ders Kodu</th>
                                        <th style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', color: '#2d3436' }}>Ders Adı</th>
                                        <th style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', color: '#2d3436' }}>Harf Notu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transcript[semester].map((course, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px 15px', color: '#636e72' }}>{course.lessonID}</td>
                                            <td style={{ padding: '12px 15px', color: '#636e72', fontWeight: '500' }}>{course.lessonName}</td>
                                            <td style={{ padding: '12px 15px', fontWeight: 'bold', color: course.grade ? '#0984e3' : '#b2bec3' }}>
                                                {course.grade || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                    <button onClick={() => navigate('/anasayfa')} className="btn-geri">
                        ← Anasayfaya Dön
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Transcript;
