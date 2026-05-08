import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      key={item._id}
      className="cart-line"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      layout
    >
      <div className="cart-line-info">
        <div className="cart-line-name">{item.name || 'Unknown Item'}</div>
        <div className="cart-line-price">
          {item.hasDiscount ? (
            <>
              <span style={{ textDecoration: 'line-through', color: 'var(--text3)', marginRight: 8, fontSize: '0.85rem' }}>
                ₹{(item.totalOriginal || 0).toFixed(2)}
              </span>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                ₹{(item.totalDiscounted || 0).toFixed(2)}
              </span>
            </>
          ) : (
            <span>₹{(item.totalOriginal || 0).toFixed(2)}</span>
          )}
        </div>
      </div>
      <div className="qty-ctrl">
        <button className="qty-btn" onClick={() => onQtyChange(item._id, item.qty - 1)}>−</button>
        <span className="qty-num">{item.qty}</span>
        <button
          className="qty-btn"
          onClick={() => onQtyChange(item._id, item.qty + 1)}
          disabled={!item.stockRef && item.qty >= item.stock}
        >+</button>
      </div>
      <button className="btn-icon" onClick={() => onRemove(item._id)}>
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
        </>
      )}

      {others.length > 0 && (
        <>
          <div className="section-divider">🎨 Others</div>
          {others.map(renderLine)}
        </>
      )}
    </AnimatePresence>
  );
}

export const BillTotals = ({ cart, coupon }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const discountedCart = getDiscountedCart(cart || [], coupon);
  
  const polaroidTotal = discountedCart.filter(i => i.category === 'polaroid').reduce((s, i) => s + (i.totalDiscounted || 0), 0);
  const othersTotal = discountedCart.filter(i => i.category !== 'polaroid').reduce((s, i) => s + (i.totalDiscounted || 0), 0);
  const totalOriginal = discountedCart.reduce((s, i) => s + (i.totalOriginal || 0), 0);
  const totalDiscounted = polaroidTotal + othersTotal;
  const savings = Math.max(0, totalOriginal - totalDiscounted);

  return (
    <div>
      {isAdmin && (
        <>
          <div className="total-row"><span style={{ color: 'var(--text3)' }}>Polaroids</span><span>₹{polaroidTotal.toFixed(2)}</span></div>
          <div className="total-row"><span style={{ color: 'var(--text3)' }}>Others</span><span>₹{othersTotal.toFixed(2)}</span></div>
        </>
      )}
      {savings > 0 && (
        <div className="total-row">
          <span style={{ color: 'var(--green)', fontSize: '0.9rem' }}>Offer Savings ({coupon?.description || 'Offer Applied'})</span>
          <span style={{ color: 'var(--green)' }}>−₹{savings.toFixed(2)}</span>
        </div>
      )}
      <div className="total-row grand">
        <span>Grand Total</span>
        <span className="total-val">₹{totalDiscounted.toFixed(2)}</span>
      </div>
    </div>
  );
};
