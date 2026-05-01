import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { CategoryBadge, StockBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import {
  RiAddLine, RiPencilLine, RiDeleteBinLine,
  RiSearchLine, RiAlertLine, RiStackLine, RiLinkM,
} from 'react-icons/ri';

const EMPTY_FORM = { name: '', category: 'polaroid', price: '', stock: '', lowStockThreshold: 5, piecesPerUnit: 1 };
const CATS = ['all', 'polaroid', 'poster', 'sticker'];

export default function Inventory() {
  const [items, setItems]           = useState([]);
  const [centralMaster, setCentralMaster] = useState(null); // Polaroid Central Stock master
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [search, setSearch]         = useState('');
  const [cat, setCat]               = useState('all');
  const [loading, setLoading]       = useState(true);
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';

  // ── Add Stock modal state ─────────────────────────────────────
  const [stockTarget, setStockTarget] = useState(null);
  const [addQty, setAddQty]           = useState(1);
  const [addingStock, setAddingStock] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────
  const fetchItems = () => {
    setLoading(true);
    // Admin gets all items (including isActive:false master)
    const url = isAdmin ? '/items?all=true' : '/items';
    api.get(url)
      .then((r) => {
        const all = r.data;
        // Separate out the hidden central stock master
        const master = all.find((i) => !i.isActive && i.category === 'polaroid' && !i.stockRef);
        setCentralMaster(master ?? null);
        // Remaining active items for the main table
        setItems(all.filter((i) => i.isActive));
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  // ── Add Stock handler ─────────────────────────────────────────
  const openAddStock = (item) => { setStockTarget(item); setAddQty(1); };
  const closeAddStock = () => { setStockTarget(null); setAddQty(1); };

  const handleAddStock = async () => {
    if (!stockTarget || addQty < 1) return;
    setAddingStock(true);
    try {
      await api.put(`/items/${stockTarget._id}`, { stock: stockTarget.stock + Number(addQty) });
      toast.success(`+${addQty} added to "${stockTarget.name}"`);
      closeAddStock();
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setAddingStock(false);
    }
  };

  // ── Item CRUD ─────────────────────────────────────────────────
  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category,
      price: item.price, stock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      piecesPerUnit: item.piecesPerUnit ?? 1,
    });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        piecesPerUnit: Number(form.piecesPerUnit) || 1,
      };
      if (editing) await api.put(`/items/${editing._id}`, body);
      else await api.post('/items', body);
      toast.success(editing ? 'Item updated' : 'Item created');
      setModal(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving item'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item?')) return;
    try { await api.delete(`/items/${id}`); toast.success('Item removed'); fetchItems(); }
    catch { toast.error('Failed to remove'); }
  };

  // ── Derived data ──────────────────────────────────────────────
  const filtered = items.filter((i) => {
    const matchCat    = cat === 'all' || i.category === cat;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
  const outCount      = items.filter((i) => i.stock === 0 && !i.stockRef).length;

  // For polaroid variants, effective stock = master stock
  const effectiveStock = (item) => {
    if (item.stockRef) {
      // stockRef may be populated or just an ID; handle both
      return item.stockRef?.stock ?? centralMaster?.stock ?? 0;
    }
    return item.stock;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Inventory</h1>
            <p>
              {items.length} items
              {lowStockCount > 0 && <> · <span className="text-yellow">{lowStockCount} low stock</span></>}
              {outCount > 0 && <> · <span className="text-red">{outCount} out of stock</span></>}
            </p>
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}><RiAddLine /> Add Item</button>}
        </div>
      </div>

      {(lowStockCount > 0 || outCount > 0) && (
        <div className={`alert-banner ${outCount > 0 ? 'alert-danger' : 'alert-warning'} mb-16`}>
          <RiAlertLine />
          {outCount > 0 && <span><strong>{outCount}</strong> item(s) out of stock — billing blocked. </span>}
          {lowStockCount > 0 && <span><strong>{lowStockCount}</strong> item(s) running low.</span>}
        </div>
      )}

      {/* ── Polaroid Central Stock card ── */}
      {centralMaster && (
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(234,179,8,0.03) 100%)',
            border: '1.5px solid rgba(234,179,8,0.35)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: 'rgba(234,179,8,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>📸</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--yellow)' }}>
                Polaroid Central Stock
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                Physical polaroids in hand — all variants draw from this pool
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Single (₹129)', ppu: 1 },
                  { label: 'Group of 2 (₹219)', ppu: 2 },
                  { label: 'Pack of 5 (₹519)', ppu: 5 },
                ].map(({ label, ppu }) => (
                  <span key={label} style={{
                    fontSize: 11, color: 'var(--text3)',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '2px 8px',
                  }}>
                    <RiLinkM style={{ verticalAlign: 'middle', marginRight: 3, color: 'var(--yellow)' }} />
                    {label} · uses {ppu}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Total Stock</div>
              <div style={{
                fontWeight: 800, fontSize: 26,
                color: centralMaster.stock === 0
                  ? '#ef4444'
                  : centralMaster.stock <= centralMaster.lowStockThreshold
                    ? 'var(--yellow)'
                    : 'var(--green)',
              }}>
                {centralMaster.stock}
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text3)', marginLeft: 4 }}>units</span>
              </div>
              {centralMaster.stock <= centralMaster.lowStockThreshold && centralMaster.stock > 0 && (
                <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 2 }}>⚠ Low stock</div>
              )}
              {centralMaster.stock === 0 && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>✕ Out of stock</div>
              )}
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                className="btn btn-primary"
                style={{
                  background: 'var(--yellow)', borderColor: 'var(--yellow)', color: '#000',
                  display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700,
                }}
                onClick={() => openAddStock(centralMaster)}
              >
                <RiStackLine /> Restock
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Filters ── */}
      <div className="filter-bar mb-16">
        <div className="search-input">
          <RiSearchLine className="search-icon" />
          <input className="form-input" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pill-tabs">
          {CATS.map((c) => (
            <button key={c} className={`pill-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Threshold</th>
                <th style={{ color: 'var(--yellow)' }}>Pieces/Unit</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item) => {
                  const effStock = effectiveStock(item);
                  const isCentralised = !!item.stockRef;
                  const isOut = effStock === 0;
                  const isLow = effStock > 0 && effStock <= (centralMaster?.lowStockThreshold ?? item.lowStockThreshold);

                  return (
                    <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={isOut ? { background: 'rgba(239,68,68,0.04)' } : isLow ? { background: 'rgba(245,158,11,0.04)' } : {}}>
                      <td style={{ fontWeight: 600 }}>
                        {item.name}
                        {isCentralised && (
                          <span style={{
                            marginLeft: 8, fontSize: 10, color: 'var(--yellow)',
                            background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)',
                            borderRadius: 4, padding: '1px 6px', verticalAlign: 'middle',
                          }}>central</span>
                        )}
                      </td>
                      <td><CategoryBadge category={item.category} /></td>
                      <td style={{ fontWeight: 700 }}>₹{item.price}</td>
                      <td>
                        {isCentralised ? (
                          <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                            <RiLinkM style={{ verticalAlign: 'middle', color: 'var(--yellow)', marginRight: 3 }} />
                            {effStock} (shared)
                          </span>
                        ) : (
                          <StockBadge stock={item.stock} threshold={item.lowStockThreshold} />
                        )}
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{isCentralised ? '—' : item.lowStockThreshold}</td>
                      <td>
                        {(item.piecesPerUnit ?? 1) > 1 ? (
                          <span style={{
                            fontWeight: 700, color: 'var(--yellow)',
                            background: 'rgba(234,179,8,0.1)', borderRadius: 6,
                            padding: '2px 8px', fontSize: 12,
                          }}>
                            ×{item.piecesPerUnit}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>×1</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {/* Polaroid variants use the master's Add Stock; other items get their own */}
                            {!isCentralised && (
                              <motion.button
                                id={`add-stock-${item._id}`}
                                className="btn-icon"
                                title="Add stock"
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                                onClick={() => openAddStock(item)}
                                style={{ color: 'var(--green)', borderColor: 'var(--green)44', background: 'rgba(34,197,94,0.07)' }}
                              >
                                <RiStackLine />
                              </motion.button>
                            )}
                            <button className="btn-icon" onClick={() => openEdit(item)}><RiPencilLine /></button>
                            <button className="btn-icon" onClick={() => handleDelete(item._id)}><RiDeleteBinLine style={{ color: 'var(--red)' }} /></button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No items found</p></div>}
        </div>
      </div>

      {/* ── Add / Edit Item Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Item' : 'Add Item'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </>}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="polaroid">Polaroid</option>
            <option value="poster">Poster</option>
            <option value="sticker">Sticker</option>
          </select>
        </div>
        {[['price', 'Price (₹)'], ['stock', 'Stock Quantity'], ['lowStockThreshold', 'Low Stock Threshold']].map(([f, label]) => (
          <div className="form-group" key={f}>
            <label className="form-label">{label}</label>
            <input className="form-input" type="number" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} min="0" />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--yellow)' }}>Pieces Per Unit (polaroid packs)</label>
          <input className="form-input" type="number" min="1" value={form.piecesPerUnit}
            onChange={(e) => setForm({ ...form, piecesPerUnit: e.target.value })} />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            How many physical polaroids does one sale of this item consume? (default 1)
          </div>
        </div>
      </Modal>

      {/* ── Add Stock Modal ── */}
      <AnimatePresence>
        {stockTarget && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={closeAddStock}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '24px 28px', width: 360, maxWidth: '92vw',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RiStackLine style={{ color: 'var(--green)', fontSize: 18 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {stockTarget._id === centralMaster?._id ? '📸 Restock Polaroids' : 'Add Stock'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{stockTarget.name}</div>
                </div>
              </div>

              {/* Current stock display */}
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Current stock</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: stockTarget.stock === 0 ? 'var(--red)' : 'var(--text)' }}>
                  {stockTarget.stock} units
                </span>
              </div>

              {/* Qty stepper */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                  Quantity to Add
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button"
                    onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: 18 }}
                  >−</button>
                  <input
                    type="number" min="1" value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                    className="form-input"
                    style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 18 }}
                  />
                  <button type="button"
                    onClick={() => setAddQty((q) => q + 1)}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: 18 }}
                  >+</button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>
                  New total: <b style={{ color: 'var(--green)' }}>{stockTarget.stock + Number(addQty)} units</b>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={closeAddStock} disabled={addingStock}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, background: 'var(--green)', borderColor: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={handleAddStock}
                  disabled={addingStock}
                >
                  <RiAddLine />
                  {addingStock ? 'Updating…' : `Add ${addQty} to Stock`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
