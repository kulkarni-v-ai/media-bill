import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  RiShoppingCartLine, RiStackLine, RiMoneyDollarCircleLine,
  RiAlertLine, RiTeamLine, RiArrowRightLine, RiReceiptLine,
  RiQrCodeLine, RiUserLine, RiTimeLine, RiArrowDownSLine, RiArrowUpSLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import BillExpandedView from '../components/billing/BillExpandedView';

const QR_COLORS = { QR1: 'var(--accent)', QR2: 'var(--cyan2)', QR3: 'var(--green)', QR4: 'var(--yellow)' };

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
  const [report, setReport]   = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [bills, setBills]       = useState([]);
  const [billPage, setBillPage]   = useState(1);
  const [billTotal, setBillTotal] = useState(0);
  const [loadingBills, setLoadingBills] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const LIMIT = 10;

  useEffect(() => {
    api.get('/reports/daily').then((r) => setReport(r.data)).catch(() => toast.error('Failed to load report'));
    api.get('/items/low-stock').then((r) => setLowStock(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingBills(true);
    api.get(`/bills?page=${billPage}&limit=${LIMIT}`)
      .then((r) => { setBills(r.data.bills); setBillTotal(r.data.total); })
      .catch(() => toast.error('Failed to load bills'))
      .finally(() => setLoadingBills(false));
  }, [billPage]);

  const totalPages = Math.ceil(billTotal / LIMIT);

  const fmt = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Today's overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4 mb-16">
        <StatCard icon={<RiMoneyDollarCircleLine />} label="Today's Revenue"  value={`₹${report?.totalRevenue ?? '—'}`}       color="var(--accent2)" delay={0}    />
        <StatCard icon={<RiShoppingCartLine />}      label="Bills Today"       value={report?.totalBills ?? '—'}                color="var(--cyan2)"   delay={0.05} />
        <StatCard icon={<RiStackLine />}             label="Low Stock Items"   value={lowStock.length}                          color="var(--yellow)"  delay={0.1}  />
        <StatCard icon={<RiAlertLine />}             label="Out of Stock"      value={lowStock.filter(i => i.stock === 0).length} color="var(--red)"   delay={0.15} />
      </div>

      {/* ── Revenue & QR Breakdown ── */}
      {report && (
        <div className="grid-2 mb-16">
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📸 Revenue Breakdown</h3>
            <div className="total-row"><span style={{ color: 'var(--text3)' }}>Polaroids</span><span style={{ color: 'var(--yellow)', fontWeight: 700 }}>₹{report.polaroidRevenue}</span></div>
            <div className="total-row"><span style={{ color: 'var(--text3)' }}>Posters &amp; Stickers</span><span style={{ color: 'var(--cyan2)', fontWeight: 700 }}>₹{report.othersRevenue}</span></div>
            <div className="total-row grand"><span>Total</span><span className="total-val">₹{report.totalRevenue}</span></div>
          </motion.div>

          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📱 QR Breakdown</h3>
            {report.qrBreakdown?.map((qr) => (
              <div key={qr.qr} className="total-row" style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--text3)' }}>{qr.qr} <span style={{ fontSize: 11 }}>({qr.count} bills)</span></span>
                <span style={{ fontWeight: 700 }}>₹{qr.total}</span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── Stock Alerts ── */}
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

      {/* ── Bills History Table ── */}
      <motion.div className="card mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RiReceiptLine style={{ color: 'var(--accent)' }} /> All Bills
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>({billTotal} total)</span>
          </h3>
        </div>

        {loadingBills ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Loading bills…</div>
        ) : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No bills yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Customer', 'Cashier', 'Polaroids', 'Others', 'Grand Total', 'QR', 'Time', ''].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => {
                  const isOpen = expandedId === bill._id;
                  return (
                    <>
                      {/* Main bill row */}
                      <motion.tr
                        key={bill._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setExpandedId(isOpen ? null : bill._id)}
                        style={{
                          borderBottom: isOpen ? 'none' : '1px solid var(--border)',
                          cursor: 'pointer',
                          background: isOpen ? 'var(--card2)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--card2)'; }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 11 }}>
                          #{(billPage - 1) * LIMIT + idx + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RiUserLine style={{ color: 'var(--text3)', flexShrink: 0 }} />
                            {bill.customerName}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>
                          {bill.createdBy?.name ?? '—'}
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>{bill.createdBy?.role}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--yellow)', fontWeight: 600 }}>
                          ₹{bill.polaroidTotal?.toFixed(2) ?? '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--cyan2)', fontWeight: 600 }}>
                          ₹{bill.othersTotal?.toFixed(2) ?? '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent2)' }}>₹{bill.grandTotal?.toFixed(2)}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: `${QR_COLORS[bill.qrUsed] ?? 'var(--border)'}22`,
                            color: QR_COLORS[bill.qrUsed] ?? 'var(--text2)',
                            border: `1px solid ${QR_COLORS[bill.qrUsed] ?? 'var(--border)'}55`,
                          }}>
                            <RiQrCodeLine style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {bill.qrUsed}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RiTimeLine />
                            {fmt(bill.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {isOpen
                            ? <RiArrowUpSLine style={{ color: 'var(--accent)', fontSize: 18 }} />
                            : <RiArrowDownSLine style={{ color: 'var(--text3)', fontSize: 18 }} />}
                        </td>
                      </motion.tr>

                      {/* Expanded item breakdown */}
                      {isOpen && (
                        <BillExpandedView key={`${bill._id}-items`} bill={bill} colSpan={9} />
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 14px', fontSize: 13 }}
              disabled={billPage === 1}
              onClick={() => setBillPage(p => p - 1)}
            >← Prev</button>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Page {billPage} of {totalPages}</span>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 14px', fontSize: 13 }}
              disabled={billPage === totalPages}
              onClick={() => setBillPage(p => p + 1)}
            >Next →</button>
          </div>
        )}
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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
