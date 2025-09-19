// components/ProtectedRoute.js
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const profile = JSON.parse(localStorage.getItem("profile"));

  // If no token → send to user login
  if (!token) {
    return <Navigate to="/login-user" replace />;
  }

  // Check role (if roles are restricted)
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/login-user" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
