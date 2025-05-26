import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-react';
import { createSupabaseClient } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { format, addMonths } from 'date-fns';
import { AssetStatus } from '../types';

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
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const { organization } = useOrganization();
  const { getToken } = useAuth();

  useEffect(() => {
    if (user && organization) {
      fetchAssets();
    }
  }, [user, organization]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get token');
      }
      const supabase = createSupabaseClient(token);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
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
    const token = await getToken({ template: 'supabase' });
    if (!token) throw new Error('No Clerk JWT found');
    const decoded = decodeJwtPayload(token);
    console.log('JWT:', token);
    console.log('Decoded org_id in JWT:', decoded.org_id);
    console.log('organization.id:', organization.id);
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
    console.log('Inserting asset:', assetToInsert);
    const supabaseWithAuth = createSupabaseClient(token);
    const { data, error } = await supabaseWithAuth
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
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get token');
      }
      const supabase = createSupabaseClient(token);
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
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get token');
      }
      const supabase = createSupabaseClient(token);
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
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get token');
      }
      const supabase = createSupabaseClient(token);
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
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get token');
      }
      const supabase = createSupabaseClient(token);
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

  return (
    <AssetContext.Provider value={{
      assets,
      loading,
      error,
      addAsset,
      updateAsset,
      deleteAsset,
      importAssets,
      exportAssets
    }}>
      {children}
    </AssetContext.Provider>
  );
};

export default AssetContext;