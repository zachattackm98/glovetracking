/**
 * Organization member interface for internal use
 */
export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Maps Clerk organization membership to OrganizationMember interface
 * @param membership - Clerk membership object
 * @returns OrganizationMember - Mapped member object
 */
export const mapClerkMembershipToMember = (membership: any): OrganizationMember => ({
  id: membership.publicUserData?.userId || '',
  name: `${membership.publicUserData?.firstName || ''} ${membership.publicUserData?.lastName || ''}`.trim() || 
        membership.publicUserData?.identifier || 'Unknown User',
  email: membership.publicUserData?.identifier || '',
  role: membership.role === 'org:admin' ? 'admin' : 'member',
});