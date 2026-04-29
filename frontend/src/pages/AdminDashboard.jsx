import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { RiShoppingCartLine, RiStackLine, RiMoneyDollarCircleLine, RiAlertLine, RiTeamLine, RiArrowRightLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div className="stat-icon" style={{ background: `${color}22` }}><span style={{ color }}>{icon}</span></div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/daily').then((r) => setReport(r.data)).catch(() => toast.error('Failed to load report'));
    api.get('/items/low-stock').then((r) => setLowStock(r.data)).catch(() => {});
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Today's overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid-4 mb-16">
        <StatCard icon={<RiMoneyDollarCircleLine />} label="Today's Revenue" value={`₹${report?.totalRevenue ?? '—'}`} color="var(--accent2)" delay={0} />
        <StatCard icon={<RiShoppingCartLine />} label="Bills Today" value={report?.totalBills ?? '—'} color="var(--cyan2)" delay={0.05} />
        <StatCard icon={<RiStackLine />} label="Low Stock Items" value={lowStock.length} color="var(--yellow)" delay={0.1} />
        <StatCard icon={<RiAlertLine />} label="Out of Stock" value={lowStock.filter(i => i.stock === 0).length} color="var(--red)" delay={0.15} />
      </div>

      {/* Admin category breakdown */}
      {report && (
        <div className="grid-2 mb-16">
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📸 Revenue Breakdown</h3>
            <div className="total-row"><span style={{ color: 'var(--text3)' }}>Polaroids</span><span style={{ color: 'var(--yellow)', fontWeight: 700 }}>₹{report.polaroidRevenue}</span></div>
            <div className="total-row"><span style={{ color: 'var(--text3)' }}>Posters & Stickers</span><span style={{ color: 'var(--cyan2)', fontWeight: 700 }}>₹{report.othersRevenue}</span></div>
            <div className="total-row grand"><span>Total</span><span className="total-val">₹{report.totalRevenue}</span></div>
          </motion.div>

          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📱 QR Breakdown</h3>
            {report.qrBreakdown?.map((qr) => (
              <div key={qr.qr} className="total-row" style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--text3)' }}>{qr.qr} <span style={{ fontSize: 11, color: 'var(--text3)' }}>({qr.count} bills)</span></span>
                <span style={{ fontWeight: 700 }}>₹{qr.total}</span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <motion.div className="card mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 style={{ marginBottom: 12, fontWeight: 700 }}>⚠️ Stock Alerts</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lowStock.map((item) => (
              <div key={item._id} className={`alert-banner ${item.stock === 0 ? 'alert-danger' : 'alert-warning'}`} style={{ marginBottom: 0, flex: '1 1 200px' }}>
                <RiAlertLine />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                  <div style={{ fontSize: 11 }}>{item.stock === 0 ? 'Out of stock' : `Only ${item.stock} left`}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/billing')}><RiShoppingCartLine /> New Bill</button>
          <button className="btn btn-ghost" onClick={() => navigate('/inventory')}><RiStackLine /> Inventory</button>
          <button className="btn btn-ghost" onClick={() => navigate('/reports')}><RiArrowRightLine /> Reports</button>
          <button className="btn btn-ghost" onClick={() => navigate('/users')}><RiTeamLine /> Manage Users</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
