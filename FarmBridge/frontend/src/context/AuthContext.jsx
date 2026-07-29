import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedEmail = localStorage.getItem('email') || sessionStorage.getItem('email');
    const storedRole = localStorage.getItem('role') || sessionStorage.getItem('role');

    if (storedToken && storedEmail && storedRole) {
      setToken(storedToken);
      setEmail(storedEmail);
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = (tokenData, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', tokenData.token);
    storage.setItem('email', tokenData.email);
    storage.setItem('role', tokenData.role);

    setToken(tokenData.token);
    setEmail(tokenData.email);
    setRole(tokenData.role);

    // Redirect based on role
    if (tokenData.role === 'FARMER') {
      navigate('/farmer/dashboard');
    } else if (tokenData.role === 'BUYER') {
      navigate('/buyer/products');
    } else if (tokenData.role === 'ADMIN') {
      navigate('/admin/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('role');

    setToken(null);
    setEmail(null);
    setRole(null);
    navigate('/login');
  };

  const value = {
    token,
    email,
    role,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
