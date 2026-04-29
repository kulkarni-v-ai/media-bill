import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RiMailLine, RiLockLine, RiShoppingBag3Line } from 'react-icons/ri';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const ROLE_HOME = { admin: '/admin', manager: '/reports', cashier: '/billing', viewer: '/viewer' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%), var(--bg)',
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28,
            }}
          >
            <RiShoppingBag3Line color="#fff" />
          </motion.div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Media <span className="text-accent">POS</span></h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>Sign in to continue</p>
        </div>

        <div className="card" style={{ border: '1px solid var(--border2)' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <RiMailLine style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  className="form-input" type="email" placeholder="you@media.com"
                  style={{ paddingLeft: 36 }} value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <RiLockLine style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                <input
                  className="form-input" type="password" placeholder="••••••••"
                  style={{ paddingLeft: 36 }} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required
                />
              </div>
            </div>
            <motion.button
              className="btn btn-primary btn-full btn-lg" type="submit"
              disabled={loading} whileTap={{ scale: 0.97 }} style={{ marginTop: 8 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </motion.button>
          </form>
        </div>

        <div style={{ marginTop: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Demo Accounts</p>
          {[
            { role: 'Admin', email: 'admin@media.com', pass: 'admin123' },
            { role: 'Manager', email: 'manager@media.com', pass: 'manager123' },
            { role: 'Cashier', email: 'cashier@media.com', pass: 'cashier123' },
          ].map((d) => (
            <button key={d.role} onClick={() => setForm({ email: d.email, password: d.pass })}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text2)', fontSize: 12, padding: '3px 0', cursor: 'pointer' }}>
              <span className={`badge badge-${d.role.toLowerCase()}`} style={{ marginRight: 8 }}>{d.role}</span>
              {d.email}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
