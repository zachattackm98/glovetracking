import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles = []
}) => {
  const { isLoaded, userId } = useAuth();
  const { role, isLoading } = useRole();
  
  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }
  
  // If roles are specified and user doesn't have required role, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and has required role (if specified)
  return <Outlet />;
};

export default ProtectedRoute;