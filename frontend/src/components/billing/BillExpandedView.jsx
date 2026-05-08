import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { RiDeleteBinLine, RiEditLine, RiCloseLine, RiSaveLine, RiAlertLine, RiPriceTag3Line } from 'react-icons/ri';

const CAT_COLOR = { polaroid: 'var(--yellow)', poster: 'var(--cyan2)', sticker: 'var(--accent)', 'digital photo': 'var(--green)' };

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
      <span style={{ color: 'var(--text3)' }}>@ ₹{item.unitPrice.toFixed(2)}</span>
      <span style={{ fontWeight: 700, color: 'var(--accent2)', minWidth: 72, textAlign: 'right' }}>
        ₹{item.subtotal.toFixed(2)}
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
const ConfirmDeleteModal = ({ bill, onCancel, onConfirm, loading }) => {
  const [restock, setRestock] = useState(true);

  return (
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
          
          <div style={{ fontSize: 13, marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px dashed var(--border)' }}>
            <input 
              type="checkbox" 
              id="restock-checkbox" 
              checked={restock} 
              onChange={(e) => setRestock(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <label htmlFor="restock-checkbox" style={{ cursor: 'pointer', color: 'var(--text)', fontWeight: 600 }}>
              Restore stock for these items
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn" style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff' }} onClick={() => onConfirm(restock)} disabled={loading}>
            {loading ? 'Deleting…' : '🗑 Delete Bill'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiEditLine style={{ color: 'var(--accent)', fontSize: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Edit Bill</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Admin only · Stock auto-adjusted on save</div>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, padding: 4 }}><RiCloseLine /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Customer Name</label>
          <input className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>QR Code</label>
          <select className="form-input" value={qrUsed} onChange={(e) => setQrUsed(e.target.value)} style={{ width: '100%' }}>
            {['QR1', 'QR2', 'QR3', 'QR4', 'CASH'].map((q) => (<option key={q} value={q}>{q}</option>))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Item Quantities</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bill.items.map((li) => (
              <div key={li.item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 14px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{li.name}</div>
                  <div style={{ fontSize: 11, color: CAT_COLOR[li.category] || 'var(--text3)', textTransform: 'capitalize' }}>{li.category} · ₹{li.unitPrice} ea</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => setItemQtys((prev) => ({ ...prev, [li.item]: Math.max(1, (Number(prev[li.item]) || 1) - 1) }))} className="qty-btn" style={{ width: 28, height: 28 }}>−</button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{itemQtys[li.item] ?? li.qty}</span>
                  <button type="button" onClick={() => setItemQtys((prev) => ({ ...prev, [li.item]: (Number(prev[li.item]) || 1) + 1 }))} className="qty-btn" style={{ width: 28, height: 28 }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleSave} disabled={saving}>
            <RiSaveLine /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Main Export
   ══════════════════════════════════════════════════════════════ */

export default function BillExpandedView({ bill: initialBill, colSpan = 9, onDeleted, onUpdated }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [bill, setBill] = useState(initialBill);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const polaroids = bill.items?.filter((i) => i.category === 'polaroid') ?? [];
  const digitals = bill.items?.filter((i) => i.category === 'digital photo') ?? [];
  const others    = bill.items?.filter((i) => !['polaroid', 'digital photo'].includes(i.category)) ?? [];

  const polaroidSubtotal = polaroids.reduce((s, i) => s + i.subtotal, 0);
  const digitalSubtotal = digitals.reduce((s, i) => s + i.subtotal, 0);
  const othersSubtotal   = others.reduce((s, i) => s + i.subtotal, 0);
  
  const discountAmount = bill.discountAmount || 0;
  const grossTotal = bill.grandTotal + discountAmount;

  const fmt = (dt) => new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const handleDelete = async (restock) => {
    setDeleting(true);
    try {
      await api.delete(`/bills/${bill._id}?restock=${restock}`);
      toast.success(`Bill deleted${restock ? ' & stock restored' : ''}`);
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
              style={{ overflow: 'hidden', background: 'var(--bg2)', borderLeft: '4px solid var(--accent)' }}
            >
              <div style={{ padding: '16px 24px 20px' }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🧾 Detailed Breakdown — <span style={{ color: 'var(--text)' }}>{bill.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
                      Processed by {bill.createdBy?.name}<br/>{fmt(bill.createdAt)}
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowEdit(true)} className="btn btn-ghost btn-sm" style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)' }}><RiEditLine /> Edit</button>
                        <button onClick={() => setShowDelete(true)} className="btn btn-ghost btn-sm" style={{ border: '1.5px solid var(--red)', color: 'var(--red)' }}><RiDeleteBinLine /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Sections ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {polaroids.length > 0 && (
                    <div>
                      <SectionLabel emoji="📸" label="Polaroids" color="var(--yellow)" subtotal={polaroidSubtotal} show={isAdmin} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{polaroids.map((item, i) => <ItemRow key={i} item={item} />)}</div>
                    </div>
                  )}
                  {digitals.length > 0 && (
                    <div>
                      <SectionLabel emoji="📱" label="Digital Photos" color="var(--green)" subtotal={digitalSubtotal} show={isAdmin} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{digitals.map((item, i) => <ItemRow key={i} item={item} />)}</div>
                    </div>
                  )}
                  {others.length > 0 && (
                    <div>
                      <SectionLabel emoji="🎨" label="Posters & Stickers" color="var(--cyan2)" subtotal={othersSubtotal} show={isAdmin} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{others.map((item, i) => <ItemRow key={i} item={item} />)}</div>
                    </div>
                  )}
                </div>

                {/* ── Totals Panel ── */}
                <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
                  
                  <div style={{ display: 'flex', gap: 24 }}>
                     <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Sold Value (Gross)</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>₹{grossTotal.toFixed(2)}</div>
                     </div>
                     {discountAmount > 0 && (
                       <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 10, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 4 }}>Applied Offer</div>
                          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                             <RiPriceTag3Line /> −₹{discountAmount.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{bill.offerDescription || 'Offer Applied'}</div>
                       </div>
                     )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>Total Collected (Net)</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent2)', fontSize: 28, lineHeight: 1 }}>
                      ₹{bill.grandTotal.toFixed(2)}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </td>
      </tr>

      <AnimatePresence>
        {showDelete && <ConfirmDeleteModal bill={bill} onCancel={() => setShowDelete(false)} onConfirm={handleDelete} loading={deleting} />}
        {showEdit && <EditBillModal bill={bill} onCancel={() => setShowEdit(false)} onSaved={handleSaved} />}
      </AnimatePresence>
    </>
  );
}
