import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  RiDashboardLine, RiFileListLine, RiShoppingCartLine,
  RiStackLine, RiTeamLine, RiLogoutBoxLine, RiQrCodeLine,
} from 'react-icons/ri';

const NAV = [
  { label: 'Dashboard', icon: <RiDashboardLine />, path: '/admin', roles: ['admin'] },
  { label: 'Dashboard', icon: <RiDashboardLine />, path: '/manager', roles: ['manager'] },
  { label: 'Dashboard', icon: <RiDashboardLine />, path: '/viewer', roles: ['viewer'] },
  { label: 'Billing', icon: <RiShoppingCartLine />, path: '/billing', roles: ['admin', 'cashier'] },
  { label: 'Inventory', icon: <RiStackLine />, path: '/inventory', roles: ['admin', 'cashier', 'viewer'] },
  { label: 'Reports', icon: <RiFileListLine />, path: '/reports', roles: ['admin', 'manager'] },
  { label: 'Users', icon: <RiTeamLine />, path: '/users', roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const visible = NAV.filter((n) => n.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Media <span>POS</span></h2>
        <p>Billing System</p>
      </div>

      <nav style={{ flex: 1 }}>
        {visible.map((item) => (
          <motion.button
            key={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip" style={{ marginBottom: 10 }}>
          <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{user?.name}</div>
            <div className="user-chip-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout}>
          <RiLogoutBoxLine /> Logout
        </button>
      </div>
    </aside>
  );
}
