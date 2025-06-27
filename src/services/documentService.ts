import { CertificationDocument } from '../types';
import { Database } from '../lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Document Service
 * 
 * Handles all certification document-related database operations
 */

/**
 * Uploads a document for a single asset
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param userId - User ID of uploader
 * @param assetId - Asset ID to associate document with
 * @param file - File to upload
 * @returns Promise<CertificationDocument> - Created document record
 */
export const uploadDocument = async (
  client: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  assetId: string,
  file: File
): Promise<CertificationDocument> => {
  // For now, create a blob URL. In production, you'd upload to actual storage
  const fileUrl = URL.createObjectURL(file);

  const { data, error } = await client
    .from('certification_documents')
    .insert({
      asset_id: assetId,
      file_name: file.name,
      file_url: fileUrl,
      uploaded_by: userId,
      org_id: orgId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    assetId: data.asset_id,
    fileName: data.file_name,
    fileUrl: data.file_url,
    uploadDate: data.upload_date,
    uploadedBy: data.uploaded_by,
  };
};

/**
 * Uploads a document for multiple assets (bulk upload)
 * @param client - Supabase client instance
 * @param orgId - Organization ID
 * @param userId - User ID of uploader
 * @param assetIds - Array of asset IDs to associate document with
 * @param file - File to upload
 * @returns Promise<CertificationDocument[]> - Array of created document records
 */
export const bulkUploadDocument = async (
  client: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  assetIds: string[],
  file: File
): Promise<CertificationDocument[]> => {
  // For now, create a blob URL. In production, you'd upload to actual storage
  const fileUrl = URL.createObjectURL(file);

  const documents = assetIds.map(assetId => ({
    asset_id: assetId,
    file_name: file.name,
    file_url: fileUrl,
    uploaded_by: userId,
    org_id: orgId,
  }));

  const { data, error } = await client
    .from('certification_documents')
    .insert(documents)
    .select();

  if (error) throw error;

  return (data || []).map(doc => ({
    id: doc.id,
    assetId: doc.asset_id,
    fileName: doc.file_name,
    fileUrl: doc.file_url,
    uploadDate: doc.upload_date,
    uploadedBy: doc.uploaded_by,
  }));
};