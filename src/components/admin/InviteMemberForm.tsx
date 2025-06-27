import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface InviteMemberFormProps {
  organization: any;
  onInviteSuccess: () => void;
  onCancel: () => void;
}

/**
 * InviteMemberForm Component
 * 
 * Handles the invitation of new members to the organization
 * Manages its own state for email input, loading, and error handling
 */
const InviteMemberForm: React.FC<InviteMemberFormProps> = ({
  organization,
  onInviteSuccess,
  onCancel,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  /**
   * Handles the form submission for inviting a new member
   */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess(false);
    setIsInviting(true);

    try {
      await organization?.inviteMember({ 
        emailAddress: inviteEmail,
        role: 'org:member'
      });
      
      setInviteSuccess(true);
      setInviteEmail('');
      
      // Notify parent component to refresh data
      onInviteSuccess();
      
      // Auto-close form after success
      setTimeout(() => {
        onCancel();
        setInviteSuccess(false);
      }, 3000);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleInvite} className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                type="email"
                id="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="member@example.com"
                required
                disabled={isInviting}
              />
            </div>
          </div>

          {inviteError && (
            <div className="text-sm text-danger-600">{inviteError}</div>
          )}

          {inviteSuccess && (
            <div className="text-sm text-success-600">
              Invitation sent successfully!
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isInviting}
              disabled={isInviting || !inviteEmail}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Send Invitation
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default InviteMemberForm;