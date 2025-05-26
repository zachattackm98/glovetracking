export type UserRole = 'admin' | 'technician';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type AssetStatus = 'active' | 'near-due' | 'expired' | 'failed' | 'in-testing';
export type AssetClass = 'Class 0' | 'Class 00' | 'Class 1' | 'Class 2' | 'Class 3' | 'Class 4';
export type GloveSize = '7' | '8' | '9' | '10' | '11' | '12';
export type GloveColor = 'red' | 'yellow' | 'black' | 'beige';

export interface Asset {
  id: string;
  org_id: string;
  serial_number: string;
  asset_class: AssetClass;
  assigned_user_id: string | null;
  issue_date: string;
  last_certification_date: string;
  next_certification_date: string;
  status: AssetStatus;
  failure_date?: string;
  failure_reason?: string;
  testing_start_date?: string;
  glove_size?: GloveSize;
  glove_color?: GloveColor;
  certificationDocuments: CertificationDocument[];
}

export interface CertificationDocument {
  id: string;
  asset_id: string;
  file_name: string;
  file_url: string;
  upload_date: string;
  uploaded_by: string;
  appliedToAssets?: string[];
}

export interface Notification {
  id: string;
  assetId: string;
  userId: string;
  message: string;
  type: 'warning' | 'urgent' | 'info';
  createdAt: string;
  read: boolean;
}