import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CategoryBadge, StockBadge } from '../components/common/Badge';

export default function ViewerDashboard() {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  useEffect(() => { api.get('/items').then((r) => setItems(r.data)).catch(() => {}); }, []);

  const cats = ['polaroid', 'poster', 'sticker'];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Inventory Overview</h1>
        <p>Read-only view · {items.length} items</p>
      </div>
      {cats.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        if (!catItems.length) return null;
        return (
          <motion.div key={cat} className="card mb-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700, textTransform: 'capitalize' }}>{cat}s</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
                <tbody>
                  {catItems.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>₹{item.price}</td>
                      <td><StockBadge stock={item.stock} threshold={item.lowStockThreshold} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
