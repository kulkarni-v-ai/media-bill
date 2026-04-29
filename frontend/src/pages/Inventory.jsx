import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { CategoryBadge, StockBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiSearchLine, RiAlertLine } from 'react-icons/ri';

const EMPTY_FORM = { name: '', category: 'polaroid', price: '', stock: '', lowStockThreshold: 5 };
const CATS = ['all', 'polaroid', 'poster', 'sticker'];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchItems = () => {
    setLoading(true);
    api.get('/items').then((r) => setItems(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, category: item.category, price: item.price, stock: item.stock, lowStockThreshold: item.lowStockThreshold }); setModal(true); };

  const handleSave = async () => {
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock), lowStockThreshold: Number(form.lowStockThreshold) };
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

  const filtered = items.filter((i) => {
    const matchCat = cat === 'all' || i.category === cat;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
  const outCount = items.filter((i) => i.stock === 0).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Inventory</h1>
            <p>{items.length} items · {lowStockCount > 0 && <span className="text-yellow">{lowStockCount} low stock</span>} {outCount > 0 && <span className="text-red"> · {outCount} out of stock</span>}</p>
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

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Threshold</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item) => (
                  <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={item.stock === 0 ? { background: 'rgba(239,68,68,0.04)' } : item.stock <= item.lowStockThreshold ? { background: 'rgba(245,158,11,0.04)' } : {}}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><CategoryBadge category={item.category} /></td>
                    <td style={{ fontWeight: 700 }}>₹{item.price}</td>
                    <td><StockBadge stock={item.stock} threshold={item.lowStockThreshold} /></td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{item.lowStockThreshold}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" onClick={() => openEdit(item)}><RiPencilLine /></button>
                          <button className="btn-icon" onClick={() => handleDelete(item._id)}><RiDeleteBinLine style={{ color: 'var(--red)' }} /></button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="empty-state"><p>No items found</p></div>}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Item' : 'Add Item'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </>}>
        {['name'].map((f) => (
          <div className="form-group" key={f}>
            <label className="form-label">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
            <input className="form-input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} placeholder={`Item ${f}`} />
          </div>
        ))}
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
      </Modal>
    </motion.div>
  );
}
