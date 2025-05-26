import { useUser, useOrganization } from '@clerk/clerk-react';

export const useRole = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();
  
  // Debug logging
  console.log('Organization Role:', membership?.role);
  console.log('Organization:', organization?.id);
  console.log('User:', user?.id);
  console.log('Is User Loaded:', isUserLoaded);
  console.log('Is Org Loaded:', isOrgLoaded);
  console.log('Full Membership:', membership);
  
  const isAdmin = membership?.role === 'org:admin';
  const isMember = membership?.role === 'org:member' || isAdmin; // Admin is also a member
  
  return {
    role: isAdmin ? 'admin' : 'member',
    isAdmin,
    isMember,
    isLoading: !isUserLoaded || !isOrgLoaded,
    orgId: organization?.id,
  };
};