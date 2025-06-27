import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { Asset, AssetStatus, CertificationDocument } from '../types';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { supabase, adminSupabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

// Types
interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

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

// Utility functions
/**
 * Calculates asset status based on next certification date
 * @param nextCertificationDate - The next certification date in string format
 * @returns AssetStatus - The calculated status
 */
const calculateAssetStatus = (nextCertificationDate: string): AssetStatus => {
  const now = new Date();
  const certDate = new Date(nextCertificationDate);
  const daysUntilExpiration = Math.floor((certDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) {
    return 'expired';
  } else if (daysUntilExpiration <= 30) {
    return 'near-due';
  } else {
    return 'active';
  }
};

/**
 * Maps database asset row to Asset interface
 * @param dbAsset - Raw asset data from database
 * @returns Asset - Mapped asset object
 */
const mapDatabaseAssetToAsset = (dbAsset: Database['public']['Tables']['assets']['Row']): Asset => ({
  id: dbAsset.id,
  orgId: dbAsset.org_id,
  serialNumber: dbAsset.serial_number,
  assetClass: dbAsset.asset_class as Asset['assetClass'],
  gloveSize: dbAsset.glove_size as Asset['gloveSize'],
  gloveColor: dbAsset.glove_color as Asset['gloveColor'],
  issueDate: dbAsset.issue_date,
  lastCertificationDate: dbAsset.last_certification_date,
  nextCertificationDate: dbAsset.next_certification_date,
  status: dbAsset.status as AssetStatus,
  failureDate: dbAsset.failure_date || undefined,
  failureReason: dbAsset.failure_reason || undefined,
  testingStartDate: dbAsset.testing_start_date || undefined,
  assignedUserId: dbAsset.assigned_user_id || null,
  certificationDocuments: [],
});

/**
 * Maps Clerk organization membership to OrganizationMember interface
 * @param membership - Clerk membership object
 * @returns OrganizationMember - Mapped member object
 */
const mapClerkMembershipToMember = (membership: any): OrganizationMember => ({
  id: membership.publicUserData?.userId || '',
  name: `${membership.publicUserData?.firstName || ''} ${membership.publicUserData?.lastName || ''}`.trim() || 
        membership.publicUserData?.identifier || 'Unknown User',
  email: membership.publicUserData?.identifier || '',
  role: membership.role === 'org:admin' ? 'admin' : 'member',
});

// Main Provider Component
export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { isAdmin } = useRole();
  
  // State management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get appropriate Supabase client
  const getClient = () => isAdmin ? adminSupabase : supabase;

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

      // Fetch assets and documents in parallel
      const [assetsResponse, documentsResponse] = await Promise.all([
        client.from('assets').select('*').eq('org_id', organization.id),
        client.from('certification_documents').select('*').eq('org_id', organization.id)
      ]);

      if (assetsResponse.error) throw assetsResponse.error;
      if (documentsResponse.error) throw documentsResponse.error;

      // Process and combine assets with their documents
      const processedAssets = assetsResponse.data.map(dbAsset => {
        const asset = mapDatabaseAssetToAsset(dbAsset);
        
        // Attach related certification documents
        asset.certificationDocuments = documentsResponse.data
          .filter(doc => doc.asset_id === asset.id)
          .map(doc => ({
            id: doc.id,
            assetId: doc.asset_id,
            fileName: doc.file_name,
            fileUrl: doc.file_url,
            uploadDate: doc.upload_date,
            uploadedBy: doc.uploaded_by,
          }));
        
        return asset;
      });

      setAssets(processedAssets);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data when organization or user changes
  useEffect(() => {
    if (organization && user) {
      // Fetch both assets and organization members in parallel
      Promise.all([
        fetchAssets(),
        fetchOrganizationMembers()
      ]);
    }
  }, [organization?.id, user]);

  // Asset management functions
  const addAsset = async (assetData: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const nextCertificationDate = format(addMonths(new Date(assetData.lastCertificationDate), 6), 'yyyy-MM-dd');
    const status = calculateAssetStatus(nextCertificationDate);

    const { data, error } = await getClient()
      .from('assets')
      .insert({
        org_id: organization.id,
        serial_number: assetData.serialNumber,
        asset_class: assetData.assetClass,
        glove_size: assetData.gloveSize,
        glove_color: assetData.gloveColor,
        issue_date: assetData.issueDate,
        last_certification_date: assetData.lastCertificationDate,
        next_certification_date: nextCertificationDate,
        status,
        assigned_user_id: assetData.assignedUserId,
      })
      .select()
      .single();

    if (error) throw error;

    const newAsset = mapDatabaseAssetToAsset(data);
    setAssets(prev => [...prev, newAsset]);
  };

  const updateAsset = async (id: string, assetData: Partial<Asset>): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const updateData: Database['public']['Tables']['assets']['Update'] = {
      serial_number: assetData.serialNumber,
      asset_class: assetData.assetClass,
      glove_size: assetData.gloveSize,
      glove_color: assetData.gloveColor,
      assigned_user_id: assetData.assignedUserId,
    };

    // Update certification dates if provided
    if (assetData.lastCertificationDate) {
      const nextCertificationDate = format(addMonths(new Date(assetData.lastCertificationDate), 6), 'yyyy-MM-dd');
      updateData.last_certification_date = assetData.lastCertificationDate;
      updateData.next_certification_date = nextCertificationDate;
      updateData.status = calculateAssetStatus(nextCertificationDate);
    }

    const { data, error } = await getClient()
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', organization.id)
      .select()
      .single();

    if (error) throw error;

    const updatedAsset = mapDatabaseAssetToAsset(data);
    setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
  };

  const deleteAsset = async (id: string): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const { error } = await getClient()
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('org_id', organization.id);

    if (error) throw error;

    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // Document management functions
  const uploadDocument = async (assetId: string, file: File): Promise<void> => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const fileUrl = URL.createObjectURL(file);

    const { data, error } = await getClient()
      .from('certification_documents')
      .insert({
        asset_id: assetId,
        file_name: file.name,
        file_url: fileUrl,
        uploaded_by: user.id,
        org_id: organization.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update local state with new document
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          certificationDocuments: [...asset.certificationDocuments, {
            id: data.id,
            assetId: data.asset_id,
            fileName: data.file_name,
            fileUrl: data.file_url,
            uploadDate: data.upload_date,
            uploadedBy: data.uploaded_by,
          }],
        };
      }
      return asset;
    }));
  };

  const bulkUploadDocument = async (assetIds: string[], file: File): Promise<void> => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const fileUrl = URL.createObjectURL(file);

    const documents = assetIds.map(assetId => ({
      asset_id: assetId,
      file_name: file.name,
      file_url: fileUrl,
      uploaded_by: user.id,
      org_id: organization.id,
    }));

    const { data, error } = await getClient()
      .from('certification_documents')
      .insert(documents)
      .select();

    if (error) throw error;

    // Update local state with new documents
    setAssets(prev => prev.map(asset => {
      if (assetIds.includes(asset.id)) {
        const assetDocs = data.filter(doc => doc.asset_id === asset.id);
        return {
          ...asset,
          certificationDocuments: [
            ...asset.certificationDocuments,
            ...assetDocs.map(doc => ({
              id: doc.id,
              assetId: doc.asset_id,
              fileName: doc.file_name,
              fileUrl: doc.file_url,
              uploadDate: doc.upload_date,
              uploadedBy: doc.uploaded_by,
            })),
          ],
        };
      }
      return asset;
    }));
  };

  // Asset status management functions
  const markAsFailed = async (id: string, reason: string): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const { data, error } = await getClient()
      .from('assets')
      .update({
        status: 'failed',
        failure_date: format(new Date(), 'yyyy-MM-dd'),
        failure_reason: reason,
      })
      .eq('id', id)
      .eq('org_id', organization.id)
      .select()
      .single();

    if (error) throw error;

    const updatedAsset = mapDatabaseAssetToAsset(data);
    setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
  };

  const markAsInTesting = async (id: string): Promise<void> => {
    if (!organization?.id) throw new Error('No organization found');

    const { data, error } = await getClient()
      .from('assets')
      .update({
        status: 'in-testing',
        testing_start_date: format(new Date(), 'yyyy-MM-dd'),
      })
      .eq('id', id)
      .eq('org_id', organization.id)
      .select()
      .single();

    if (error) throw error;

    const updatedAsset = mapDatabaseAssetToAsset(data);
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

    const assetsToInsert = newAssets.map(asset => {
      if (!asset.lastCertificationDate) {
        throw new Error('Assets must include lastCertificationDate');
      }

      const nextCertificationDate = format(
        addMonths(new Date(asset.lastCertificationDate), 6),
        'yyyy-MM-dd'
      );

      return {
        org_id: organization.id,
        serial_number: asset.serialNumber || `SN-${Math.random().toString(36).substring(7)}`,
        asset_class: asset.assetClass || 'Class 1',
        glove_size: asset.gloveSize,
        glove_color: asset.gloveColor,
        issue_date: asset.issueDate || format(new Date(), 'yyyy-MM-dd'),
        last_certification_date: asset.lastCertificationDate,
        next_certification_date: nextCertificationDate,
        status: calculateAssetStatus(nextCertificationDate),
        assigned_user_id: asset.assignedUserId,
      };
    });

    const { data, error } = await getClient()
      .from('assets')
      .insert(assetsToInsert)
      .select();

    if (error) throw error;

    const importedAssets = data.map(mapDatabaseAssetToAsset);
    setAssets(prev => [...prev, ...importedAssets]);
  };

  const exportAssets = (): string => {
    const headers = [
      'id',
      'serialNumber',
      'assetClass',
      'gloveSize',
      'gloveColor',
      'issueDate',
      'lastCertificationDate',
      'nextCertificationDate',
      'status',
      'assignedUserId',
    ].join(',');

    const rows = assets.map(asset => [
      asset.id,
      asset.serialNumber,
      asset.assetClass,
      asset.gloveSize || '',
      asset.gloveColor || '',
      asset.issueDate,
      asset.lastCertificationDate,
      asset.nextCertificationDate,
      asset.status,
      asset.assignedUserId || '',
    ].join(','));

    return [headers, ...rows].join('\n');
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