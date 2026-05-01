import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RiMenuLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import ViewerDashboard from '../pages/ViewerDashboard';
import Billing from '../pages/Billing';
import Inventory from '../pages/Inventory';
import Reports from '../pages/Reports';
import UserManagement from '../pages/UserManagement';
import BillsHistory from '../pages/BillsHistory';
import Sidebar from '../components/common/Sidebar';

const ROLE_HOME = {
  admin: '/admin',
  manager: '/reports',
  cashier: '/billing',
  viewer: '/viewer',
};

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  return children;
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-title">Media <span>POS</span></div>
        <button className="btn-icon" onClick={() => setSidebarOpen(true)}>
          <RiMenuLine style={{ fontSize: 24 }} />
        </button>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default function AppRouter() {
  const { user, loading } = useAuth();

  // Don't render routes until auth state is resolved
  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role]} replace /> : <Login />} />

        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/billing" element={
          <ProtectedRoute roles={['admin', 'cashier']}>
            <AppLayout><Billing /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/inventory" element={
          <ProtectedRoute roles={['admin', 'cashier', 'viewer']}>
            <AppLayout><Inventory /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <AppLayout><Reports /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout><UserManagement /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/viewer" element={
          <ProtectedRoute roles={['viewer']}>
            <AppLayout><ViewerDashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/manager" element={
          <ProtectedRoute roles={['manager']}>
            <AppLayout><ManagerDashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/bills" element={
          <ProtectedRoute roles={['admin', 'manager', 'cashier', 'viewer']}>
            <AppLayout><BillsHistory /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/" element={
          user ? <Navigate to={ROLE_HOME[user.role] || '/login'} replace /> : <Navigate to="/login" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
