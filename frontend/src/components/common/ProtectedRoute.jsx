import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { userInfo } = useSelector((s) => s.auth);
  if (!userInfo) return <Navigate to="/login" replace />;
  if (adminOnly && userInfo.role !== "admin") return <Navigate to="/" replace />;
  return children;
};
export default ProtectedRoute;