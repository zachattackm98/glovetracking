import React, { useState } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import { useRole } from '../../hooks/useRole';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import { UserPlus, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import InviteMemberForm from './InviteMemberForm';
import MembersTable from './MembersTable';
import PendingInvitesTable from './PendingInvitesTable';

/**
 * UserList Component
 * 
 * Main component for managing organization users and invitations
 * Orchestrates the display of members, pending invites, and invitation form
 * 
 * Features:
 * - View organization members
 * - Send invitations to new members
 * - View pending invitations
 * - Refresh data manually
 * - Error handling with retry functionality
 */
const UserList: React.FC = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { isAdmin } = useRole();
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Use custom hook for data management
  const {
    members,
    pendingInvites,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useOrganizationData(organization, isAdmin);

  // Only allow admins to access this component
  if (!isAdmin) {
    return null;
  }

  /**
   * Handle successful invitation - refresh data and close form
   */
  const handleInviteSuccess = (): void => {
    refresh();
  };

  /**
   * Handle refresh with loading state
   */
  const handleRefresh = (): void => {
    refresh();
  };

  // Show error state with retry option
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={handleRefresh}
        isRetrying={isRefreshing}
      />
    );
  }

  // Show loading state for initial load
  if (isLoading && members.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Organization Members</h2>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            isLoading={isRefreshing}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setShowInviteForm(true)}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <InviteMemberForm
          organization={organization}
          onInviteSuccess={handleInviteSuccess}
          onCancel={() => setShowInviteForm(false)}
        />
      )}

      {/* Members table */}
      <MembersTable members={members} />

      {/* Pending invites table */}
      <PendingInvitesTable pendingInvites={pendingInvites} />
    </div>
  );
};

export default UserList;