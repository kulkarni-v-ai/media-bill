export const RoleBadge = ({ role }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

export const CategoryBadge = ({ category }) => (
  <span className={`badge badge-${category}`}>{category}</span>
);

export const StockBadge = ({ stock, threshold }) => {
  if (stock === 0) return <span className="badge badge-out">Out of Stock</span>;
  if (stock <= threshold) return <span className="badge badge-low">Low Stock ({stock})</span>;
  return <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ {stock}</span>;
};
