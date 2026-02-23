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
        {/* MENÜSÜZ (BAĞIMSIZ) SAYFALAR */}
        <Route path="/" element={<Login />} />

        {/* Admin panelini Layout'un dışına çıkardık, artık sol menü görünmeyecek */}
        <Route path="/admin-panel" element={<AdminPanel />} />

        {/* MENÜLÜ (ÖĞRENCİ) SAYFALARI */}
        <Route element={<Layout />}>
          <Route path="/anasayfa" element={<Anasayfa />} />
          <Route path="/ders-secimi/:semesterId" element={<DersProgrami />} />
          <Route path="/profil" element={<Profile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;