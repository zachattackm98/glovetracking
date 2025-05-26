import { useUser, useOrganization } from '@clerk/clerk-react';

export const useRole = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  
  const isAdmin = membership?.role === 'org:admin';
  const isMember = membership?.role === 'org:member' || isAdmin;
  const orgId = organization?.id;
  
  return {
    role: isAdmin ? 'admin' : 'member',
    isAdmin,
    isMember,
    isLoading: !isUserLoaded || !isOrgLoaded,
    orgId,
    error: !orgId && isOrgLoaded ? 'No organization found' : null,
  };
};