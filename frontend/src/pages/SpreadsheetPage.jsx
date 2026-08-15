import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlinePencil, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

const STATUS_COLORS = {
  not_connected: '#94a3b8', connected: '#22c55e', interested: '#3b82f6',
  highly_interested: '#8b5cf6', not_interested: '#ef4444', course_joined: '#22c55e',
  workshop_joined: '#06b6d4', center_visited: '#22c55e', follow_up: '#eab308', online_mode: '#22c55e'
};

const COLUMNS = ['Name', 'Phone', 'Email', 'Status', 'Tags', 'Last Message', 'Created'];

export default function SpreadsheetPage() {
  const [contacts, setContacts] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts?limit=100');
      setContacts(res.data.contacts || []);
    } catch (err) { console.error(err); }
  };

  const startEdit = (id, field, value) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    try {
      const update = {};
      if (editingCell.field === 'tags') {
        update.tags = editValue.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        update[editingCell.field] = editValue;
      }
      await api.put(`/contacts/${editingCell.id}`, update);
      fetchContacts();
    } catch (err) { console.error(err); }
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const isEditing = (id, field) => editingCell?.id === id && editingCell?.field === field;

  const renderCell = (contact, field) => {
    if (isEditing(contact._id, field)) {
      return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {field === 'status' ? (
            <select className="select" value={editValue} onChange={e => setEditValue(e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }} autoFocus>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          ) : (
            <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus style={{ fontSize: 12, padding: '4px 8px' }} />
          )}
          <button onClick={saveEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-success)' }}><HiOutlineCheck /></button>
          <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-error)' }}><HiOutlineX /></button>
        </div>
      );
    }

    const value = field === 'tags' ? (contact.tags || []).join(', ') : contact[field] || '';

    return (
      <div
        onClick={() => startEdit(contact._id, field, field === 'tags' ? (contact.tags || []).join(', ') : contact[field])}
        style={{ cursor: 'pointer', minHeight: 20, padding: '2px 4px', borderRadius: 4, transition: 'background 150ms' }}
        onMouseEnter={e => e.target.style.background = 'rgba(249,115,22,0.06)'}
        onMouseLeave={e => e.target.style.background = 'transparent'}
      >
        {field === 'status' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[value] || '#94a3b8' }}></span>
            {value.replace(/_/g, ' ')}
          </span>
        ) : (
          value || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Click to edit</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">📋</span>
          <div>
            <h1 className="page-title">CRM Spreadsheet</h1>
            <p className="page-subtitle">{contacts.length} contacts • Click any cell to edit</p>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="table-container animate-fade-in" style={{ maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
          <table className="table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                {COLUMNS.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr key={contact._id}>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{i + 1}</td>
                  <td>{renderCell(contact, 'name')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{contact.phone}</td>
                  <td>{renderCell(contact, 'email')}</td>
                  <td>{renderCell(contact, 'status')}</td>
                  <td>{renderCell(contact, 'tags')}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {new Date(contact.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No Data</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
