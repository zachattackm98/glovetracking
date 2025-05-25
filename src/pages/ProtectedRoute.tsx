import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'member')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles = []
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { isAdmin, isMember, isLoading } = useRole();
  
  // Debug logging
  console.log('Protected Route - Auth State:', { isLoaded, isSignedIn });
  console.log('Protected Route - User:', user?.id);
  console.log('Protected Route - Roles:', { isAdmin, isMember });
  
  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to sign in
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  // If roles are specified, check permissions
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => {
      if (role === 'admin') return isAdmin;
      if (role === 'member') return isMember;
      return false;
    });
    
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // User is authenticated and has required role (if specified)
  return <Outlet />;
};

export default ProtectedRoute;