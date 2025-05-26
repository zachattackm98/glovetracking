import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-react';
import { createSupabaseClient } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { format, addMonths } from 'date-fns';
import { AssetStatus } from '../types';
import { createClient } from '@supabase/supabase-js';

type Asset = Database['public']['Tables']['assets']['Row'];
type AssetInsert = Database['public']['Tables']['assets']['Insert'];
type AssetUpdate = Database['public']['Tables']['assets']['Update'];

interface AssetContextType {
  assets: Asset[];
  loading: boolean;
  error: Error | null;
  addAsset: (asset: AssetInsert) => Promise<void>;
  updateAsset: (id: string, asset: AssetUpdate) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  importAssets: (assets: AssetInsert[]) => Promise<void>;
  exportAssets: () => Promise<Asset[]>;
  getAssetById: (id: string) => Asset | undefined;
  markAsInTesting: (id: string) => Promise<void>;
  markAsFailed: (id: string, reason: string) => Promise<void>;
  uploadDocument: (assetId: string, file: File) => Promise<void>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const supabaseRef = useRef<any>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  // Initialize Supabase client once
  useEffect(() => {
    const setupClient = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          supabaseRef.current = createSupabaseClient(token);
          setIsClientReady(true);
        }
      } catch (err) {
        console.error('Error setting up Supabase client:', err);
        setError(err instanceof Error ? err : new Error('Failed to setup Supabase client'));
      }
    };
    setupClient();
  }, [getToken]);

  // Fetch assets when client is ready and we have user/org
  useEffect(() => {
    if (isClientReady && user && organization) {
      fetchAssets();
    }
  }, [isClientReady, user, organization]);

  const fetchAssets = async () => {
    if (!supabaseRef.current) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabaseRef.current
        .from('assets')
        .select('*, certification_documents(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assets'));
    } finally {
      setLoading(false);
    }
  };

  const calculateAssetStatus = (next_certification_date: string): AssetStatus => {
    const now = new Date();
    const certDate = new Date(next_certification_date);
    const daysUntilExpiration = Math.floor((certDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiration < 0) {
      return 'expired';
    } else if (daysUntilExpiration <= 30) {
      return 'near-due';
    } else {
      return 'active';
    }
  };

  const mapDatabaseAssetToAsset = (dbAsset: Asset): Asset => ({
    ...dbAsset
  });

  function decodeJwtPayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return {};
    }
  }

  const addAsset = async (asset: AssetInsert) => {
    if (!organization?.id || !user?.id) throw new Error('No organization or user found');
    if (!asset.last_certification_date) throw new Error('last_certification_date is required');
    const next_certification_date = format(addMonths(new Date(asset.last_certification_date), 6), 'yyyy-MM-dd');
    const status = calculateAssetStatus(next_certification_date);
    const supabase = supabaseRef.current;
    const assetToInsert = {
      org_id: organization.id,
      serial_number: asset.serial_number,
      asset_class: asset.asset_class,
      glove_size: asset.glove_size,
      glove_color: asset.glove_color,
      issue_date: asset.issue_date,
      last_certification_date: asset.last_certification_date,
      next_certification_date,
      status,
      assigned_user_id: user.id,
    };
    const { data, error } = await supabase
      .from('assets')
      .insert([assetToInsert])
      .select()
      .single();
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    if (!data) throw new Error('No data returned from Supabase');
    const newAsset = mapDatabaseAssetToAsset(data);
    setAssets(prev => [...prev, newAsset]);
  };

  const updateAsset = async (id: string, asset: AssetUpdate) => {
    try {
      const supabase = supabaseRef.current;
      const { error } = await supabase
        .from('assets')
        .update(asset)
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update asset'));
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const supabase = supabaseRef.current;
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete asset'));
      throw err;
    }
  };

  const importAssets = async (assets: AssetInsert[]) => {
    try {
      const supabase = supabaseRef.current;
      const { error } = await supabase
        .from('assets')
        .insert(assets.map(asset => ({
          ...asset,
          org_id: organization?.id
        })));

      if (error) throw error;
      await fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to import assets'));
      throw err;
    }
  };

  const exportAssets = async (): Promise<Asset[]> => {
    try {
      const supabase = supabaseRef.current;
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to export assets'));
      throw err;
    }
  };

  const getAssetById = (id: string) => assets.find(asset => asset.id === id);

  const markAsInTesting = async (id: string) => {
    await updateAsset(id, { status: 'in-testing' });
  };

  const markAsFailed = async (id: string, reason: string) => {
    await updateAsset(id, { 
      status: 'failed', 
      failure_date: new Date().toISOString(),
      failure_reason: reason 
    });
  };

  const uploadDocument = async (assetId: string, file: File) => {
    if (!organization?.id || !user?.id) {
      throw new Error('Client not ready or missing organization/user');
    }

    // Use the base Supabase client (anon key) for public storage uploads
    const supabaseStorage = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    // 1. Upload the file to Supabase Storage (overwrite if exists)
    const filePath = `certifications/${assetId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabaseStorage.storage
      .from('certificationdocuments')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw uploadError;
    }

    // 2. Get the public URL
    const { data: publicUrlData } = supabaseStorage.storage
      .from('certificationdocuments')
      .getPublicUrl(filePath);
    if (!publicUrlData?.publicUrl) {
      throw new Error('Could not get public URL');
    }
    const fileUrl = publicUrlData.publicUrl;

    // 3. Insert a row into the certification_documents table (use authenticated client if needed)
    const token = await getToken({ template: 'supabase' });
    if (!token) throw new Error('No valid token found');
    const supabase = createSupabaseClient(token);
    const { data: insertedDocs, error: insertError } = await supabase
      .from('certification_documents')
      .insert([{
        asset_id: assetId,
        file_name: file.name,
        file_url: fileUrl,
        org_id: organization.id,
        uploaded_by: user.id,
        upload_date: new Date().toISOString(),
      }])
      .select()
      .single();
    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw insertError;
    }

    // 4. Update asset status to 'active'
    await updateAsset(assetId, { status: 'active' });

    // 5. Refresh assets
    await fetchAssets();
    return insertedDocs;
  };

  return (
    <AssetContext.Provider value={{
      assets,
      loading,
      error,
      addAsset,
      updateAsset,
      deleteAsset,
      importAssets,
      exportAssets,
      getAssetById,
      markAsInTesting,
      markAsFailed,
      uploadDocument
    }}>
      {children}
    </AssetContext.Provider>
  );
};

export default AssetContext;