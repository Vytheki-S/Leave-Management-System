import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import ApplyLeave from './pages/ApplyLeave';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import LeaveRequests from './pages/LeaveRequests';
import Login from './pages/Login';
import MyLeaves from './pages/MyLeaves';
import Profile from './pages/Profile';

function RoleLanding() {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'manager') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/my-leaves" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<RoleLanding />} />
          <Route path="/my-leaves" element={<MyLeaves />} />
          <Route path="/apply-leave" element={<ApplyLeave />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/leave-requests" element={<LeaveRequests />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
