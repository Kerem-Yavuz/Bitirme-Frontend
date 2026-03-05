import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return <Navigate to="/" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (!user.privileges || !user.privileges.includes('Admin')) {
            return <Navigate to="/anasayfa" replace />;
        }
    } catch {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
