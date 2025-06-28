import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { Asset, AssetStatus, CertificationDocument, OrganizationMember } from '../types';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { mapClerkMembershipToMember } from '../utils/organizationUtils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';
import toast from 'react-hot-toast';

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
   * Creates a single Supabase client instance with dynamic token fetching
   * This prevents multiple client instances and ensures fresh tokens
   */
  const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {},
    },
    auth: {
      persistSession: false,
    },
    accessToken: async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        
        if (!token) {
          console.warn('No authentication token available');
          return null;
        }

        console.log('JWT Token obtained for Supabase');
        
        // Decode and log JWT for debugging (remove in production)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT Claims:', {
            org_id: payload.org_id,
            org_role: payload.org_role,
            user_id: payload.user_id,
            email: payload.email,
            exp: new Date(payload.exp * 1000).toISOString()
          });

          // Check for placeholder values that indicate Clerk JWT template misconfiguration
          if (payload.org_id === '{{organization.id}}' || payload.org_role === 'org.{{organization.role}}') {
            console.error('⚠️ CLERK JWT TEMPLATE MISCONFIGURATION DETECTED!');
            console.error('The org_id and org_role claims contain placeholder values instead of actual data.');
            console.error('Please check your Clerk Dashboard JWT Templates configuration.');
            console.error('Navigate to: Clerk Dashboard > JWT Templates > Supabase');
            console.error('Ensure the claims are properly configured to extract dynamic values.');
            
            toast.error('Authentication configuration error. Please contact support.');
            return null;
          }
        } catch (e) {
          console.warn('Could not decode JWT for debugging:', e);
        }

        return token;
      } catch (error) {
        console.error('Error getting authentication token:', error);
        return null;
      }
    },
  });

  const fetchAssets = async () => {
    if (!organization?.id || !user) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching assets for organization:', organization.id);

      const { data: assetsData, error: assetsError } = await supabaseClient
        .from('assets')
        .select('*')
        .eq('org_id', organization.id);

      if (assetsError) {
        console.error('Assets fetch error:', assetsError);
        throw assetsError;
      }

      console.log('Assets fetched successfully:', assetsData?.length || 0);

      const { data: documentsData, error: documentsError } = await supabaseClient
        .from('certification_documents')
        .select('*')
        .eq('org_id', organization.id);

      if (documentsError) {
        console.error('Documents fetch error:', documentsError);
        throw documentsError;
      }

      console.log('Documents fetched successfully:', documentsData?.length || 0);

      const processedAssets = (assetsData || []).map(dbAsset => {
        const asset = mapDatabaseAssetToAsset(dbAsset);
        asset.certificationDocuments = (documentsData || [])
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
      toast.error(`Failed to fetch assets: ${err.message}`);
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
      console.log('Creating asset with organization ID:', organization.id);
      
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

      const { data, error } = await supabaseClient
        .from('assets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to create asset: ${error.message}`);
      }

      console.log('Asset created successfully:', data);
      const newAsset = mapDatabaseAssetToAsset(data);
      setAssets(prev => [...prev, newAsset]);
      toast.success('Asset created successfully');
    } catch (error: any) {
      console.error('Error in addAsset:', error);
      toast.error(`Failed to create asset: ${error.message}`);
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

    try {
      const { data, error } = await supabaseClient
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', organization.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw new Error(`Failed to update asset: ${error.message}`);
      }

      const updatedAsset = mapDatabaseAssetToAsset(data);
      setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
      toast.success('Asset updated successfully');
    } catch (error: any) {
      console.error('Error in updateAsset:', error);
      toast.error(`Failed to update asset: ${error.message}`);
      throw error;
    }
  };

  const deleteAsset = async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { error } = await supabaseClient
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('org_id', organization.id);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete asset: ${error.message}`);
      }

      setAssets(prev => prev.filter(asset => asset.id !== id));
      toast.success('Asset deleted successfully');
    } catch (error: any) {
      console.error('Error in deleteAsset:', error);
      toast.error(`Failed to delete asset: ${error.message}`);
      throw error;
    }
  };

  const uploadDocument = async (assetId: string, file: File) => {
    if (!organization?.id || !user) throw new Error('No organization found');

    const fileUrl = URL.createObjectURL(file);

    try {
      const { data, error } = await supabaseClient
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

      if (error) {
        console.error('Document upload error:', error);
        throw new Error(`Failed to upload document: ${error.message}`);
      }

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
      toast.success('Document uploaded successfully');
    } catch (error: any) {
      console.error('Error in uploadDocument:', error);
      toast.error(`Failed to upload document: ${error.message}`);
      throw error;
    }
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

    try {
      const { data, error } = await supabaseClient
        .from('certification_documents')
        .insert(documents)
        .select();

      if (error) {
        console.error('Bulk upload error:', error);
        throw new Error(`Failed to upload documents: ${error.message}`);
      }

      setAssets(prev => prev.map(asset => {
        if (assetIds.includes(asset.id)) {
          const assetDocs = (data || []).filter(doc => doc.asset_id === asset.id);
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
      toast.success(`Documents uploaded to ${assetIds.length} assets`);
    } catch (error: any) {
      console.error('Error in bulkUploadDocument:', error);
      toast.error(`Failed to upload documents: ${error.message}`);
      throw error;
    }
  };

  const markAsFailed = async (id: string, reason: string) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabaseClient
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

      if (error) {
        console.error('Mark as failed error:', error);
        throw new Error(`Failed to mark asset as failed: ${error.message}`);
      }

      const updatedAsset = mapDatabaseAssetToAsset(data);
      setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
      toast.success('Asset marked as failed');
    } catch (error: any) {
      console.error('Error in markAsFailed:', error);
      toast.error(`Failed to mark asset as failed: ${error.message}`);
      throw error;
    }
  };

  const markAsInTesting = async (id: string) => {
    if (!organization?.id) throw new Error('No organization found');

    try {
      const { data, error } = await supabaseClient
        .from('assets')
        .update({
          status: 'in-testing',
          testing_start_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .eq('id', id)
        .eq('org_id', organization.id)
        .select()
        .single();

      if (error) {
        console.error('Mark as in testing error:', error);
        throw new Error(`Failed to mark asset as in testing: ${error.message}`);
      }

      const updatedAsset = mapDatabaseAssetToAsset(data);
      setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
      toast.success('Asset marked as in testing');
    } catch (error: any) {
      console.error('Error in markAsInTesting:', error);
      toast.error(`Failed to mark asset as in testing: ${error.message}`);
      throw error;
    }
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

    try {
      const { data, error } = await supabaseClient
        .from('assets')
        .insert(assetsToInsert)
        .select();

      if (error) {
        console.error('Import error:', error);
        throw new Error(`Failed to import assets: ${error.message}`);
      }

      const importedAssets = (data || []).map(mapDatabaseAssetToAsset);
      setAssets(prev => [...prev, ...importedAssets]);
      toast.success(`Imported ${importedAssets.length} assets`);
    } catch (error: any) {
      console.error('Error in importAssets:', error);
      toast.error(`Failed to import assets: ${error.message}`);
      throw error;
    }
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