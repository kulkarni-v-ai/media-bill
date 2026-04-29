import { motion, AnimatePresence } from 'framer-motion';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

export default function BillSummary({ cart, onQtyChange, onRemove }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const polaroids = cart.filter((i) => i.category === 'polaroid');
  const others = cart.filter((i) => i.category !== 'polaroid');

  const polaroidTotal = polaroids.reduce((s, i) => s + i.price * i.qty, 0);
  const othersTotal = others.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = polaroidTotal + othersTotal;

  const renderLine = (item) => (
    <motion.div
      key={item._id}
      className="cart-line"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <div className="cart-line-info">
        <div className="cart-line-name">{item.name}</div>
        <div className="cart-line-price">₹{item.price} × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div className="qty-ctrl">
        <button className="qty-btn" onClick={() => onQtyChange(item._id, item.qty - 1)}>−</button>
        <span className="qty-num">{item.qty}</span>
        <button
          className="qty-btn"
          onClick={() => onQtyChange(item._id, item.qty + 1)}
          disabled={item.qty >= item.stock}
          title={item.qty >= item.stock ? 'Max stock reached' : ''}
        >+</button>
      </div>
      <button className="btn-icon" onClick={() => onRemove(item._id)} style={{ padding: '4px 6px' }}>
        <RiDeleteBinLine style={{ fontSize: 14, color: 'var(--red)' }} />
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence mode="popLayout">
      {polaroids.length > 0 && (
        <>
          <div className="section-divider">📸 Polaroids</div>
          {polaroids.map(renderLine)}
          {isAdmin && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right', marginBottom: 4 }}>
              Polaroid subtotal: ₹{polaroidTotal.toFixed(2)}
            </div>
          )}
        </>
      )}
      {others.length > 0 && (
        <>
          <div className="section-divider">🎨 Posters & Stickers</div>
          {others.map(renderLine)}
          {isAdmin && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right', marginBottom: 4 }}>
              Others subtotal: ₹{othersTotal.toFixed(2)}
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export const BillTotals = ({ cart }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const polaroids = cart.filter((i) => i.category === 'polaroid');
  const others = cart.filter((i) => i.category !== 'polaroid');
  const polaroidTotal = polaroids.reduce((s, i) => s + i.price * i.qty, 0);
  const othersTotal = others.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = polaroidTotal + othersTotal;

  return (
    <div>
      {isAdmin && grandTotal > 0 && (
        <>
          <div className="total-row"><span style={{ color: 'var(--text3)' }}>Polaroids</span><span>₹{polaroidTotal.toFixed(2)}</span></div>
          <div className="total-row"><span style={{ color: 'var(--text3)' }}>Others</span><span>₹{othersTotal.toFixed(2)}</span></div>
        </>
      )}
      <div className="total-row grand">
        <span>Grand Total</span>
        <span className="total-val">₹{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
