import type { SupabaseClient } from '@supabase/supabase-js'
import type { Asset, AssetHistory } from '../types/database'
import type { Asset as FrontendAsset } from '../types'
import { AssetClass, GloveSize, GloveColor } from '../types'

// Helper function to transform database asset to frontend format
export const toFrontendAsset = (dbAsset: Asset): FrontendAsset => ({
  ...dbAsset,
  certificationDocuments: []
})

function isAssetClass(value: any): value is AssetClass {
  return [
    'Class 0', 'Class 00', 'Class 1', 'Class 2', 'Class 3', 'Class 4'
  ].includes(value);
}

function isGloveSize(value: any): value is GloveSize {
  return ['7','8','9','10','11','12'].includes(value);
}

function isGloveColor(value: any): value is GloveColor {
  return ['red','yellow','black','beige'].includes(value);
}

// Helper function to transform frontend asset to database format
export const toDatabaseAsset = (frontendAsset: Partial<FrontendAsset>): Partial<Asset> => {
  let asset_class: AssetClass | undefined = undefined;
  if (typeof (frontendAsset as any).assetClass === 'string' && isAssetClass((frontendAsset as any).assetClass)) {
    asset_class = (frontendAsset as any).assetClass;
  }

  let glove_size: GloveSize | undefined = undefined;
  if (typeof (frontendAsset as any).gloveSize === 'string' && isGloveSize((frontendAsset as any).gloveSize)) {
    glove_size = (frontendAsset as any).gloveSize;
  }

  let glove_color: GloveColor | undefined = undefined;
  if (typeof (frontendAsset as any).gloveColor === 'string' && isGloveColor((frontendAsset as any).gloveColor)) {
    glove_color = (frontendAsset as any).gloveColor;
  }

  return {
    serial_number: (frontendAsset as any).serialNumber,
    asset_class,
    assigned_user_id: (frontendAsset as any).assignedUserId ?? undefined,
    issue_date: (frontendAsset as any).issueDate,
    last_certification_date: (frontendAsset as any).lastCertificationDate,
    next_certification_date: (frontendAsset as any).nextCertificationDate,
    status: (frontendAsset as any).status,
    failure_date: (frontendAsset as any).failureDate,
    failure_reason: (frontendAsset as any).failureReason,
    testing_start_date: (frontendAsset as any).testingStartDate,
    glove_size,
    glove_color,
    org_id: (frontendAsset as any).orgId
  };
};

export const assetService = {
  // Get all assets with pagination
  async getAssets(supabaseClient: SupabaseClient, page = 1, pageSize = 50, org_id: string) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabaseClient
      .from('assets')
      .select('*', { count: 'exact' })
      .eq('org_id', org_id)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { 
      data: data.map(toFrontendAsset), 
      count 
    }
  },

  // Get a single asset
  async getAsset(supabaseClient: SupabaseClient, id: string) {
    const { data, error } = await supabaseClient
      .from('assets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return toFrontendAsset(data)
  },

  // Create a new asset
  async createAsset(supabaseClient: SupabaseClient, asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseClient
      .from('assets')
      .insert([asset])
      .select()
      .single()

    if (error) throw error
    return toFrontendAsset(data)
  },

  // Update an asset
  async updateAsset(supabaseClient: SupabaseClient, id: string, updates: Partial<Asset>) {
    const { data, error } = await supabaseClient
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toFrontendAsset(data)
  },

  // Delete an asset
  async deleteAsset(supabaseClient: SupabaseClient, id: string) {
    const { error } = await supabaseClient
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add asset history
  async addAssetHistory(supabaseClient: SupabaseClient, history: Omit<AssetHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabaseClient
      .from('asset_history')
      .insert([history])
      .select()
      .single()

    if (error) throw error
    return data
  }
} 