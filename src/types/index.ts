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

export interface Asset {
  id: string;
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