import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlineSearch, HiOutlinePlus, HiOutlineUpload, HiOutlineDownload, HiOutlineTrash, HiOutlineTag, HiOutlinePencil, HiOutlineX } from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'not_connected', label: 'Not Connected' },
  { value: 'connected', label: 'Connected' },
  { value: 'interested', label: 'Interested' },
  { value: 'highly_interested', label: 'Highly Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'course_joined', label: 'Course Joined' },
  { value: 'workshop_joined', label: 'Workshop Joined' },
  { value: 'center_visited', label: 'Center Visited' },
  { value: 'follow_up', label: 'Follow Up' },
];

const STATUS_COLORS = {
  not_connected: 'tag-gray', connected: 'tag-green', interested: 'tag-blue',
  highly_interested: 'tag-purple', not_interested: 'tag-red', course_joined: 'tag-green',
  workshop_joined: 'tag-cyan', center_visited: 'tag-green', follow_up: 'tag-yellow', online_mode: 'tag-green'
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ phone: '', name: '', email: '', status: 'not_connected', tags: '' });

  useEffect(() => { fetchContacts(); }, [page, search, statusFilter]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/contacts?${params}`);
      setContacts(res.data.contacts || []);
      setPagination(res.data.pagination || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditContact(null);
    setForm({ phone: '', name: '', email: '', status: 'not_connected', tags: '' });
    setShowModal(true);
  };

  const openEdit = (contact) => {
    setEditContact(contact);
    setForm({ phone: contact.phone, name: contact.name, email: contact.email, status: contact.status, tags: (contact.tags || []).join(', ') });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const data = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editContact) {
        await api.put(`/contacts/${editContact._id}`, data);
      } else {
        await api.post('/contacts', data);
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) { alert(err.response?.data?.error || 'Error saving contact'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await api.delete(`/contacts/${id}`);
    fetchContacts();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} contacts?`)) return;
    await api.post('/contacts/bulk-delete', { contactIds: selected });
    setSelected([]);
    fetchContacts();
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === contacts.length ? [] : contacts.map(c => c._id));
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">👥</span>
          <div>
            <h1 className="page-title">Contacts</h1>
            <p className="page-subtitle">{pagination.total || 0} total contacts</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><HiOutlineUpload /> Import</button>
          <button className="btn btn-secondary btn-sm"><HiOutlineDownload /> Export</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><HiOutlinePlus /> Add Contact</button>
        </div>
      </div>

      <div className="app-content">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input className="input" placeholder="Search by name, phone, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: '100%', paddingLeft: 36 }} />
          </div>
          <select className="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {selected.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <HiOutlineTrash /> Delete ({selected.length})
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.length === contacts.length && contacts.length > 0} onChange={toggleAll} /></th>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Last Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact._id}>
                  <td><input type="checkbox" checked={selected.includes(contact._id)} onChange={() => toggleSelect(contact._id)} /></td>
                  <td style={{ fontWeight: 600 }}>{contact.name || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{contact.phone}</td>
                  <td>
                    <span className={`tag ${STATUS_COLORS[contact.status] || 'tag-gray'}`}>
                      {contact.status?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {(contact.tags || []).slice(0, 3).map(t => <span key={t} className="tag tag-orange">{t}</span>)}
                      {(contact.tags || []).length > 3 && <span className="tag tag-gray">+{contact.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-icon btn-secondary" onClick={() => openEdit(contact)} style={{ width: 28, height: 28 }}><HiOutlinePencil size={14} /></button>
                      <button className="btn btn-icon btn-danger" onClick={() => handleDelete(contact._id)} style={{ width: 28, height: 28 }}><HiOutlineTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-title">No Contacts</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editContact ? 'Edit Contact' : 'Add Contact'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Phone Number *</label>
                  <input className="input" placeholder="919876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={!!editContact} />
                </div>
                <div className="input-group">
                  <label className="input-label">Name</label>
                  <input className="input" placeholder="Contact name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%' }}>
                    {STATUS_OPTIONS.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Tags (comma separated)</label>
                  <input className="input" placeholder="vip, premium, lead" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editContact ? 'Update' : 'Add Contact'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
