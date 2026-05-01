import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { RiDashboardLine, RiFileListLine, RiShoppingCartLine,
  RiStackLine, RiTeamLine, RiLogoutBoxLine, RiReceiptLine, RiCloseLine
} from 'react-icons/ri';

const NAV = [
  { label: 'Dashboard',     icon: <RiDashboardLine />,    path: '/admin',    roles: ['admin'] },
  { label: 'Dashboard',     icon: <RiDashboardLine />,    path: '/manager',  roles: ['manager'] },
  { label: 'Dashboard',     icon: <RiDashboardLine />,    path: '/viewer',   roles: ['viewer'] },
  { label: 'Billing',       icon: <RiShoppingCartLine />, path: '/billing',  roles: ['admin', 'cashier'] },
  { label: 'Bills History', icon: <RiReceiptLine />,      path: '/bills',    roles: ['admin', 'manager', 'cashier', 'viewer'] },
  { label: 'Inventory',     icon: <RiStackLine />,        path: '/inventory',roles: ['admin', 'cashier', 'viewer'] },
  { label: 'Reports',       icon: <RiFileListLine />,     path: '/reports',  roles: ['admin', 'manager'] },
  { label: 'Users',         icon: <RiTeamLine />,         path: '/users',    roles: ['admin'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const visible = NAV.filter((n) => n.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Media <span>POS</span></h2>
            <p>Billing System</p>
          </div>
          {/* Close button for mobile */}
          <button 
            className="btn-icon d-md-none" 
            style={{ display: 'none' }} // we'll control display via css or just let it be inline if mobile.
            onClick={onClose}
          >
            <RiCloseLine style={{ fontSize: 24 }} />
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          {visible.map((item) => (
            <motion.button
              key={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                onClose(); // Auto close on mobile when navigating
              }}
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
    </>
  );
}
