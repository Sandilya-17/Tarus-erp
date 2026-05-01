import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trucks from './pages/Trucks';
import Drivers from './pages/Drivers';
import Fuel from './pages/Fuel';
import Trips from './pages/Trips';
import SpareParts from './pages/SpareParts';
import Tyres from './pages/Tyres';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import RevenueExpenditure from './pages/RevenueExpenditure';
import Users from './pages/Users';

function ProtectedRoute({ children, perm, adminOnly }) {
  const { user, loading, isAdmin, hasPermission } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Segoe UI,sans-serif', color:'#607d8b' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;
  if (perm && !isAdmin() && !hasPermission(perm)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trucks" element={<ProtectedRoute perm="VIEW_TRUCKS"><Trucks /></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute perm="DRIVERS"><Drivers /></ProtectedRoute>} />
      <Route path="/fuel" element={<ProtectedRoute perm="FUEL_ENTRY"><Fuel /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute perm="TRIPS"><Trips /></ProtectedRoute>} />
      <Route path="/spare-parts" element={<ProtectedRoute perm="SPARE_PART_ISSUE"><SpareParts /></ProtectedRoute>} />
      <Route path="/tyres" element={<ProtectedRoute perm="TYRE_ISSUE"><Tyres /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute perm="MAINTENANCE"><Maintenance /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute perm="VIEW_REPORTS"><Reports /></ProtectedRoute>} />
      <Route path="/revenue-expenditure" element={<ProtectedRoute perm="FINANCE"><RevenueExpenditure /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Segoe UI,sans-serif', fontSize: 13 } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
