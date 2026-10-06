import { useState, useEffect, useCallback } from 'react';
import { AIService } from '../services/aiService';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  const loadCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const current = await AIService.getMe();
      setUser(current);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      AIService.getMe()
        .then((current) => {
          if (active) {
            setUser(current);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await AIService.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, confirmPassword) => {
    const data = await AIService.register(name, email, password, confirmPassword);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser: loadCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
