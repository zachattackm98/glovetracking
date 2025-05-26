import { AssetStatus, AssetClass, GloveSize, GloveColor } from './index';

export interface Asset {
  id: string
  org_id: string
  serial_number: string
  asset_class: AssetClass
  assigned_user_id: string | null
  issue_date: string
  last_certification_date: string
  next_certification_date: string
  status: AssetStatus
  failure_date?: string
  failure_reason?: string
  testing_start_date?: string
  glove_size?: GloveSize
  glove_color?: GloveColor
  created_at: string
  updated_at: string
}

export interface AssetHistory {
  id: string
  asset_id: string
  user_id: string
  action: string
  changes: Record<string, any>
  created_at: string
} 