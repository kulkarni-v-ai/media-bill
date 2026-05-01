import { motion } from 'framer-motion';
import { CategoryBadge, StockBadge } from '../common/Badge';

export default function ItemCard({ item, inCart, onAdd, centralStock }) {
  // For polaroid variants, effective stock = central polaroid pool
  const effStock  = item.stockRef ? (centralStock ?? 0) : item.stock;
  const ppu       = item.piecesPerUnit ?? 1;
  // Max units sellable given available central stock
  const maxUnits  = ppu > 1 ? Math.floor(effStock / ppu) : effStock;
  const outOfStock = maxUnits === 0;
  const isLow      = maxUnits > 0 && maxUnits <= item.lowStockThreshold;

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
      {ppu > 1 && (
        <div style={{
          fontSize: 10, color: 'var(--yellow)', fontWeight: 700,
          background: 'rgba(234,179,8,0.1)', borderRadius: 4,
          padding: '1px 6px', marginTop: 2, display: 'inline-block',
        }}>
          uses {ppu} polaroids
        </div>
      )}
      <div className="item-stock">
        <StockBadge stock={maxUnits} threshold={item.lowStockThreshold} />
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
