export type UserRole = 'admin' | 'technician';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type AssetStatus = 'active' | 'near-due' | 'expired' | 'failed' | 'in-testing';
export type AssetClass = 'Class 0' | 'Class 00' | 'Class 1' | 'Class 2' | 'Class 3' | 'Class 4';
export type GloveSize = '7' | '8' | '9' | '10' | '11' | '12';
export type GloveColor = 'red' | 'yellow' | 'black' | 'beige';

export interface Asset {
  id: string;
  orgId: string;
  serialNumber: string;
  assetClass: AssetClass;
  assignedUserId: string | null;
  issueDate: string;
  lastCertificationDate: string;
  nextCertificationDate: string;
  status: AssetStatus;
  failureDate?: string;
  failureReason?: string;
  testingStartDate?: string;
  gloveSize?: GloveSize;
  gloveColor?: GloveColor;
  certificationDocuments: CertificationDocument[];
}

export interface CertificationDocument {
  id: string;
  assetId: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  uploadedBy: string;
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