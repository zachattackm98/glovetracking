import { format, addMonths } from 'date-fns';
import { Asset, AssetStatus } from '../types';
import { Database } from '../lib/database.types';

/**
 * Calculates asset status based on next certification date
 * @param nextCertificationDate - The next certification date in string format
 * @returns AssetStatus - The calculated status
 */
export const calculateAssetStatus = (nextCertificationDate: string): AssetStatus => {
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

/**
 * Maps database asset row to Asset interface
 * @param dbAsset - Raw asset data from database
 * @returns Asset - Mapped asset object
 */
export const mapDatabaseAssetToAsset = (dbAsset: Database['public']['Tables']['assets']['Row']): Asset => ({
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

/**
 * Calculates the next certification date (6 months from last certification)
 * @param lastCertificationDate - The last certification date
 * @returns Next certification date in YYYY-MM-DD format
 */
export const calculateNextCertificationDate = (lastCertificationDate: string): string => {
  return format(addMonths(new Date(lastCertificationDate), 6), 'yyyy-MM-dd');
};