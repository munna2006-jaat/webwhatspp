import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wacrm_token');
    const storedUser = localStorage.getItem('wacrm_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('wacrm_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('wacrm_token');
          localStorage.removeItem('wacrm_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('wacrm_token', res.data.token);
    localStorage.setItem('wacrm_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (name, email, password, workspaceName) => {
    const res = await api.post('/auth/signup', { name, email, password, workspaceName });
    localStorage.setItem('wacrm_token', res.data.token);
    localStorage.setItem('wacrm_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('wacrm_token');
    localStorage.removeItem('wacrm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
