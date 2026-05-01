import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { RiDeleteBinLine, RiEditLine, RiCloseLine, RiSaveLine, RiAlertLine } from 'react-icons/ri';

const CAT_COLOR = { polaroid: 'var(--yellow)', poster: 'var(--cyan2)', sticker: 'var(--accent)' };

/* ──────────────────────────────────────────────────────────── */
/*  Sub-components                                              */
/* ──────────────────────────────────────────────────────────── */

const ItemRow = ({ item }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '7px 12px', borderRadius: 8,
    background: 'var(--card)', border: '1px solid var(--border)',
  }}>
    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--text3)' }}>qty <b style={{ color: 'var(--text)' }}>{item.qty}</b></span>
      <span style={{ color: 'var(--text3)' }}>@ ₹{item.unitPrice}</span>
      <span style={{ fontWeight: 700, color: 'var(--accent2)', minWidth: 72, textAlign: 'right' }}>
        ₹{(item.qty * item.unitPrice).toFixed(2)}
      </span>
    </div>
  </div>
);

const SectionLabel = ({ color, emoji, label, subtotal, show }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 4px 6px',
    borderBottom: `1px solid ${color}44`,
    marginBottom: 6, marginTop: 4,
  }}>
    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {emoji} {label}
    </span>
    {show && (
      <span style={{ fontSize: 12, fontWeight: 700, color }}>₹{subtotal?.toFixed(2)}</span>
    )}
  </div>
);

/* ── Confirm Delete Modal ── */
const ConfirmDeleteModal = ({ bill, onCancel, onConfirm, loading }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }} onClick={onCancel}>
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 32px', width: 380, maxWidth: '92vw',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RiAlertLine style={{ color: '#ef4444', fontSize: 20 }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Delete Bill?</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>This action cannot be undone</div>
        </div>
      </div>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13,
      }}>
        <div><span style={{ color: 'var(--text3)' }}>Customer: </span><b>{bill.customerName}</b></div>
        <div><span style={{ color: 'var(--text3)' }}>Total: </span><b style={{ color: 'var(--accent2)' }}>₹{bill.grandTotal?.toFixed(2)}</b></div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
          ⚠️ Stock will be automatically restored for all items in this bill.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="btn"
          style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff' }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Deleting…' : '🗑 Delete Bill'}
        </button>
      </div>
    </motion.div>
  </div>
);

/* ── Edit Bill Modal ── */
const EditBillModal = ({ bill, onCancel, onSaved }) => {
  const [customerName, setCustomerName] = useState(bill.customerName);
  const [qrUsed, setQrUsed] = useState(bill.qrUsed);
  const [itemQtys, setItemQtys] = useState(
    Object.fromEntries(bill.items.map((li) => [li.item.toString(), li.qty]))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!customerName.trim()) return toast.error('Customer name is required');
    setSaving(true);
    try {
      const payload = {
        customerName,
        qrUsed,
        items: bill.items.map((li) => ({
          item: li.item.toString(),
          qty: Number(itemQtys[li.item.toString()]) || li.qty,
        })),
      };
      const { data } = await api.put(`/bills/${bill._id}`, payload);
      toast.success('Bill updated successfully!');
      onSaved(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '24px 28px', width: 480, maxWidth: '95vw',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RiEditLine style={{ color: 'var(--accent)', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Edit Bill</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Admin only · Stock auto-adjusted on save</div>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, padding: 4 }}
          >
            <RiCloseLine />
          </button>
        </div>

        {/* Customer name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
            Customer Name
          </label>
          <input
            className="form-input"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* QR Used */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
            QR Code
          </label>
          <select
            className="form-input"
            value={qrUsed}
            onChange={(e) => setQrUsed(e.target.value)}
            style={{ width: '100%' }}
          >
            {['QR1', 'QR2', 'QR3', 'QR4'].map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        {/* Item quantities */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Item Quantities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bill.items.map((li) => (
              <div key={li.item} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '9px 14px',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{li.name}</div>
                  <div style={{ fontSize: 11, color: CAT_COLOR[li.category] || 'var(--text3)', textTransform: 'capitalize' }}>
                    {li.category} · ₹{li.unitPrice} ea
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setItemQtys((prev) => ({
                      ...prev,
                      [li.item]: Math.max(1, (Number(prev[li.item]) || 1) - 1),
                    }))}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: 15,
                    }}
                  >−</button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
                    {itemQtys[li.item] ?? li.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemQtys((prev) => ({
                      ...prev,
                      [li.item]: (Number(prev[li.item]) || 1) + 1,
                    }))}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: 15,
                    }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn"
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={handleSave}
            disabled={saving}
          >
            <RiSaveLine />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Main Export
══════════════════════════════════════════════════════════════ */

/**
 * BillExpandedView — renders sectioned item breakdown + totals footer
 * Admin users additionally see Delete and Edit controls.
 */
export default function BillExpandedView({ bill: initialBill, colSpan = 9, onDeleted, onUpdated }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [bill, setBill] = useState(initialBill);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const polaroids = bill.items?.filter((i) => i.category === 'polaroid') ?? [];
  const others    = bill.items?.filter((i) => i.category !== 'polaroid') ?? [];

  const polaroidSubtotal = polaroids.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const othersSubtotal   = others.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  const fmt = (dt) => new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/bills/${bill._id}`);
      toast.success('Bill deleted & stock restored');
      setShowDelete(false);
      onDeleted?.(bill._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete bill');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = (updatedBill) => {
    setBill(updatedBill);
    setShowEdit(false);
    onUpdated?.(updatedBill);
  };

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td colSpan={colSpan} style={{ padding: 0 }}>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', background: 'var(--bg2)', borderLeft: '3px solid var(--accent)' }}
            >
              <div style={{ padding: '12px 24px 16px' }}>

                {/* ── Header ── */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 14,
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🧾 Bill Summary — <span style={{ color: 'var(--text)' }}>{bill.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      by {bill.createdBy?.name} · {fmt(bill.createdAt)}
                    </div>

                    {/* ── Admin-only action buttons ── */}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <motion.button
                          id={`edit-bill-${bill._id}`}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
                          title="Edit bill (admin only)"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 8, border: '1px solid var(--accent)',
                            background: 'rgba(139,92,246,0.1)', color: 'var(--accent)',
                            cursor: 'pointer', fontWeight: 600, fontSize: 12,
                          }}
                        >
                          <RiEditLine /> Edit
                        </motion.button>
                        <motion.button
                          id={`delete-bill-${bill._id}`}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
                          title="Delete bill (admin only)"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 8, border: '1px solid #ef444488',
                            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                            cursor: 'pointer', fontWeight: 600, fontSize: 12,
                          }}
                        >
                          <RiDeleteBinLine /> Delete
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section 1: Polaroids ── */}
                {polaroids.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <SectionLabel
                      emoji="📸" label="Polaroids"
                      color="var(--yellow)"
                      subtotal={polaroidSubtotal}
                      show={isAdmin}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {polaroids.map((item, i) => <ItemRow key={i} item={item} />)}
                    </div>
                  </div>
                )}

                {/* ── Section 2: Posters & Stickers ── */}
                {others.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <SectionLabel
                      emoji="🎨" label="Posters & Stickers"
                      color="var(--cyan2)"
                      subtotal={othersSubtotal}
                      show={isAdmin}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {others.map((item, i) => <ItemRow key={i} item={item} />)}
                    </div>
                  </div>
                )}

                {/* ── Totals footer ── */}
                <div style={{
                  borderTop: '1px solid var(--border)', paddingTop: 12,
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 28,
                  flexWrap: 'wrap',
                }}>
                  {isAdmin && (
                    <>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>📸 Polaroids</div>
                        <div style={{ fontWeight: 700, color: 'var(--yellow)', fontSize: 14 }}>
                          ₹{bill.polaroidTotal?.toFixed(2) ?? polaroidSubtotal.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>🎨 Posters &amp; Stickers</div>
                        <div style={{ fontWeight: 700, color: 'var(--cyan2)', fontSize: 14 }}>
                          ₹{bill.othersTotal?.toFixed(2) ?? othersSubtotal.toFixed(2)}
                        </div>
                      </div>
                    </>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Grand Total</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent2)', fontSize: 18 }}>
                      ₹{bill.grandTotal?.toFixed(2)}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </td>
      </tr>

      {/* ── Modals (rendered via portals conceptually, but positioned fixed so z-index works) ── */}
      <AnimatePresence>
        {showDelete && (
          <ConfirmDeleteModal
            bill={bill}
            onCancel={() => setShowDelete(false)}
            onConfirm={handleDelete}
            loading={deleting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && (
          <EditBillModal
            bill={bill}
            onCancel={() => setShowEdit(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </>
  );
}
