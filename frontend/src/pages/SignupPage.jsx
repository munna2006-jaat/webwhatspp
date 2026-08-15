import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, workspaceName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 48, height: 48, fontSize: 22 }}>W</div>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Set up your WhatsApp CRM workspace</p>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-name">Full Name</label>
            <input id="signup-name" className="input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-email">Email</label>
            <input id="signup-email" className="input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-password">Password</label>
            <input id="signup-password" className="input" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="signup-workspace">Business / Workspace Name</label>
            <input id="signup-workspace" className="input" type="text" placeholder="e.g. My Business" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : 'Create Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
