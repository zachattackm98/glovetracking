import { useUser, useOrganization } from '@clerk/clerk-react';

export const useRole = () => {
  const { user } = useUser();
  const { organization, membership } = useOrganization();
  
  // Use org role if available, otherwise fall back to user metadata
  const role = membership?.role || (user?.publicMetadata?.role as string);
  
  return {
    role,
    isAdmin: role === 'admin',
    isMember: role === 'member' || role === 'technician',
    isLoading: !user,
  };
};