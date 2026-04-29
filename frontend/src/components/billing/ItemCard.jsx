import { motion } from 'framer-motion';
import { CategoryBadge, StockBadge } from '../common/Badge';

export default function ItemCard({ item, inCart, onAdd }) {
  const outOfStock = item.stock === 0;
  const isLow = item.stock > 0 && item.stock <= item.lowStockThreshold;

  return (
    <motion.div
      className={`item-card ${outOfStock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}`}
      onClick={() => !outOfStock && onAdd(item)}
      whileTap={!outOfStock ? { scale: 0.96 } : {}}
      layout
    >
      <CategoryBadge category={item.category} />
      <div className="item-name">{item.name}</div>
      <div className="item-price">₹{item.price}</div>
      <div className="item-stock">
        <StockBadge stock={item.stock} threshold={item.lowStockThreshold} />
      </div>
      {outOfStock && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 700,
          color: 'var(--red)', letterSpacing: 1, textTransform: 'uppercase',
        }}>
          Out of Stock
        </div>
      )}
    </motion.div>
  );
}
