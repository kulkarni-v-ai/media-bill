import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const QR_COLORS = { QR1: '#7c3aed', QR2: '#06b6d4', QR3: '#10b981', QR4: '#f59e0b', CASH: '#10b981' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <p style={{ fontWeight: 700 }}>{label}</p>
        <p style={{ color: 'var(--accent2)' }}>₹{payload[0].value}</p>
        {payload[1] && <p style={{ color: 'var(--cyan2)' }}>{payload[1].value} bills</p>}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const fetchReport = () => {
    setLoading(true);
    api.get(`/reports/daily?date=${date}`)
      .then((r) => setReport(r.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, [date]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div><h1>Sales Analysis</h1><p>Detailed performance breakdown</p></div>
          <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid-4 mb-16">
            {[
              { label: "Net Revenue", value: `₹${report.totalNetRevenue}`, color: 'var(--green)' },
              { label: "Offers Applied", value: `₹${report.totalDiscounts}`, color: 'var(--yellow)' },
              { label: "Gross Revenue", value: `₹${report.totalGrossRevenue}`, color: 'var(--cyan2)' },
              { label: "Bills Created", value: report.totalBills, color: 'var(--accent2)' },
            ].map((s, i) => (
              <motion.div key={s.label} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Category breakdown */}
          <div className="grid-2 mb-16">
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Category Performance</h3>
              <div className="total-row"><span style={{ color: 'var(--text3)' }}>📸 Polaroids</span><span style={{ fontWeight: 700 }}>₹{report.breakdown.polaroid}</span></div>
              <div className="total-row"><span style={{ color: 'var(--text3)' }}>📱 Digital Photos</span><span style={{ fontWeight: 700 }}>₹{report.breakdown.digitalPhoto}</span></div>
              <div className="total-row"><span style={{ color: 'var(--text3)' }}>🖼️ Posters</span><span style={{ fontWeight: 700 }}>₹{report.breakdown.poster}</span></div>
              <div className="total-row"><span style={{ color: 'var(--text3)' }}>🔖 Stickers</span><span style={{ fontWeight: 700 }}>₹{report.breakdown.sticker}</span></div>
              <div className="total-row grand"><span>Total Net</span><span className="total-val">₹{report.totalNetRevenue}</span></div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Payment Methods</h3>
              {report.qrBreakdown?.filter(q => q.total > 0).length === 0
                ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No transactions today</p>
                : report.qrBreakdown?.map((qr) => (
                  <div key={qr.qr} style={{ marginBottom: 10 }}>
                    <div className="total-row" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{qr.qr}</span>
                      <span style={{ fontWeight: 700 }}>₹{qr.total} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text3)' }}>({qr.count})</span></span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${report.totalNetRevenue > 0 ? (qr.total / report.totalNetRevenue) * 100 : 0}%`, background: QR_COLORS[qr.qr], borderRadius: 4, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
            </motion.div>
          </div>

          {/* Top items */}
          {report.topItems?.length > 0 && (
            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Top Items</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Item</th><th>Category</th><th>Qty</th><th>Revenue (Net)</th></tr></thead>
                  <tbody>
                    {report.topItems.map((item, idx) => (
                      <tr key={item.name}>
                        <td style={{ color: 'var(--text3)', fontSize: 12 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td><span className={`badge badge-${item.category.replace(' ', '-')}`}>{item.category}</span></td>
                        <td>{item.qty}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent2)' }}>₹{item.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      ) : null}
    </motion.div>
  );
}
