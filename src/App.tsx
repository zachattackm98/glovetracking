import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AssetProvider } from './context/AssetContext';
import ProtectedRoute from './pages/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailsPage from './pages/AssetDetailsPage';
import ImportExportPage from './pages/ImportExportPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AssetProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/:id" element={<AssetDetailsPage />} />
            </Route>
            
            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/import-export" element={<ImportExportPage />} />
            </Route>
            
            {/* Redirect to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AssetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;