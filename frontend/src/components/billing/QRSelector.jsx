import { RiQrCodeLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
 
const QR_OPTIONS = ['QR1', 'QR2', 'QR3', 'QR4', 'CASH'];
const QR_COLORS = {
  QR1: 'rgba(124,58,237,0.15)',
  QR2: 'rgba(6,182,212,0.15)',
  QR3: 'rgba(16,185,129,0.15)',
  QR4: 'rgba(245,158,11,0.15)',
  CASH: 'rgba(34,197,94,0.15)',
};

export default function QRSelector({ selected, onChange }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p className="form-label">Payment Method / QR</p>
      <div className="qr-grid">
        {QR_OPTIONS.map((qr) => (
          <motion.button
            key={qr}
            className={`qr-card ${selected === qr ? 'selected' : ''}`}
            onClick={() => onChange(qr)}
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.04 }}
            style={selected === qr ? { background: QR_COLORS[qr] } : {}}
            type="button"
          >
            <div className="qr-icon">
              {qr === 'CASH' ? <RiMoneyDollarCircleLine /> : <RiQrCodeLine />}
            </div>
            {qr}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
