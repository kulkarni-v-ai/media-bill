import { motion } from 'framer-motion';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { getDiscountedCart } from '../../utils/couponEstimator';

export default function BillSummary({ cart, onQtyChange, onRemove, coupon }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Apply offer logic to get discounted prices for display
  const discountedCart = getDiscountedCart(cart || [], coupon);

  const polaroids = discountedCart.filter((i) => i.category === 'polaroid');
  const others = discountedCart.filter((i) => i.category !== 'polaroid');

  const renderLine = (item) => (
    <div key={item._id} className="cart-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="cart-line-info" style={{ flex: 1 }}>
        <div className="cart-line-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name || 'Item'}</div>
        <div className="cart-line-price" style={{ fontSize: '0.9rem' }}>
          {item.hasDiscount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--text3)' }}>
                ₹{(item.totalOriginal || 0).toFixed(2)}
              </span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>
                ₹{(item.totalDiscounted || 0).toFixed(2)}
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--text2)' }}>₹{(item.totalOriginal || 0).toFixed(2)}</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="qty-ctrl" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', padding: '4px 8px', borderRadius: 8 }}>
          <button className="qty-btn" onClick={() => onQtyChange(item._id, item.qty - 1)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text)' }}>−</button>
          <span className="qty-num" style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
          <button
            className="qty-btn"
            onClick={() => onQtyChange(item._id, item.qty + 1)}
            disabled={!item.stockRef && item.qty >= item.stock}
            style={{ cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text)' }}
          >+</button>
        </div>
        <button onClick={() => onRemove(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <RiDeleteBinLine style={{ fontSize: 16, color: '#ef4444' }} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {polaroids.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="section-divider" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>📸 Polaroids</div>
          {polaroids.map(renderLine)}
        </div>
      )}

      {others.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="section-divider" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>🎨 Others</div>
          {others.map(renderLine)}
        </div>
      )}
    </div>
  );
}

export const BillTotals = ({ cart, coupon }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const discountedCart = getDiscountedCart(cart || [], coupon);
  
  const polaroidOriginal = discountedCart.filter(i => i.category === 'polaroid').reduce((s, i) => s + (i.totalOriginal || 0), 0);
  const othersOriginal = discountedCart.filter(i => i.category !== 'polaroid').reduce((s, i) => s + (i.totalOriginal || 0), 0);
  const totalOriginal = polaroidOriginal + othersOriginal;
  const totalDiscounted = discountedCart.reduce((s, i) => s + (i.totalDiscounted || 0), 0);
  const savings = Math.max(0, totalOriginal - totalDiscounted);

  return (
    <div style={{ marginTop: 12 }}>
      {isAdmin && (
        <>
          <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}><span style={{ color: 'var(--text3)' }}>Polaroids</span><span>₹{polaroidOriginal.toFixed(2)}</span></div>
          <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span style={{ color: 'var(--text3)' }}>Others</span><span>₹{othersOriginal.toFixed(2)}</span></div>
        </>
      )}
      {savings > 0 && (
        <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--green)', fontSize: '0.9rem', fontWeight: 600 }}>Offer Savings ({coupon?.description || 'Applied'})</span>
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>−₹{savings.toFixed(2)}</span>
        </div>
      )}
      <div className="total-row grand" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Grand Total</span>
        <span className="total-val" style={{ fontWeight: 800, fontSize: 20, color: 'var(--accent2)' }}>₹{totalDiscounted.toFixed(2)}</span>
      </div>
    </div>
  );
};
