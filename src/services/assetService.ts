import { format } from 'date-fns';
import { Asset } from '../types';
import { Database } from '../lib/database.types';
import { calculateAssetStatus, calculateNextCertificationDate, mapDatabaseAssetToAsset } from '../utils/assetUtils';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Asset Service
 * 
 * Handles all asset-related database operations
 */

/**
 * Fetches assets and their associated documents from Supabase
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @returns Promise<Asset[]> - Array of assets with documents
 */
export const fetchAssetsAndDocuments = async (
  client: SupabaseClient<Database>,
  orgId: string
): Promise<Asset[]> => {
  console.log('Fetching assets for organization:', orgId);

  // Fetch assets and documents in parallel
  const [assetsResponse, documentsResponse] = await Promise.all([
    client.from('assets').select('*').eq('org_id', orgId),
    client.from('certification_documents').select('*').eq('org_id', orgId)
  ]);

  if (assetsResponse.error) {
    console.error('Assets fetch error:', assetsResponse.error);
    throw assetsResponse.error;
  }
  if (documentsResponse.error) {
    console.error('Documents fetch error:', documentsResponse.error);
    throw documentsResponse.error;
  }

  console.log('Assets fetched:', assetsResponse.data?.length || 0);
  console.log('Documents fetched:', documentsResponse.data?.length || 0);

  // Process and combine assets with their documents
  const processedAssets = (assetsResponse.data || []).map(dbAsset => {
    const asset = mapDatabaseAssetToAsset(dbAsset);
    
    // Attach related certification documents
    asset.certificationDocuments = (documentsResponse.data || [])
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

  return processedAssets;
};

/**
 * Creates a new asset in the database
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param assetData - Asset data to insert
 * @returns Promise<Asset> - Created asset
 */
export const createAsset = async (
  client: SupabaseClient<Database>,
  orgId: string,
  assetData: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>
): Promise<Asset> => {
  const nextCertificationDate = calculateNextCertificationDate(assetData.lastCertificationDate);
  const status = calculateAssetStatus(nextCertificationDate);

  const { data, error } = await client
    .from('assets')
    .insert({
      org_id: orgId,
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

  return mapDatabaseAssetToAsset(data);
};

/**
 * Updates an existing asset in the database
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param assetId - Asset ID to update
 * @param assetData - Partial asset data to update
 * @returns Promise<Asset> - Updated asset
 */
export const updateAsset = async (
  client: SupabaseClient<Database>,
  orgId: string,
  assetId: string,
  assetData: Partial<Asset>
): Promise<Asset> => {
  const updateData: Database['public']['Tables']['assets']['Update'] = {
    serial_number: assetData.serialNumber,
    asset_class: assetData.assetClass,
    glove_size: assetData.gloveSize,
    glove_color: assetData.gloveColor,
    assigned_user_id: assetData.assignedUserId,
  };

  // Update certification dates if provided
  if (assetData.lastCertificationDate) {
    const nextCertificationDate = calculateNextCertificationDate(assetData.lastCertificationDate);
    updateData.last_certification_date = assetData.lastCertificationDate;
    updateData.next_certification_date = nextCertificationDate;
    updateData.status = calculateAssetStatus(nextCertificationDate);
  }

  const { data, error } = await client
    .from('assets')
    .update(updateData)
    .eq('id', assetId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;

  return mapDatabaseAssetToAsset(data);
};

/**
 * Deletes an asset from the database
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param assetId - Asset ID to delete
 * @returns Promise<void>
 */
export const deleteAsset = async (
  client: SupabaseClient<Database>,
  orgId: string,
  assetId: string
): Promise<void> => {
  const { error } = await client
    .from('assets')
    .delete()
    .eq('id', assetId)
    .eq('org_id', orgId);

  if (error) throw error;
};

/**
 * Marks an asset as failed with a reason
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param assetId - Asset ID to mark as failed
 * @param reason - Failure reason
 * @returns Promise<Asset> - Updated asset
 */
export const markAssetAsFailed = async (
  client: SupabaseClient<Database>,
  orgId: string,
  assetId: string,
  reason: string
): Promise<Asset> => {
  const { data, error } = await client
    .from('assets')
    .update({
      status: 'failed',
      failure_date: format(new Date(), 'yyyy-MM-dd'),
      failure_reason: reason,
    })
    .eq('id', assetId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;

  return mapDatabaseAssetToAsset(data);
};

/**
 * Marks an asset as in testing
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param assetId - Asset ID to mark as in testing
 * @returns Promise<Asset> - Updated asset
 */
export const markAssetAsInTesting = async (
  client: SupabaseClient<Database>,
  orgId: string,
  assetId: string
): Promise<Asset> => {
  const { data, error } = await client
    .from('assets')
    .update({
      status: 'in-testing',
      testing_start_date: format(new Date(), 'yyyy-MM-dd'),
    })
    .eq('id', assetId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw error;

  return mapDatabaseAssetToAsset(data);
};

/**
 * Imports multiple assets into the database
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param assets - Array of partial asset data to import
 * @returns Promise<Asset[]> - Array of imported assets
 */
export const importAssets = async (
  client: SupabaseClient<Database>,
  orgId: string,
  assets: Partial<Asset>[]
): Promise<Asset[]> => {
  const assetsToInsert = assets.map(asset => {
    if (!asset.lastCertificationDate) {
      throw new Error('Assets must include lastCertificationDate');
    }

    const nextCertificationDate = calculateNextCertificationDate(asset.lastCertificationDate);

    return {
      org_id: orgId,
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

  const { data, error } = await client
    .from('assets')
    .insert(assetsToInsert)
    .select();

  if (error) throw error;

  return (data || []).map(mapDatabaseAssetToAsset);
};

/**
 * Exports assets to CSV format
 * @param assets - Array of assets to export
 * @returns CSV string
 */
export const exportAssetsToCSV = (assets: Asset[]): string => {
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