import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import DersProgrami from './DersProgrami';
import Profile from './Profile'; // <-- 1. BU SATIRI EKLE

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ders-programi" element={<DersProgrami />} />
        <Route path="/profil" element={<Profile />} /> {/* <-- 2. BU SATIRI EKLE */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;