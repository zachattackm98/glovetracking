import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import { useRole } from '../../hooks/useRole';
import { UserPlus, Mail, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const UserList: React.FC = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { isAdmin } = useRole();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dataFetchedRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between fetches
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays

  const loadData = useCallback(async (retryCount = 0) => {
    if (!organization || requestInProgressRef.current) {
      console.log('No organization available or request in progress');
      return;
    }

    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }

    console.log('Loading data for organization:', organization.id);

    try {
      requestInProgressRef.current = true;
      lastFetchTimeRef.current = now;
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching memberships and invitations...');
      
      // Use a single request to get both memberships and pending invites
      const [memberships, invitations] = await Promise.all([
        organization.getMemberships(),
        organization.getPendingInvitations()
      ]);

      console.log('Data loaded successfully:', { 
        membersCount: memberships.length,
        invitesCount: invitations.length 
      });

      // Only update state if we have data
      if (memberships.length > 0 || invitations.length > 0) {
        setMembers(memberships);
        setPendingInvites(invitations);
        dataFetchedRef.current = true;
      }
      
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (error: any) {
      console.error('Error loading organization data:', error);
      
      if (error.status === 429 && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount];
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        // Show a temporary message to the user
        setError(`Rate limit hit. Retrying in ${delay/1000} seconds...`);
        
        setTimeout(() => {
          setError(null);
          loadData(retryCount + 1);
        }, delay);
      } else {
        setError(
          error.status === 429 
            ? 'Rate limit exceeded. Please wait a few minutes before trying again.'
            : 'Failed to load organization data. Please try again later.'
        );
        setIsLoading(false);
        setIsRefreshing(false);
      }
    } finally {
      requestInProgressRef.current = false;
    }
  }, [organization]);

  useEffect(() => {
    console.log('useEffect triggered:', {
      hasOrg: !!organization,
      orgId: organization?.id,
      isOrgLoaded,
      isAdmin,
      hasData: dataFetchedRef.current,
      requestInProgress: requestInProgressRef.current,
      timeSinceLastFetch: Date.now() - lastFetchTimeRef.current
    });

    if (!organization || !isOrgLoaded) {
      console.log('Waiting for organization to load...');
      return;
    }

    if (!isAdmin) {
      console.log('User is not an admin');
      setIsLoading(false);
      return;
    }

    // Only load data if we haven't fetched it yet and no request is in progress
    if (!dataFetchedRef.current && !requestInProgressRef.current) {
      let isMounted = true;
      const fetchData = async () => {
        if (!isMounted) return;
        await loadData();
      };
      fetchData();
      return () => {
        isMounted = false;
      };
    }
  }, [organization, isOrgLoaded, isAdmin, loadData]);

  const handleRefresh = () => {
    if (requestInProgressRef.current) return;
    
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('Skipping refresh - too soon since last fetch');
      return;
    }
    
    setIsRefreshing(true);
    dataFetchedRef.current = false;
    loadData();
  };

  if (!isAdmin) {
    return null;
  }

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
      // Refresh pending invites
      const invitations = await organization?.getPendingInvitations();
      setPendingInvites(invitations || []);
      setTimeout(() => {
        setShowInviteForm(false);
        setInviteSuccess(false);
      }, 3000);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && members.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Organization Members</h2>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            isLoading={isRefreshing}
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

      {showInviteForm && (
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
                  onClick={() => setShowInviteForm(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isInviting}
                  disabled={isInviting || !inviteEmail}
                >
                  Send Invitation
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                        {member.publicUserData?.firstName?.[0] || 'U'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {member.publicUserData?.firstName} {member.publicUserData?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {member.publicUserData?.identifier}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {member.role === 'org:admin' ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(member.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invitations</h3>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-2" />
                          {invite.emailAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;