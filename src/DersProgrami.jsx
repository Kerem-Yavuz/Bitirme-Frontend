import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // EKSİK OLAN IMPORT EKLENDİ
import './App.css';

// --- SABİT VERİLER VE AYARLAR ---
const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SAATLER = ["09.00-10.00", "10.00-11.00", "11.00-12.00", "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00", "16.00-17.00"];
const OGLE_ARASI_HARITASI = [-1, 3, 3, 3, 3, 4, -1, -1];

const BASLANGIC_STOKLARI = {
    "mat": 6, "fiz": 4, "kim": 4, "biyo": 4, "ing": 4, "edb": 5,
    "alm": 3, "beden": 2, "tarih": 2, "resim": 1
};

const DERS_TANIMLARI = {
    "edb": { ad: "Edebiyat", renk: "#e74c3c", blok: true },
    "mat": { ad: "Matematik", renk: "#e74c3c", blok: true },
    "fiz": { ad: "Fizik", renk: "#e74c3c", blok: true },
    "kim": { ad: "Kimya", renk: "#e74c3c", blok: true },
    "biyo": { ad: "Biyoloji", renk: "#e74c3c", blok: true },
    "ing": { ad: "İngilizce", renk: "#e74c3c", blok: true },
    "alm": { ad: "Almanca", renk: "#e74c3c", blok: true },
    "beden": { ad: "Beden E.", renk: "#e2007a", blok: true },
    "tarih": { ad: "Tarih", renk: "#8e44ad", blok: false },
    "resim": { ad: "Resim", renk: "#8e44ad", blok: false },
};

const DERS_KURALLARI = {
    "mat": { blok: true, gunlukMax: 2, maxGunSayisi: 3 },
    "fiz": { blok: true, gunlukMax: 2, maxGunSayisi: 2 },
    "kim": { blok: true, gunlukMax: 2, maxGunSayisi: 2 },
    "biyo": { blok: true, gunlukMax: 2, maxGunSayisi: 2 },
    "ing": { blok: true, gunlukMax: 2, maxGunSayisi: 2 },
    "edb": { blok: true, gunlukMax: 2, maxGunSayisi: 4 },
    "alm": { blok: true, gunlukMax: 2, maxGunSayisi: 2 },
    "beden": { blok: true, gunlukMax: 2, maxGunSayisi: 1, izinliZamanlar: { 4: [5, 6, 7] } },
    "tarih": { blok: false, gunlukMax: 1 },
    "resim": { blok: false }
};

function DersProgrami() {
    // --- STATE (DURUM) YÖNETİMİ ---
    // HATA BURADAYDI: useState ve useEffect FONKSİYONUN İÇİNE TAŞINDI
    const [kullaniciAdi, setKullaniciAdi] = useState('');
    const navigate = useNavigate();

    const [stoklar, setStoklar] = useState(BASLANGIC_STOKLARI);
    const [yerlesim, setYerlesim] = useState({});
    const dosyaInputRef = useRef(null);

    // Kullanıcı Kontrolü (Login olmuş mu?)
    useEffect(() => {
        const kayitliKullanici = localStorage.getItem('user');

        if (kayitliKullanici) {
            const userObj = JSON.parse(kayitliKullanici);
            setKullaniciAdi(userObj.fullName);
        } else {
            navigate('/'); // Giriş yoksa Login'e at
        }
    }, [navigate]);

    // Ders Programı Verisini Yükle
    useEffect(() => {
        const kayitliVeri = localStorage.getItem("reactDersProgrami");
        if (kayitliVeri) {
            try {
                const parsed = JSON.parse(kayitliVeri);
                setYerlesim(parsed.yerlesim || {});
                setStoklar(parsed.stoklar || BASLANGIC_STOKLARI);
            } catch (e) { console.error("Veri hatası"); }
        }
    }, []);

    // Çıkış Yapma Fonksiyonu
    const cikisYap = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    // --- MANTIK FONKSİYONLARI ---

    const kuralKontrol = (dersId, row, col, miktar) => {
        const kural = DERS_KURALLARI[dersId];
        if (kural.izinliZamanlar && kural.izinliZamanlar[col]) {
            if (!kural.izinliZamanlar[col].includes(row)) return "Bu saate koyulamaz!";
            if (miktar > 1 && !kural.izinliZamanlar[col].includes(row + 1)) return "Blok ders yasaklı saate taşıyor!";
        }

        let bugunDersSayisi = 0;
        Object.keys(yerlesim).forEach(key => {
            const [c, r] = key.split('-').map(Number);
            if (c === col && yerlesim[key].dersId === dersId) bugunDersSayisi++;
        });

        if (bugunDersSayisi + miktar > kural.gunlukMax) return "Günlük limit aşıldı!";
        return null;
    };

    const handleDragStart = (e, dersId) => {
        if (stoklar[dersId] > 0) e.dataTransfer.setData("dersId", dersId);
        else e.preventDefault();
    };

    const handleDrop = (e, row, col) => {
        e.preventDefault();
        const dersId = e.dataTransfer.getData("dersId");
        if (!dersId || stoklar[dersId] <= 0) return;

        // Hafta sonu ve öğle arası engeli
        if (col >= 5) return alert("Hafta sonuna ders koyulamaz!");
        if (row === OGLE_ARASI_HARITASI[col + 1]) return alert("Öğle arasına koyulamaz!");

        const kural = DERS_KURALLARI[dersId];
        const blokMu = kural.blok && stoklar[dersId] >= 2;
        const islenecekMiktar = blokMu ? 2 : 1;

        // Doluluk kontrolü
        if (yerlesim[`${col}-${row}`]) return alert("Bu hücre dolu!");

        if (blokMu) {
            if (row >= SAATLER.length - 1) return alert("Blok ders sığmaz!");
            if (yerlesim[`${col}-${row + 1}`]) return alert("Alt hücre dolu!");
            if (row + 1 === OGLE_ARASI_HARITASI[col + 1]) return alert("Öğle arası dersi bölemez!");
        }

        const hata = kuralKontrol(dersId, row, col, islenecekMiktar);
        if (hata) return alert(hata);

        // Yerleştirme
        const yeniYerlesim = { ...yerlesim };
        const grupId = Date.now();
        yeniYerlesim[`${col}-${row}`] = { dersId, grupId };
        if (blokMu) yeniYerlesim[`${col}-${row + 1}`] = { dersId, grupId };

        setYerlesim(yeniYerlesim);
        setStoklar(prev => ({ ...prev, [dersId]: prev[dersId] - islenecekMiktar }));
    };

    const handleDersSil = (key, dersId, grupId) => {
        const yeniYerlesim = { ...yerlesim };
        let iadeMiktari = 0;
        Object.keys(yeniYerlesim).forEach(k => {
            if (yeniYerlesim[k].grupId === grupId) {
                delete yeniYerlesim[k];
                iadeMiktari++;
            }
        });
        setYerlesim(yeniYerlesim);
        setStoklar(prev => ({ ...prev, [dersId]: prev[dersId] + iadeMiktari }));
    };

    // Buton İşlevleri
    const kaydet = () => {
        localStorage.setItem("reactDersProgrami", JSON.stringify({ yerlesim, stoklar }));
        alert("Kaydedildi!");
    };
    const temizle = () => {
        if (confirm("Her şey silinecek?")) {
            setYerlesim({});
            setStoklar(BASLANGIC_STOKLARI);
            localStorage.removeItem("reactDersProgrami");
        }
    };
    const indir = () => {
        const siraliYerlesim = Object.keys(yerlesim)
            .sort()
            .reduce((obj, key) => {
                obj[key] = yerlesim[key];
                return obj;
            }, {});

        const dataToExport = { yerlesim: siraliYerlesim, stoklar };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "ders_programi.json";
        a.click();
    };
    const yukle = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target.result);
                setYerlesim(json.yerlesim);
                setStoklar(json.stoklar);
            } catch (err) { alert("Dosya hatalı"); }
        };
        reader.readAsText(file);
    };

    // --- HTML (JSX) GÖRÜNÜMÜ ---
    return (
        <div className="ana-ekran">
            {/* SOL PANEL */}
            <div className="sol-panel">
                <h3>Dersler</h3>
                <small style={{ color: '#bbb', marginBottom: '20px' }}>Blok Dersler: B</small>

                {Object.entries(DERS_TANIMLARI).map(([id, ders]) => (
                    <div
                        key={id}
                        className={`ders-kutusu ${stoklar[id] <= 0 ? 'stok-bitti' : ''}`}
                        style={{ backgroundColor: ders.renk }}
                        draggable={stoklar[id] > 0}
                        onDragStart={(e) => handleDragStart(e, id)}
                    >
                        <span>{ders.ad} {ders.blok && <span className="blok-ikon">B</span>}</span>
                        <span>({stoklar[id]})</span>
                    </div>
                ))}

                <div className="buton-grubu">
                    <button className="btn btn-kaydet" onClick={kaydet}>Kaydet</button>
                    <button className="btn btn-indir" onClick={indir}>İndir</button>
                    <button className="btn btn-yukle" onClick={() => dosyaInputRef.current.click()}>Yükle</button>
                    <button className="btn btn-temizle" onClick={temizle}>Sıfırla</button>
                </div>
                <input type="file" ref={dosyaInputRef} style={{ display: 'none' }} accept=".json" onChange={yukle} />
            </div>

            {/* SAĞ PANEL (TABLO) */}
            <div className="sag-sahne">

                {/* --- SAĞ ÜST KUTUCUK --- */}
                <div className="user-box">
                    <div className="avatar">
                        {kullaniciAdi ? kullaniciAdi.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{kullaniciAdi}</span>
                        {/* Aşağı ok simgesi ekledik */}
                        <span className="user-role" style={{ fontSize: '10px' }}>Öğrenci ▼</span>
                    </div>

                    {/* --- GİZLİ MENÜ (HOVER İLE AÇILIR) --- */}
                    <div className="dropdown-menu">
                        <button onClick={() => navigate('/profil')} className="dropdown-item">
                            👤 Profilim
                        </button>
                        <button onClick={cikisYap} className="dropdown-item" style={{ color: '#dc3545' }}>
                            🚪 Çıkış Yap
                        </button>
                    </div>
                </div>

                <h2 style={{ color: '#2c3e50', marginTop: '50px' }}>Haftalık Ders Programı</h2>

                <table>
                    <thead>
                        <tr>
                            <th className="baslik-hucre">Saat/Gün</th>
                            {GUNLER.map(g => <th key={g} className="baslik-hucre">{g}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {SAATLER.map((saat, row) => (
                            <tr key={row}>
                                <td className="baslik-hucre" style={{ fontSize: '15px', fontWeight: 'bold' }}>{saat}</td>
                                {GUNLER.map((_, col) => {
                                    // Hücre İçeriği Hesaplama
                                    const ogleSaati = OGLE_ARASI_HARITASI[col + 1];
                                    if (row === ogleSaati) return <td key={col} className="ogle-arasi">ÖĞLE ARASI</td>;
                                    if (col >= 5) return <td key={col} className="kapali-alan">TATİL</td>;

                                    const key = `${col}-${row}`;
                                    const dersVerisi = yerlesim[key];

                                    return (
                                        <td
                                            key={col}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, row, col)}
                                        >
                                            {dersVerisi && (
                                                <div
                                                    className="yerlesmis-ders"
                                                    onDoubleClick={() => handleDersSil(key, dersVerisi.dersId, dersVerisi.grupId)}
                                                >
                                                    {DERS_TANIMLARI[dersVerisi.dersId]?.ad}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="bilgi-notu">
                    * Blok dersler koyulurken koyduğunuz saate ve sonraki saate birlikte koyulur. <br />
                    * Hafta içi cuma günleri 13.00-14.00 arası diğer günler 12.00-13.00 arası öğle tatilidir.<br />
                    * Beden Eğitimi sadece Cuma (Öğleden sonra).<br />
                    * Yükleme yaparken mevcut tablo silinir ve dosyadaki veri yazılır.
                </div>
            </div>
        </div>
    );
}



export default DersProgrami;