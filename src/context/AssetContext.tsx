import React, { createContext, useContext, useState, useEffect } from 'react';
import { Asset, CertificationDocument } from '../types';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { adminSupabase } from '../lib/supabase';
import { OrganizationMember, mapClerkMembershipToMember } from '../utils/organizationUtils';
import {
  fetchAssetsAndDocuments,
  createAsset,
  updateAsset as updateAssetService,
  deleteAsset as deleteAssetService,
  markAssetAsFailed,
  markAssetAsInTesting,
  importAssets as importAssetsService,
  exportAssetsToCSV,
} from '../services/assetService';
import {
  uploadDocument as uploadDocumentService,
  bulkUploadDocument as bulkUploadDocumentService,
} from '../services/documentService';

/**
 * Asset Context Interface
 * 
 * Defines the shape of the context value provided to components
 */
interface AssetContextType {
  assets: Asset[];
  organizationMembers: OrganizationMember[];
  isLoading: boolean;
  error: string | null;
  addAsset: (asset: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  uploadDocument: (assetId: string, file: File) => Promise<void>;
  bulkUploadDocument: (assetIds: string[], file: File) => Promise<void>;
  markAsFailed: (id: string, reason: string) => Promise<void>;
  markAsInTesting: (id: string) => Promise<void>;
  getAssetsByUser: (userId: string) => Asset[];
  getAssetById: (id: string) => Asset | undefined;
  importAssets: (assets: Partial<Asset>[]) => Promise<void>;
  exportAssets: () => string;
}

// Context creation with default values
const AssetContext = createContext<AssetContextType>({
  assets: [],
  organizationMembers: [],
  isLoading: false,
  error: null,
  addAsset: async () => {},
  updateAsset: async () => {},
  deleteAsset: async () => {},
  uploadDocument: async () => {},
  bulkUploadDocument: async () => {},
  markAsFailed: async () => {},
  markAsInTesting: async () => {},
  getAssetsByUser: () => [],
  getAssetById: () => undefined,
  importAssets: async () => {},
  exportAssets: () => '',
});

// Custom hook to use the context
export const useAssets = () => useContext(AssetContext);

/**
 * AssetProvider Component
 * 
 * Provides asset management functionality to the application
 * Handles data fetching, state management, and API operations
 */
export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { isAdmin } = useRole();
  
  // State management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to get appropriate Supabase client
   * Always uses admin client since we're using Clerk for auth, not Supabase auth
   */
  const getClient = () => adminSupabase;

  /**
   * Fetches organization members from Clerk
   */
  const fetchOrganizationMembers = async (): Promise<void> => {
    if (!organization) return;

    try {
      console.log('Fetching organization members...');
      const memberships = await organization.getMemberships();
      
      const members: OrganizationMember[] = memberships.map(mapClerkMembershipToMember);

      console.log('Organization members loaded:', members);
      setOrganizationMembers(members);
    } catch (err: any) {
      console.error('Error fetching organization members:', err);
      // Don't set error state for member fetching as it's not critical for app functionality
    }
  };

  /**
   * Fetches assets and their associated documents from Supabase
   */
  const fetchAssets = async (): Promise<void> => {
    if (!organization?.id || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const client = getClient();
      const processedAssets = await fetchAssetsAndDocuments(client, organization.id);

      setAssets(processedAssets);
      setError(null);
      console.log('Assets processed and set:', processedAssets.length);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(`Failed to fetch assets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data when organization or user changes
  useEffect(() => {
    if (organization && user) {
      console.log('Organization and user available, fetching data...');
      // Fetch both assets and organization members in parallel
      Promise.all([
        fetchAssets(),
        fetchOrganizationMembers()
      ]);
    } else {
      console.log('Organization or user not available yet');
      setIsLoading(false);
    }
  }, [organization?.id, user?.id]);

  // Asset management functions
  const addAsset = async (assetData: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const client = getClient();
    const newAsset = await createAsset(client, organization.id, assetData);
    setAssets(prev => [...prev, newAsset]);
  };

  const updateAsset = async (id: string, assetData: Partial<Asset>): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const client = getClient();
    const updatedAsset = await updateAssetService(client, organization.id, id, assetData);
    setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
  };

  const deleteAsset = async (id: string): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const client = getClient();
    await deleteAssetService(client, organization.id, id);
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // Document management functions
  const uploadDocument = async (assetId: string, file: File): Promise<void> => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const client = getClient();
    const newDocument = await uploadDocumentService(client, organization.id, user.id, assetId, file);

    // Update local state with new document
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          certificationDocuments: [...asset.certificationDocuments, newDocument],
        };
      }
      return asset;
    }));
  };

  const bulkUploadDocument = async (assetIds: string[], file: File): Promise<void> => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const client = getClient();
    const newDocuments = await bulkUploadDocumentService(client, organization.id, user.id, assetIds, file);

    // Update local state with new documents
    setAssets(prev => prev.map(asset => {
      if (assetIds.includes(asset.id)) {
        const assetDocs = newDocuments.filter(doc => doc.assetId === asset.id);
        return {
          ...asset,
          certificationDocuments: [...asset.certificationDocuments, ...assetDocs],
        };
      }
      return asset;
    }));
  };

  // Asset status management functions
  const markAsFailed = async (id: string, reason: string): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const client = getClient();
    const updatedAsset = await markAssetAsFailed(client, organization.id, id, reason);
    setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
  };

  const markAsInTesting = async (id: string): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const client = getClient();
    const updatedAsset = await markAssetAsInTesting(client, organization.id, id);
    setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
  };

  // Utility functions for asset retrieval
  const getAssetsByUser = (userId: string): Asset[] => {
    return assets.filter(asset => asset.assignedUserId === userId);
  };

  const getAssetById = (id: string): Asset | undefined => {
    return assets.find(asset => asset.id === id);
  };

  // Import/Export functions
  const importAssets = async (newAssets: Partial<Asset>[]): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const client = getClient();
    const importedAssets = await importAssetsService(client, organization.id, newAssets);
    setAssets(prev => [...prev, ...importedAssets]);
  };

  const exportAssets = (): string => {
    return exportAssetsToCSV(assets);
  };

  // Context provider value
  const contextValue: AssetContextType = {
    assets,
    organizationMembers,
    isLoading,
    error,
    addAsset,
    updateAsset,
    deleteAsset,
    uploadDocument,
    bulkUploadDocument,
    markAsFailed,
    markAsInTesting,
    getAssetsByUser,
    getAssetById,
    importAssets,
    exportAssets,
  };

  return (
    <AssetContext.Provider value={contextValue}>
      {children}
    </AssetContext.Provider>
  );
};