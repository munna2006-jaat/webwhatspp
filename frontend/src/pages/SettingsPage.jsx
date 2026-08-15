import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlineCog, HiOutlineKey, HiOutlineChatAlt, HiOutlineClock, HiOutlineSave, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('api');
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [quickReply, setQuickReply] = useState({ shortcut: '', title: '', message: '' });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.settings);
      setForm(res.data.settings || {});
    } catch (err) { console.error(err); }
  };

  const saveSettings = async () => {
    try {
      await api.put('/settings', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert('Error saving: ' + (err.response?.data?.error || err.message)); }
  };

  const addQuickReply = async () => {
    if (!quickReply.shortcut || !quickReply.message) return;
    try {
      await api.post('/settings/quick-replies', quickReply);
      setQuickReply({ shortcut: '', title: '', message: '' });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  const deleteQuickReply = async (index) => {
    await api.delete(`/settings/quick-replies/${index}`);
    fetchSettings();
  };

  const tabs = [
    { id: 'api', label: 'API Configuration', icon: HiOutlineKey },
    { id: 'profile', label: 'Business Profile', icon: HiOutlineCog },
    { id: 'replies', label: 'Quick Replies', icon: HiOutlineChatAlt },
    { id: 'hours', label: 'Working Hours', icon: HiOutlineClock },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-header-icon">⚙️</span>
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Configure your workspace</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={saveSettings}>
          <HiOutlineSave /> {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="app-content">
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Tabs */}
          <div style={{ width: 220, flexShrink: 0 }}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 4,
                  background: activeTab === tab.id ? 'var(--brand-primary-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 600 : 500, fontSize: 13,
                  transition: 'all 150ms'
                }}
              >
                <tab.icon /> {tab.label}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="card animate-fade-in" style={{ flex: 1 }}>
            <div className="card-body">
              {activeTab === 'api' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>WhatsApp API Configuration</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Enter your Meta Cloud API credentials. Get them from <a href="https://developers.facebook.com" target="_blank" rel="noopener">developers.facebook.com</a>
                  </p>
                  <div className="input-group">
                    <label className="input-label">Phone Number ID</label>
                    <input className="input" placeholder="PLACEHOLDER_PHONE_NUMBER_ID" value={form.phoneNumberId || ''} onChange={e => setForm({ ...form, phoneNumberId: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Access Token</label>
                    <input className="input" type="password" placeholder="PLACEHOLDER_ACCESS_TOKEN" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">App Secret</label>
                    <input className="input" type="password" placeholder="PLACEHOLDER_APP_SECRET" value={form.appSecret || ''} onChange={e => setForm({ ...form, appSecret: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Business Account ID</label>
                    <input className="input" placeholder="PLACEHOLDER_BUSINESS_ACCOUNT_ID" value={form.businessAccountId || ''} onChange={e => setForm({ ...form, businessAccountId: e.target.value })} />
                  </div>
                  <div style={{ padding: 12, background: 'rgba(234,179,8,0.08)', borderRadius: 'var(--radius-md)', fontSize: 12, color: '#ca8a04' }}>
                    ⚠️ API credentials are stored securely. After saving, the access token will be masked.
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Business Profile</h3>
                  <div className="input-group">
                    <label className="input-label">Workspace Name</label>
                    <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">About</label>
                    <textarea className="input" value={form.businessProfile?.about || ''} onChange={e => setForm({ ...form, businessProfile: { ...form.businessProfile, about: e.target.value } })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Address</label>
                    <input className="input" value={form.businessProfile?.address || ''} onChange={e => setForm({ ...form, businessProfile: { ...form.businessProfile, address: e.target.value } })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Website</label>
                    <input className="input" value={form.businessProfile?.website || ''} onChange={e => setForm({ ...form, businessProfile: { ...form.businessProfile, website: e.target.value } })} />
                  </div>
                </div>
              )}

              {activeTab === 'replies' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Quick Replies</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Save frequently used messages for quick access during conversations.
                  </p>

                  <div className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input className="input" placeholder="Shortcut (e.g. /hello)" value={quickReply.shortcut} onChange={e => setQuickReply({ ...quickReply, shortcut: e.target.value })} style={{ flex: 1 }} />
                      <input className="input" placeholder="Title" value={quickReply.title} onChange={e => setQuickReply({ ...quickReply, title: e.target.value })} style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" placeholder="Message text..." value={quickReply.message} onChange={e => setQuickReply({ ...quickReply, message: e.target.value })} style={{ flex: 1 }} />
                      <button className="btn btn-primary btn-sm" onClick={addQuickReply}><HiOutlinePlus /> Add</button>
                    </div>
                  </div>

                  {(settings?.quickReplies || []).map((qr, i) => (
                    <div key={i} className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="tag tag-blue" style={{ marginRight: 8 }}>{qr.shortcut}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{qr.title}</span>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{qr.message}</p>
                      </div>
                      <button className="btn btn-icon btn-danger" onClick={() => deleteQuickReply(i)} style={{ width: 28, height: 28 }}><HiOutlineTrash size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'hours' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Working Hours</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Set your business hours. Outside these hours, away messages will be sent automatically.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Enable Working Hours</label>
                    <input type="checkbox" checked={form.workingHours?.enabled || false} onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, enabled: e.target.checked } })} />
                  </div>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 100, fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{day}</span>
                      <input type="checkbox" checked={form.workingHours?.schedule?.[day]?.isWorking ?? true} onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, schedule: { ...form.workingHours?.schedule, [day]: { ...form.workingHours?.schedule?.[day], isWorking: e.target.checked } } } })} />
                      <input className="input" type="time" value={form.workingHours?.schedule?.[day]?.start || '09:00'} onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, schedule: { ...form.workingHours?.schedule, [day]: { ...form.workingHours?.schedule?.[day], start: e.target.value } } } })} style={{ width: 120 }} />
                      <span style={{ color: 'var(--text-tertiary)' }}>to</span>
                      <input className="input" type="time" value={form.workingHours?.schedule?.[day]?.end || '18:00'} onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, schedule: { ...form.workingHours?.schedule, [day]: { ...form.workingHours?.schedule?.[day], end: e.target.value } } } })} style={{ width: 120 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
