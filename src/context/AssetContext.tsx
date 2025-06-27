import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { Asset, AssetStatus, CertificationDocument, OrganizationMember } from '../types';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { mapClerkMembershipToMember } from '../utils/organizationUtils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

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

export const useAssets = () => useContext(AssetContext);

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

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { organization, membership } = useOrganization();
  const { getToken } = useAuth();
  const { isAdmin } = useRole();
  const { members } = useOrganizationData();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Map Clerk members to OrganizationMember type
  const organizationMembers: OrganizationMember[] = members.map(mapClerkMembershipToMember);

  /**
   * Creates an authenticated Supabase client with the user's JWT token
   * Includes proper claims for RLS policies
   */
  const getClient = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
        },
      });
    } catch (error) {
      console.error('Error getting authenticated client:', error);
      throw error;
    }
  };

  const fetchAssets = async () => {
    if (!organization?.id || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const client = await getClient();

      const { data: assetsData, error: assetsError } = await client
        .from('assets')
        .select('*')
        .eq('org_id', organization.id);

      if (assetsError) throw assetsError;

      const { data: documentsData, error: documentsError } = await client
        .from('certification_documents')
        .select('*')
        .eq('org_id', organization.id);

      if (documentsError) throw documentsError;

      const processedAssets = assetsData.map(dbAsset => {
        const asset = mapDatabaseAssetToAsset(dbAsset);
        asset.certificationDocuments = documentsData
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

  useEffect(() => {
    fetchAssets();
  }, [organization?.id, user]);

  const addAsset = async (assetData: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>) => {
    if (!organization?.id) throw new Error('No organization found');
    if (!user?.id) throw new Error('No user found');

    const nextCertificationDate = format(addMonths(new Date(assetData.lastCertificationDate), 6), 'yyyy-MM-dd');
    const status = calculateAssetStatus(nextCertificationDate);

    try {
      const client = await getClient();
      
      const insertData = {
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
      };

      console.log('Inserting asset with data:', insertData);

      const { data, error } = await client
        .from('assets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create asset: ${error.message}`);
      }

      const newAsset = mapDatabaseAssetToAsset(data);
      setAssets(prev => [...prev, newAsset]);
    } catch (error) {
      console.error('Error in addAsset:', error);
      throw error;
    }
  };

  const updateAsset = async (id: string, assetData: Partial<Asset>) => {
    if (!organization?.id) throw new Error('No organization found');

    const updateData: Database['public']['Tables']['assets']['Update'] = {
      serial_number: assetData.serialNumber,
      asset_class: assetData.assetClass,
      glove_size: assetData.gloveSize,
      glove_color: assetData.gloveColor,
      assigned_user_id: assetData.assignedUserId,
    };

    if (assetData.lastCertificationDate) {
      const nextCertificationDate = format(addMonths(new Date(assetData.lastCertificationDate), 6), 'yyyy-MM-dd');
      updateData.last_certification_date = assetData.lastCertificationDate;
      updateData.next_certification_date = nextCertificationDate;
      updateData.status = calculateAssetStatus(nextCertificationDate);
    }

    const client = await getClient();
    const { data, error } = await client
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

  const deleteAsset = async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    const client = await getClient();
    const { error } = await client
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('org_id', organization.id);

    if (error) throw error;

    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  const uploadDocument = async (assetId: string, file: File) => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const fileUrl = URL.createObjectURL(file);

    const client = await getClient();
    const { data, error } = await client
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

  const bulkUploadDocument = async (assetIds: string[], file: File) => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const fileUrl = URL.createObjectURL(file);

    const documents = assetIds.map(assetId => ({
      asset_id: assetId,
      file_name: file.name,
      file_url: fileUrl,
      uploaded_by: user.id,
      org_id: organization.id,
    }));

    const client = await getClient();
    const { data, error } = await client
      .from('certification_documents')
      .insert(documents)
      .select();

    if (error) throw error;

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

  const markAsFailed = async (id: string, reason: string) => {
    if (!organization?.id) throw new Error('No organization found');

    const client = await getClient();
    const { data, error } = await client
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

  const markAsInTesting = async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    const client = await getClient();
    const { data, error } = await client
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

  const getAssetsByUser = (userId: string) => {
    return assets.filter(asset => asset.assignedUserId === userId);
  };

  const getAssetById = (id: string) => {
    return assets.find(asset => asset.id === id);
  };

  const importAssets = async (newAssets: Partial<Asset>[]) => {
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

    const client = await getClient();
    const { data, error } = await client
      .from('assets')
      .insert(assetsToInsert)
      .select();

    if (error) throw error;

    const importedAssets = data.map(mapDatabaseAssetToAsset);
    setAssets(prev => [...prev, ...importedAssets]);
  };

  const exportAssets = () => {
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

  return (
    <AssetContext.Provider
      value={{
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
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};