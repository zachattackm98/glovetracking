import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrganization } from '@clerk/clerk-react';

interface OrganizationMember {
  id: string;
  publicUserData?: {
    userId?: string;
    firstName?: string;
    lastName?: string;
    identifier?: string;
  };
  role: string;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  emailAddress: string;
  createdAt: string;
}

interface UseOrganizationDataReturn {
  members: OrganizationMember[];
  pendingInvites: PendingInvite[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Custom hook for managing organization data (members and pending invitations)
 * 
 * Handles:
 * - Data fetching with rate limiting and retry logic
 * - Loading and error states
 * - Refresh functionality
 * - Automatic data fetching on organization changes
 */
export const useOrganizationData = (
  organization: any,
  isAdmin: boolean
): UseOrganizationDataReturn => {
  // State management
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for managing request state and rate limiting
  const dataFetchedRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Constants for rate limiting and retry logic
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between fetches
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff delays

  /**
   * Main data loading function with retry logic and rate limiting
   */
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
      
      // Fetch both memberships and pending invites in parallel
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
      
      // Implement retry logic for rate limiting
      if (error.status === 429 && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount];
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        // Show temporary message to user
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

  /**
   * Manual refresh function with rate limiting
   */
  const refresh = useCallback(() => {
    if (requestInProgressRef.current) return;
    
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('Skipping refresh - too soon since last fetch');
      return;
    }
    
    setIsRefreshing(true);
    dataFetchedRef.current = false;
    loadData();
  }, [loadData]);

  // Effect to load data when organization or admin status changes
  useEffect(() => {
    console.log('useEffect triggered:', {
      hasOrg: !!organization,
      orgId: organization?.id,
      isAdmin,
      hasData: dataFetchedRef.current,
      requestInProgress: requestInProgressRef.current,
      timeSinceLastFetch: Date.now() - lastFetchTimeRef.current
    });

    if (!organization) {
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
  }, [organization, isAdmin, loadData]);

  return {
    members,
    pendingInvites,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
};