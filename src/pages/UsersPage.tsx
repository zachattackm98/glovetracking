import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '@clerk/clerk-react';
import PageLayout from '../components/layout/PageLayout';
import UserList from '../components/admin/UserList';

const UsersPage: React.FC = () => {
  const { organization, membership } = useOrganization();
  const isAdmin = membership?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageLayout
      title="User Management"
      description="Manage organization members and invitations"
    >
      <UserList />
    </PageLayout>
  );
};

export default UsersPage;