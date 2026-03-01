import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api';
import './App.css';

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAAT_DILIMLERI = {
    "00:00:00": "09.00-10.00", "01:00:00": "10.00-11.00", "02:00:00": "11.00-12.00",
    "03:00:00": "12.00-13.00", "04:00:00": "13.00-14.00", "05:00:00": "14.00-15.00",
    "06:00:00": "15.00-16.00", "07:00:00": "16.00-17.00"
};

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

    // EKRANIN ANINDA TEPKİ VERMESİ İÇİN KAYITLI DERSLERİ STATE'TE TUTUYORUZ
    const [kayitliDersler, setKayitliDersler] = useState([]);

    // --- ZAMAN MANTIĞI VE DÖNEM BELİRLEME ---
    const currentMonth = new Date().getMonth() + 1;
    const isSpring = currentMonth >= 2 && currentMonth <= 6;
    const availableSemesters = isSpring ? [2, 4, 6, 8] : [1, 3, 5, 7];

    // Sayfa ilk açıldığında LocalStorage'dan mevcut dersleri çek
    useEffect(() => {
        try {
            const ls = JSON.parse(localStorage.getItem('benimDerslerim') || '[]');
            if (ls.length > 0 && typeof ls[0] === 'object') {
                setKayitliDersler(ls);
            } else if (ls.length > 0 && typeof ls[0] === 'number') {
                // Eski bozuk format kalmışsa temizle
                localStorage.removeItem('benimDerslerim');
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        const dersleriGetir = async () => {
            setYukleniyor(true);
            setHata('');
            try {
                const response = await api.get('/lessons');
                if (response.data && response.data.status) {
                    const tumDersler = response.data.data;
                    const filtrelenmisDersler = tumDersler.filter(
                        (ders) => Number(ders.semesterNo) === Number(semesterId)
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
    }, [semesterId]);

    const handleDersTikla = async (ders) => {
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
            let guncelDersler = [...kayitliDersler];
            const temelGrupAdi = grup.lessonGroupName.split(' (')[0];

            // 1. AYNI DERSİN BAŞKA BİR GRUBU VAR MI KONTROLÜ
            const baskaGrupVarMi = guncelDersler.find(
                d => d.lessonID === seciliDers.lessonID && d.temelGrupAdi !== temelGrupAdi
            );

            if (baskaGrupVarMi) {
                // KULLANICIYA GRUP DEĞİŞTİRME ONAYI SOR
                const onay = window.confirm(`Şu anda bu dersin "${baskaGrupVarMi.temelGrupAdi}" şubesine kayıtlısınız. "${temelGrupAdi}" grubuna geçmek istiyor musunuz?\n\n(Eski grubun saatleri programınızdan silinecektir.)`);

                if (!onay) return; // İptal derse işlemi durdur

                // Onayladıysa, eski grubun tüm saatlerini listeden (frontend'den) temizle
                guncelDersler = guncelDersler.filter(d => !(d.lessonID === seciliDers.lessonID && d.temelGrupAdi === baskaGrupVarMi.temelGrupAdi));

                // NOT: Eğer backend'inizde dersten çıkış (unregister) API'si varsa buraya onu çağıran bir kod eklemelisin.
                // Örn: await api.post('/lessonGroups/unregister', { lessonID: seciliDers.lessonID });
            }

            // 2. YENİ GRUBUN SAATİNİ KAYDET
            const response = await api.post('/lessonGroups/register', {
                lessonGroupID: grup.lessonGroupID
            });

            if (response.data && response.data.status) {
                guncelDersler.push({
                    lessonGroupID: grup.lessonGroupID,
                    lessonID: seciliDers.lessonID,
                    temelGrupAdi: temelGrupAdi
                });

                // Hem State'i hem LocalStorage'ı güncelle (Ekran anında değişsin diye)
                localStorage.setItem('benimDerslerim', JSON.stringify(guncelDersler));
                setKayitliDersler(guncelDersler);
            }
        } catch (error) {
            const mesaj = error.response?.data?.message || "Kayıt olurken bir hata oluştu veya zaten kayıtlısınız.";
            alert(mesaj);
        }
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
                    dersler.map((ders) => (
                        <div
                            key={ders.lessonID}
                            onClick={() => handleDersTikla(ders)}
                            style={{
                                backgroundColor: 'white', padding: '25px', borderRadius: '12px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer',
                                width: '250px', textAlign: 'center', borderTop: '6px solid #3498db',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{ders.lessonName}</h3>
                            <p style={{ margin: '0', fontSize: '13px', color: '#7f8c8d' }}>Bölüm: {ders.departmentName || '-'}</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#7f8c8d', fontWeight: 'bold' }}>{ders.semesterNo}. Dönem</p>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#888', fontSize: '16px', marginTop: '20px' }}>
                        Bu dönem için sistemde kayıtlı ders bulunmuyor.
                    </p>
                )}
            </div>

            {/* DERS SEÇİM MODALI */}
            {modalAcik && (
                <div className="modal-overlay" onClick={() => setModalAcik(false)}>
                    <div className="modal-icerik" style={{ width: '700px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: '0', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
                            {seciliDers?.lessonName} - Grup Seçimi
                        </h3>

                        {gruplarYukleniyor ? (<p style={{ padding: '20px 0' }}>Gruplar aranıyor...</p>
                        ) : seciliDersGruplari.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="ders-tablosu" style={{ marginTop: '15px', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="baslik-hucre">Grup Adı</th>
                                            <th className="baslik-hucre">Gün</th>
                                            <th className="baslik-hucre">Saat</th>
                                            <th className="baslik-hucre" style={{ textAlign: 'center' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {seciliDersGruplari.map(grup => {
                                            // BU SATIR (SAAT) SEÇİLMİŞ Mİ KONTROLÜ
                                            const isSelected = kayitliIdler.includes(grup.lessonGroupID);

                                            return (
                                                <tr key={grup.lessonGroupID} style={{
                                                    backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                                                    transition: 'background-color 0.3s'
                                                }}>
                                                    <td style={{ fontWeight: 'bold', padding: '10px' }}>{grup.lessonGroupName}</td>
                                                    <td style={{ padding: '10px' }}>{grup.day !== null ? GUNLER[grup.day] : '-'}</td>
                                                    <td style={{ padding: '10px' }}>{grup.hour ? SAAT_DILIMLERI[grup.hour] : '-'}</td>
                                                    <td style={{ padding: '10px', textAlign: 'center' }}>

                                                        {/* SEÇİLDİYSE YAZI, SEÇİLMEDİYSE BUTON GÖSTER */}
                                                        {isSelected ? (
                                                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
                                                                ✓ Seçildi
                                                            </span>
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