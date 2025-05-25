import { useUser, useOrganization } from '@clerk/clerk-react';

export const useRole = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  
  // Debug logging
  console.log('Organization Role:', membership?.role);
  console.log('Organization:', organization?.id);
  console.log('User:', user?.id);
  
  const isAdmin = membership?.role === 'org:admin';
  const isMember = membership?.role === 'org:member' || isAdmin;
  
  return {
    role: isAdmin ? 'admin' : 'member',
    isAdmin,
    isMember,
    isLoading: !isUserLoaded || !isOrgLoaded,
  };
};