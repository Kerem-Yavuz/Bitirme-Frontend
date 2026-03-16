import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import DersProgrami from './DersProgrami';
import Profile from './Profile';
import Anasayfa from './Anasayfa';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Admin sayfaları
import AdminPanel from './AdminPanel';
import UserManagement from './admin/UserManagement';
import LessonManagement from './admin/LessonManagement';
import DepartmentManagement from './admin/DepartmentManagement';

// Teacher sayfaları
import TeacherPanel from './TeacherPanel';
import MyLessons from './teacher/MyLessons';
import StudentList from './teacher/StudentList';
import AIChat from './AIChat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* GİRİŞ SAYFASI (Menüsüz) */}
        <Route path="/" element={<Login />} />

        {/* MENÜLÜ ANA YAPI (Korumalı) */}
        <Route element={
          <ProtectedRoute>
            <Layout />
            <AIChat />
          </ProtectedRoute>
        }>
          <Route path="/anasayfa" element={<Anasayfa />} />
          <Route path="/ders-secimi/:semesterId" element={<DersProgrami />} />
          <Route path="/profil" element={<Profile />} />

          {/* Admin Paneli */}
          <Route path="/admin-panel" element={
            <RoleRoute requiredPrivilege="Admin"><AdminPanel /></RoleRoute>
          } />
          <Route path="/admin-panel/users" element={
            <RoleRoute requiredPrivilege="Admin"><UserManagement /></RoleRoute>
          } />
          <Route path="/admin-panel/lessons" element={
            <RoleRoute requiredPrivilege="Admin"><LessonManagement /></RoleRoute>
          } />
          <Route path="/admin-panel/departments" element={
            <RoleRoute requiredPrivilege="Admin"><DepartmentManagement /></RoleRoute>
          } />

          {/* Teacher Paneli */}
          <Route path="/teacher-panel" element={
            <RoleRoute requiredPrivilege="Teacher"><TeacherPanel /></RoleRoute>
          } />
          <Route path="/teacher-panel/lessons" element={
            <RoleRoute requiredPrivilege="Teacher"><MyLessons /></RoleRoute>
          } />
          <Route path="/teacher-panel/students/:groupId" element={
            <RoleRoute requiredPrivilege="Teacher"><StudentList /></RoleRoute>
          } />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;