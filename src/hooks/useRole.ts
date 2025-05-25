import { useUser, useOrganization } from '@clerk/clerk-react';

export const useRole = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  
  // Debug logging
  console.log('Organization Role:', membership?.role);
  console.log('Organization:', organization?.id);
  
  return {
    role: membership?.role || 'member',
    isAdmin: membership?.role === 'admin',
    isMember: membership?.role === 'member',
    isLoading: !isUserLoaded || !isOrgLoaded,
  };
};