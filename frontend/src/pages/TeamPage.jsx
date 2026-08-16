import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineShieldCheck } from 'react-icons/hi';

const ROLE_COLORS = { admin: 'tag-purple', manager: 'tag-blue', agent: 'tag-green' };

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/team');
      setMembers(res.data.members || []);
    } catch (err) { console.error(err); }
  };

  const addMember = async () => {
    try {
      await api.post('/team', form);
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'agent' });
      fetchMembers();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const updateRole = async (id, role) => {
    try {
      await api.put(`/team/${id}`, { role });
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role');
      fetchMembers();
    }
  };

  const deleteMember = async (id) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await api.delete(`/team/${id}`);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">👥</span>
          <div>
            <h1 className="page-title">Team Management</h1>
            <p className="page-subtitle">{members.length} team members</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><HiOutlinePlus /> Add Member</button>
      </div>

      <div className="app-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }} className="animate-fade-in">
          {members.map(m => (
            <div key={m._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="chat-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                  {(m.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <HiOutlineShieldCheck style={{ color: 'var(--text-tertiary)', fontSize: 14 }} />
                  <select className="select" value={m.role} onChange={e => updateRole(m._id, e.target.value)} style={{ padding: '4px 8px', fontSize: 11 }}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`tag ${m.status === 'active' ? 'tag-green' : 'tag-gray'}`}>{m.status || 'active'}</span>
                  <button className="btn btn-icon btn-danger" onClick={() => deleteMember(m._id)} style={{ width: 28, height: 28 }}><HiOutlineTrash size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Team Member</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group"><label className="input-label">Name *</label><input className="input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="input-group"><label className="input-label">Email *</label><input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="input-group"><label className="input-label">Password *</label><input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%' }}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
