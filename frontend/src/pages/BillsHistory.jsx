import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  RiReceiptLine, RiUserLine, RiTimeLine,
  RiQrCodeLine, RiArrowDownSLine, RiArrowUpSLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import BillExpandedView from '../components/billing/BillExpandedView';

const QR_COLORS = { QR1: 'var(--accent)', QR2: 'var(--cyan2)', QR3: 'var(--green)', QR4: 'var(--yellow)' };
const CAT_COLOR  = { polaroid: 'var(--yellow)', poster: 'var(--cyan2)', sticker: 'var(--accent)' };
const LIMIT = 15;

export default function BillsHistory() {
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';

  const [bills, setBills]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [qrFilter, setQrFilter]   = useState('');

  const totalPages = Math.ceil(total / LIMIT);

  const fetchBills = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (dateFilter) params.append('date', dateFilter);
    if (qrFilter)   params.append('qrUsed', qrFilter);
    api.get(`/bills?${params}`)
      .then((r) => { setBills(r.data.bills); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load bills'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBills(); }, [page, dateFilter, qrFilter]);

  // Admin bill actions
  const handleBillDeleted = (deletedId) => {
    setBills((prev) => prev.filter((b) => b._id !== deletedId));
    setTotal((t) => t - 1);
    setExpandedId(null);
  };
  const handleBillUpdated = (updatedBill) => {
    setBills((prev) => prev.map((b) => b._id === updatedBill._id ? updatedBill : b));
  };

  const fmt = (dt) => new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RiReceiptLine style={{ color: 'var(--accent)' }} /> Bills History
        </h1>
        <p>{total} total bills recorded</p>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setPage(1); setDateFilter(e.target.value); }}
            className="form-input"
            style={{ width: 180, paddingLeft: 12 }}
          />
        </div>
        <select
          value={qrFilter}
          onChange={(e) => { setPage(1); setQrFilter(e.target.value); }}
          className="form-input"
          style={{ width: 140 }}
        >
          <option value="">All QRs</option>
          {['QR1', 'QR2', 'QR3', 'QR4'].map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
        {(dateFilter || qrFilter) && (
          <button className="btn btn-ghost" onClick={() => { setDateFilter(''); setQrFilter(''); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>Loading bills…</div>
        ) : bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
            <RiReceiptLine style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }} />
            <div>No bills found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {[
                    '#', 'Customer', 'Cashier',
                    ...(isAdmin ? ['Polaroids', 'Others'] : []),
                    'Grand Total', 'QR', 'Time', '',
                  ].map((h) => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      color: 'var(--text3)', fontWeight: 600,
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => {
                  const isOpen = expandedId === bill._id;
                  const colSpan = isAdmin ? 9 : 7;
                  return (
                    <>
                      {/* ── Bill row ── */}
                      <motion.tr
                        key={bill._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        onClick={() => setExpandedId(isOpen ? null : bill._id)}
                        style={{
                          borderBottom: isOpen ? 'none' : '1px solid var(--border)',
                          cursor: 'pointer',
                          background: isOpen ? 'var(--card2)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = 'var(--card2)'; }}
                        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '11px 12px', color: 'var(--text3)', fontSize: 11 }}>
                          #{(page - 1) * LIMIT + idx + 1}
                        </td>
                        <td style={{ padding: '11px 12px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RiUserLine style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            {bill.customerName}
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px', color: 'var(--text2)' }}>
                          {bill.createdBy?.name ?? '—'}
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>
                            {bill.createdBy?.role}
                          </div>
                        </td>

                        {/* Admin-only columns */}
                        {isAdmin && (
                          <>
                            <td style={{ padding: '11px 12px', color: 'var(--yellow)', fontWeight: 600 }}>
                              ₹{bill.polaroidTotal?.toFixed(2) ?? '—'}
                            </td>
                            <td style={{ padding: '11px 12px', color: 'var(--cyan2)', fontWeight: 600 }}>
                              ₹{bill.othersTotal?.toFixed(2) ?? '—'}
                            </td>
                          </>
                        )}

                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent2)' }}>
                            ₹{bill.grandTotal?.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
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
                        <td style={{ padding: '11px 12px', color: 'var(--text3)', fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RiTimeLine /> {fmt(bill.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          {isOpen
                            ? <RiArrowUpSLine style={{ color: 'var(--accent)', fontSize: 18 }} />
                            : <RiArrowDownSLine style={{ color: 'var(--text3)', fontSize: 18 }} />}
                        </td>
                      </motion.tr>

                      {/* ── Expanded item breakdown ── */}
                      {isOpen && (
                        <BillExpandedView
                          key={`${bill._id}-exp`}
                          bill={bill}
                          colSpan={isAdmin ? 9 : 7}
                          onDeleted={handleBillDeleted}
                          onUpdated={handleBillUpdated}
                        />
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
