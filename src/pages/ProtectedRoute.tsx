import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles = []
}) => {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  
  // Show loading state
  if (!isLoaded) {
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
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.publicMetadata.role as string)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and has required role (if specified)
  return <Outlet />;
};

export default ProtectedRoute;