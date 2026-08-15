import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePlay, HiOutlinePause, HiOutlineChartBar } from 'react-icons/hi';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', templateName: '', templateLanguage: 'en', audience: { tags: '', statuses: '' } });

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data.campaigns || []);
    } catch (err) { console.error(err); }
  };

  const createCampaign = async () => {
    try {
      const data = {
        ...form,
        audience: {
          tags: form.audience.tags ? form.audience.tags.split(',').map(t => t.trim()) : [],
          statuses: form.audience.statuses ? form.audience.statuses.split(',').map(s => s.trim()) : []
        }
      };
      await api.post('/campaigns', data);
      setShowCreate(false);
      setForm({ name: '', description: '', templateName: '', templateLanguage: 'en', audience: { tags: '', statuses: '' } });
      fetchCampaigns();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/campaigns/${id}/status`, { status });
    fetchCampaigns();
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    await api.delete(`/campaigns/${id}`);
    fetchCampaigns();
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">📢</span>
          <div>
            <h1 className="page-title">Campaigns</h1>
            <p className="page-subtitle">Bulk WhatsApp messaging</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><HiOutlinePlus /> New Campaign</button>
      </div>

      <div className="app-content">
        {campaigns.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">📢</div>
            <div className="empty-state-title">No Campaigns Yet</div>
            <div className="empty-state-text">Create your first campaign to send bulk messages to contacts.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}><HiOutlinePlus /> Create Campaign</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }} className="animate-fade-in">
            {campaigns.map(c => (
              <div key={c._id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{c.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`status-badge ${c.status}`}>{c.status}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Template: {c.templateName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>📤 {c.stats?.sent || 0}</span>
                      <span style={{ color: 'var(--status-success)' }}>✓✓ {c.stats?.delivered || 0}</span>
                      <span style={{ color: 'var(--status-info)' }}>👁 {c.stats?.read || 0}</span>
                      <span style={{ color: 'var(--status-error)' }}>✗ {c.stats?.failed || 0}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {c.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(c._id, 'running')}><HiOutlinePlay /> Start</button>}
                      {c.status === 'running' && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(c._id, 'paused')}><HiOutlinePause /> Pause</button>}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCampaign(c._id)}><HiOutlineTrash /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Campaign</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Campaign Name *</label>
                  <input className="input" placeholder="e.g. Diwali Sale" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="input" placeholder="Campaign description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Template Name *</label>
                  <input className="input" placeholder="e.g. welcome_offer" value={form.templateName} onChange={e => setForm({ ...form, templateName: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Language</label>
                  <select className="select" value={form.templateLanguage} onChange={e => setForm({ ...form, templateLanguage: e.target.value })} style={{ width: '100%' }}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Target Tags (comma separated)</label>
                  <input className="input" placeholder="e.g. interested, premium" value={form.audience.tags} onChange={e => setForm({ ...form, audience: { ...form.audience, tags: e.target.value } })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Target Statuses (comma separated)</label>
                  <input className="input" placeholder="e.g. interested, highly_interested" value={form.audience.statuses} onChange={e => setForm({ ...form, audience: { ...form.audience, statuses: e.target.value } })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createCampaign}>Create Campaign</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
