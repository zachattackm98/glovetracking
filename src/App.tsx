import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { AssetProvider } from './context/AssetContext';
import ProtectedRoute from './pages/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailsPage from './pages/AssetDetailsPage';
import ImportExportPage from './pages/ImportExportPage';
import WalkthroughPage from './pages/WalkthroughPage';

function App() {
  return (
    <BrowserRouter>
      <AssetProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/sign-in/*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <SignIn routing="path" path="/sign-in" />
            </div>
          } />
          <Route path="/sign-up/*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <SignUp routing="path" path="/sign-up" />
            </div>
          } />
          
          {/* Public routes */}
          <Route path="/walkthrough" element={<WalkthroughPage />} />
          
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
          
          {/* Redirect to dashboard or sign in */}
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
    </BrowserRouter>
  );
}

export default App;