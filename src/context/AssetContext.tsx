import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { Asset, AssetStatus, CertificationDocument } from '../types';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { supabase, adminOperation } from '../lib/supabase';
import { Database } from '../lib/database.types';

interface AssetContextType {
  assets: Asset[];
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
  const { organization } = useOrganization();
  const { isAdmin } = useRole();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    if (!organization?.id || !user) {
      setIsLoading(false);
      return;
    }

    try {
      // Set the org_id in the request header
      supabase.auth.setSession({
        access_token: user.primaryOrganizationMembership?.organization.publicMetadata?.supabase_auth_token as string,
        refresh_token: '',
      });

      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('org_id', organization.id);

      if (assetsError) throw assetsError;

      const { data: documentsData, error: documentsError } = await supabase
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

    const nextCertificationDate = format(addMonths(new Date(assetData.lastCertificationDate), 6), 'yyyy-MM-dd');
    const status = calculateAssetStatus(nextCertificationDate);

    try {
      const { data } = await adminOperation('addAsset', {
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
      });

      const newAsset = mapDatabaseAssetToAsset(data);
      setAssets(prev => [...prev, { ...newAsset, certificationDocuments: [] }]);
    } catch (error: any) {
      console.error('Error adding asset:', error);
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

    const { data, error } = await supabase
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

    const { error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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