import { Navigate } from 'react-router-dom';

const RoleRoute = ({ children, requiredPrivilege }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return <Navigate to="/" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (!user.privileges || !user.privileges.includes(requiredPrivilege)) {
            return <Navigate to="/anasayfa" replace />;
        }
    } catch {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleRoute;
