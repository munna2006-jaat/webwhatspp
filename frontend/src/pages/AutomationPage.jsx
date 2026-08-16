import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlinePlus, HiOutlineLightningBolt, HiOutlineTrash } from 'react-icons/hi';

const TRIGGER_OPTIONS = [
  { value: 'keyword', label: 'Keyword Match', desc: 'When message contains specific keywords' },
  { value: 'first_message', label: 'First Message', desc: 'When a new contact messages for the first time' },
  { value: 'off_hours', label: 'Off Hours', desc: 'When message received outside working hours' },
];

const ACTION_OPTIONS = [
  { value: 'send_text', label: 'Send Text Message' },
  { value: 'send_template', label: 'Send Template' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'change_status', label: 'Change Status' },
];

export default function AutomationPage() {
  const [automations, setAutomations] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'keyword', conditions: { keywords: '' }, actions: [{ type: 'send_text', payload: { text: '' } }] });

  useEffect(() => { fetchAutomations(); }, []);

  const fetchAutomations = async () => {
    try {
      const res = await api.get('/automations');
      setAutomations(res.data.automations || []);
    } catch (err) { console.error(err); }
  };

  const toggleActive = async (id) => {
    await api.put(`/automations/${id}/toggle`);
    fetchAutomations();
  };

  const deleteAutomation = async (id) => {
    if (!confirm('Delete this automation?')) return;
    await api.delete(`/automations/${id}`);
    fetchAutomations();
  };

  const createAutomation = async () => {
    try {
      const rawKeywords = form.conditions?.keywords;
      const keywordsArray = typeof rawKeywords === 'string'
        ? rawKeywords.split(',').map(k => k.trim()).filter(Boolean)
        : (Array.isArray(rawKeywords) ? rawKeywords : []);

      const data = {
        ...form,
        conditions: { ...form.conditions, keywords: keywordsArray },
      };
      await api.post('/automations', data);
      setShowCreate(false);
      fetchAutomations();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">⚡</span>
          <div>
            <h1 className="page-title">Automation</h1>
            <p className="page-subtitle">Chatbot rules & auto-replies</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><HiOutlinePlus /> New Rule</button>
      </div>

      <div className="app-content">
        {automations.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">⚡</div>
            <div className="empty-state-title">No Automations</div>
            <div className="empty-state-text">Create automation rules for auto-replies, welcome messages, and more.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}><HiOutlinePlus /> Create Rule</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }} className="animate-fade-in">
            {automations.map(a => (
              <div key={a._id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <HiOutlineLightningBolt style={{ color: a.isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</h3>
                      <span className={`tag ${a.isActive ? 'tag-green' : 'tag-gray'}`}>{a.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Trigger: <strong>{a.trigger?.replace(/_/g, ' ')}</strong>
                      {a.conditions?.keywords?.length > 0 && ` • Keywords: ${a.conditions.keywords.join(', ')}`}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      Triggered {a.stats?.triggered || 0} times • Executed {a.stats?.executed || 0} times
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`btn btn-sm ${a.isActive ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleActive(a._id)}>
                      {a.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteAutomation(a._id)}><HiOutlineTrash /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Automation Rule</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Rule Name *</label>
                  <input className="input" placeholder="e.g. Welcome Message" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Trigger</label>
                  <select className="select" value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} style={{ width: '100%' }}>
                    {TRIGGER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
                  </select>
                </div>
                {form.trigger === 'keyword' && (
                  <div className="input-group">
                    <label className="input-label">Keywords (comma separated)</label>
                    <input className="input" placeholder="hi, hello, help, pricing" value={form.conditions.keywords} onChange={e => setForm({ ...form, conditions: { ...form.conditions, keywords: e.target.value } })} />
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">Action Type</label>
                  <select className="select" value={form.actions[0].type} onChange={e => setForm({ ...form, actions: [{ ...form.actions[0], type: e.target.value }] })} style={{ width: '100%' }}>
                    {ACTION_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                {form.actions[0].type === 'send_text' && (
                  <div className="input-group">
                    <label className="input-label">Reply Message</label>
                    <textarea className="input" placeholder="Hello! Thanks for reaching out..." value={form.actions[0].payload.text} onChange={e => setForm({ ...form, actions: [{ ...form.actions[0], payload: { text: e.target.value } }] })} />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createAutomation}>Create Rule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
