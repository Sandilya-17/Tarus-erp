import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

// If a user has a "manage" permission, they implicitly have the "view" permission too
const PERM_IMPLIES = {
  'MANAGE_TRUCKS':       ['VIEW_TRUCKS'],
  'MANAGE_DRIVERS':      ['DRIVERS'],
  'CREATE_TRIPS':        ['TRIPS'],
  'APPROVE_TRIPS':       ['TRIPS', 'CREATE_TRIPS'],
  'ADD_FUEL':            ['FUEL_ENTRY'],
  'APPROVE_FUEL':        ['FUEL_ENTRY', 'ADD_FUEL'],
  'MANAGE_SPARE_PARTS':  ['SPARE_PART_ISSUE'],
  'MANAGE_TYRES':        ['TYRE_ISSUE'],
  'MANAGE_MAINTENANCE':  ['MAINTENANCE'],
  'MANAGE_FINANCE':      ['FINANCE'],
  'APPROVE_FINANCE':     ['FINANCE', 'MANAGE_FINANCE'],
  'EXPORT_FINANCE':      ['FINANCE'],
  'EXPORT_REPORTS':      ['VIEW_REPORTS'],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.me().then(res => {
        const u = res.data;
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => user?.role === 'ADMIN';

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const perms = user.permissions || [];
    if (perms.includes(perm)) return true;
    // Check if any held permission implies the requested one
    return perms.some(held => PERM_IMPLIES[held]?.includes(perm));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
