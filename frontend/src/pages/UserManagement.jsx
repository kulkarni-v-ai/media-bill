import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { RoleBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiShieldLine } from 'react-icons/ri';

const EMPTY = { name: '', email: '', password: '', role: 'cashier' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const { user: me } = useAuth();

  const fetch = () => api.get('/users').then((r) => setUsers(r.data)).catch(() => toast.error('Failed to load users'));
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModal(true); };

  const handleSave = async () => {
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      if (editing) await api.put(`/users/${editing._id}`, body);
      else await api.post('/users', body);
      toast.success(editing ? 'User updated' : 'User created');
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deactivated'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1>User Management</h1><p>{users.length} users</p></div>
          <button className="btn btn-primary" onClick={openAdd}><RiAddLine /> Add User</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              <AnimatePresence>
                {users.map((u) => (
                  <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={!u.isActive ? { opacity: 0.5 } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{u.name[0]?.toUpperCase()}</div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                        {u._id === me._id && <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--card2)', padding: '2px 6px', borderRadius: 4 }}>You</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: u.isActive ? 'var(--green)' : 'var(--text3)' }}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(u)}><RiPencilLine /></button>
                        {u._id !== me._id && <button className="btn-icon" onClick={() => handleDelete(u._id)}><RiDeleteBinLine style={{ color: 'var(--red)' }} /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><RiShieldLine style={{ color: 'var(--accent2)' }} />{editing ? 'Edit User' : 'Add User'}</span>}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </>}>
        {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['password', editing ? 'New Password (leave blank to keep)' : 'Password', 'password']].map(([f, label, type]) => (
          <div className="form-group" key={f}>
            <label className="form-label">{label}</label>
            <input className="form-input" type={type} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} placeholder={label} required={f !== 'password' || !editing} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </Modal>
    </motion.div>
  );
}
