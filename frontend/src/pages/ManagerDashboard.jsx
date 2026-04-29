import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RiFileListLine, RiArrowRightLine } from 'react-icons/ri';

export default function ManagerDashboard() {
  const [report, setReport] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reports/daily').then((r) => setReport(r.data)).catch(() => {});
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Manager Dashboard</h1>
        <p>Welcome, {user?.name} · Today's summary</p>
      </div>

      <div className="grid-3 mb-16">
        {[
          { label: "Today's Revenue", value: `₹${report?.totalRevenue ?? '—'}`, color: 'var(--accent2)' },
          { label: "Bills Today", value: report?.totalBills ?? '—', color: 'var(--cyan2)' },
          { label: "Report Date", value: report?.date ?? '—', color: 'var(--green)' },
        ].map((s, i) => (
          <motion.div key={s.label} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {report?.qrBreakdown && (
        <motion.div className="card mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>QR Breakdown</h3>
          {report.qrBreakdown.map((qr) => (
            <div key={qr.qr} className="total-row"><span>{qr.qr}</span><span style={{ fontWeight: 700 }}>₹{qr.total} <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 12 }}>({qr.count} bills)</span></span></div>
          ))}
        </motion.div>
      )}

      <button className="btn btn-primary" onClick={() => navigate('/reports')}>
        <RiFileListLine /> View Full Reports <RiArrowRightLine />
      </button>
    </motion.div>
  );
}
