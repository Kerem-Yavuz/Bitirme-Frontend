import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import DersProgrami from './DersProgrami';
import Profile from './Profile';
import Anasayfa from './Anasayfa';
import Layout from './Layout';
import AdminPanel from './AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        //* MENÜSÜZ (BAĞIMSIZ) GİRİŞ SAYFASI
        <Route path="/" element={<Login />} />

        //* MENÜLÜ ANA YAPI (Öğrenci ve Admin Ortak Kullanır)
        <Route element={<Layout />}>
          <Route path="/anasayfa" element={<Anasayfa />} />
          <Route path="/ders-secimi/:semesterId" element={<DersProgrami />} />
          <Route path="/profil" element={<Profile />} />

          //* Admin panelini tekrar Layout'un içine aldık
          <Route path="/admin-panel" element={<AdminPanel />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;