import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ItemCard from '../components/billing/ItemCard';
import BillSummary, { BillTotals } from '../components/billing/BillSummary';
import QRSelector from '../components/billing/QRSelector';
import { RiShoppingCartLine, RiSearchLine, RiPrinterLine, RiDeleteBinLine, RiCheckLine } from 'react-icons/ri';

const CATS = ['all', 'polaroid', 'poster', 'sticker'];

export default function Billing() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [customerName, setCustomerName] = useState('');
  const [qrUsed, setQrUsed] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const printRef = useRef();

  const fetchItems = () => {
    api.get('/items').then((r) => setItems(r.data)).catch(() => toast.error('Failed to load items'));
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((i) => {
    const matchCat = cat === 'all' || i.category === cat;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item) => {
    if (item.stock === 0) { toast.error(`"${item.name}" is out of stock!`); return; }
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) {
        if (existing.qty >= item.stock) { toast.error(`Max stock (${item.stock}) reached for "${item.name}"`); return prev; }
        return prev.map((c) => c._id === item._id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, newQty) => {
    if (newQty <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((c) => {
      if (c._id !== id) return c;
      if (newQty > c.stock) { toast.error(`Only ${c.stock} in stock`); return c; }
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c._id !== id));
  const clearCart = () => { setCart([]); setCustomerName(''); setQrUsed(''); };

  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error('Enter customer name'); return; }
    if (cart.length === 0) { toast.error('Add at least one item'); return; }
    if (!qrUsed) { toast.error('Select a payment QR'); return; }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        cartItems: cart.map((c) => ({ itemId: c._id, qty: c.qty })),
        qrUsed,
      };
      const { data } = await api.post('/bills', payload);
      setLastBill(data);
      toast.success('Bill created successfully!');
      clearCart();
      fetchItems(); // refresh stock
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create bill';
      toast.error(msg);
      if (err.response?.data?.outOfStock || err.response?.data?.insufficientStock) {
        fetchItems(); // refresh stock display
      }
    } finally { setSubmitting(false); }
  };

  const handlePrint = () => window.print();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header no-print">
        <h1>New Bill</h1>
        <p>Select items and generate a bill</p>
      </div>

      {/* Print receipt */}
      {lastBill && (
        <motion.div
          className="card alert-success mb-16 no-print"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RiCheckLine style={{ fontSize: 20 }} />
            <span>Bill #{lastBill._id.slice(-6).toUpperCase()} created for <strong>{lastBill.customerName}</strong> — ₹{lastBill.grandTotal}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handlePrint}><RiPrinterLine /> Print</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setLastBill(null)}>Dismiss</button>
          </div>
        </motion.div>
      )}

      <div className="billing-layout">
        {/* Left: Items */}
        <div className="billing-items no-print">
          <div className="filter-bar">
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

          {filtered.length === 0 ? (
            <div className="empty-state"><p>No items found</p></div>
          ) : (
            <div className="items-grid">
              <AnimatePresence>
                {filtered.map((item) => (
                  <ItemCard
                    key={item._id} item={item}
                    inCart={cart.some((c) => c._id === item._id)}
                    onAdd={addToCart}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="billing-cart no-print">
          <div className="cart-panel">
            <div className="cart-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiShoppingCartLine style={{ fontSize: 18, color: 'var(--accent2)' }} />
                <span style={{ fontWeight: 700 }}>Cart</span>
                {cart.length > 0 && <span className="badge badge-admin">{cart.reduce((s, c) => s + c.qty, 0)}</span>}
              </div>
              {cart.length > 0 && (
                <button className="btn-icon" onClick={clearCart}><RiDeleteBinLine style={{ fontSize: 14 }} /></button>
              )}
            </div>

            <div className="cart-body">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <RiShoppingCartLine style={{ fontSize: 32, margin: '0 auto 8px', color: 'var(--text3)' }} />
                  <p>Cart is empty</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Click items to add them</p>
                </div>
              ) : (
                <BillSummary cart={cart} onQtyChange={updateQty} onRemove={removeFromCart} />
              )}
            </div>

            <div className="cart-footer">
              <BillTotals cart={cart} />
              <div className="divider" />
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  className="form-input" placeholder="Enter customer name"
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <QRSelector selected={qrUsed} onChange={setQrUsed} />
              <motion.button
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 12 }}
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0 || !customerName || !qrUsed}
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? 'Processing…' : '✓ Confirm Bill'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Print receipt (hidden until print) */}
      {lastBill && (
        <div className="print-only" ref={printRef} style={{ display: 'none' }}>
          <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: 320, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center' }}>Media POS — Receipt</h2>
            <p style={{ textAlign: 'center', fontSize: 12 }}>Bill #{lastBill._id.slice(-6).toUpperCase()}</p>
            <p style={{ textAlign: 'center', fontSize: 12 }}>{new Date(lastBill.createdAt).toLocaleString('en-IN')}</p>
            <hr style={{ margin: '12px 0' }} />
            <p><strong>Customer:</strong> {lastBill.customerName}</p>
            <p><strong>Payment:</strong> {lastBill.qrUsed}</p>
            <hr style={{ margin: '12px 0' }} />
            {lastBill.items?.map((li, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{li.name} × {li.qty}</span>
                <span>₹{li.subtotal}</span>
              </div>
            ))}
            <hr style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
              <span>TOTAL</span><span>₹{lastBill.grandTotal}</span>
            </div>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>Thank you!</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
