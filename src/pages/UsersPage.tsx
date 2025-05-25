import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import PageLayout from '../components/layout/PageLayout';
import UserList from '../components/admin/UserList';

const UsersPage: React.FC = () => {
  const { isAdmin } = useRole();

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