import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useAssets } from '../context/AssetContext';
import { formatDate } from '../utils';
import PageLayout from '../components/layout/PageLayout';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import StatusIcon from '../components/ui/StatusIcon';
import AssetForm from '../components/assets/AssetForm';
import AdminActions from '../components/assets/AdminActions';
import FailureForm from '../components/assets/FailureForm';
import DeleteConfirm from '../components/assets/DeleteConfirm';
import AssetDocuments from '../components/assets/AssetDocuments';

/**
 * AssetDetailsPage Component
 * 
 * Displays detailed information about a specific asset including:
 * - Asset metadata (serial number, class, assignment, dates)
 * - Status management (active, testing, failed)
 * - Document management (upload, view certification documents)
 * - Edit/delete capabilities (admin only)
 * 
 * Access control:
 * - Admins: Full access to all assets in their organization
 * - Members: Access only to assets assigned to them
 */
const AssetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin, isMember } = useRole();
  const { 
    getAssetById, 
    organizationMembers, 
    updateAsset, 
    deleteAsset, 
    uploadDocument, 
    markAsFailed, 
    markAsInTesting 
  } = useAssets();
  
  // Component state management
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFailureForm, setShowFailureForm] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  
  /**
   * Get the asset data based on the ID from URL params
   */
  const asset = useMemo(() => {
    if (!id) return null;
    return getAssetById(id);
  }, [id, getAssetById]);
  
  /**
   * Determine if current user has access to this asset
   * - Admins have access to all organization assets
   * - Members have access only to assets assigned to them
   */
  const hasAccess = useMemo(() => {
    if (!asset || !user) return false;
    if (isAdmin) return true;
    if (isMember && asset.assignedUserId === user.id) return true;
    return false;
  }, [asset, user, isAdmin, isMember]);
  
  /**
   * Get the name of the user assigned to this asset
   */
  const assignedUserName = useMemo(() => {
    if (!asset?.assignedUserId) return 'Unassigned';
    const foundUser = organizationMembers.find(u => u.id === asset.assignedUserId);
    return foundUser ? foundUser.name : 'Unknown User';
  }, [asset?.assignedUserId, organizationMembers]);
  
  // Redirect if no access or asset not found
  if (!asset || !hasAccess) {
    navigate('/assets');
    return null;
  }
  
  // Event handlers
  /**
   * Handle asset update with loading state management
   */
  const handleUpdateAsset = async (data: any): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      await updateAsset(asset.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating asset:', error);
      // Error handling is managed by the context/toast system
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handle asset deletion with confirmation
   */
  const handleDeleteAsset = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      await deleteAsset(asset.id);
      navigate('/assets');
    } catch (error) {
      console.error('Error deleting asset:', error);
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  /**
   * Handle document upload with loading state
   */
  const handleDocumentUpload = async (file: File): Promise<void> => {
    setIsUploading(true);
    try {
      await uploadDocument(asset.id, file);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle marking asset as failed with reason
   */
  const handleMarkAsFailed = async (): Promise<void> => {
    if (!failureReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      await markAsFailed(asset.id, failureReason);
      setShowFailureForm(false);
      setFailureReason('');
    } catch (error) {
      console.error('Error marking asset as failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle marking asset as in testing
   */
  const handleMarkAsInTesting = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      await markAsInTesting(asset.id);
    } catch (error) {
      console.error('Error marking asset as in testing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset failure form state
   */
  const resetFailureForm = (): void => {
    setShowFailureForm(false);
    setFailureReason('');
  };
  
  /**
   * Renders asset details in view mode
   */
  const renderAssetDetails = (): React.ReactNode => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Asset ID</p>
              <p className="mt-1 text-base text-gray-900">{asset.serialNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Class</p>
              <p className="mt-1 text-base text-gray-900">{asset.assetClass}</p>
            </div>
            {asset.gloveSize && (
              <div>
                <p className="text-sm font-medium text-gray-500">Size</p>
                <p className="mt-1 text-base text-gray-900">Size {asset.gloveSize}</p>
              </div>
            )}
            {asset.gloveColor && (
              <div>
                <p className="text-sm font-medium text-gray-500">Color</p>
                <p className="mt-1 text-base text-gray-900 capitalize">{asset.gloveColor}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Assigned To</p>
              <p className="mt-1 text-base text-gray-900">{assignedUserName}</p>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Issue Date</p>
              <p className="mt-1 text-base text-gray-900">{formatDate(asset.issueDate)}</p>
            </div>
            
            {/* Conditional rendering based on asset status */}
            {asset.status === 'in-testing' ? (
              <div>
                <p className="text-sm font-medium text-gray-500">Testing Started</p>
                <p className="mt-1 text-base text-gray-900">{formatDate(asset.testingStartDate!)}</p>
              </div>
            ) : asset.status === 'failed' ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">Failed On</p>
                  <p className="mt-1 text-base text-gray-900">{formatDate(asset.failureDate!)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Failure Reason</p>
                  <p className="mt-1 text-base text-gray-900">{asset.failureReason}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Certification</p>
                  <p className="mt-1 text-base text-gray-900">{formatDate(asset.lastCertificationDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Next Certification Due</p>
                  <p className={`mt-1 text-base flex items-center ${
                    asset.status === 'expired' 
                      ? 'text-danger-600' 
                      : asset.status === 'near-due' 
                        ? 'text-warning-600' 
                        : 'text-gray-900'
                  }`}>
                    <StatusIcon status={asset.status} />
                    <span className="ml-2">{formatDate(asset.nextCertificationDate)}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Conditional forms */}
        <DeleteConfirm
          showDeleteConfirm={showDeleteConfirm}
          isSubmitting={isSubmitting}
          onConfirm={handleDeleteAsset}
          onCancel={() => setShowDeleteConfirm(false)}
        />
        
        <FailureForm
          showFailureForm={showFailureForm}
          failureReason={failureReason}
          isSubmitting={isSubmitting}
          onFailureReasonChange={setFailureReason}
          onSubmit={handleMarkAsFailed}
          onCancel={resetFailureForm}
        />
      </div>
    );
  };
  
  return (
    <PageLayout>
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link
          to="/assets"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Assets
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main asset details section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h2 className="text-xl font-bold text-gray-900">{asset.serialNumber}</h2>
                  <StatusBadge status={asset.status} className="ml-3" />
                </div>
                <p className="text-sm text-gray-500 mt-1">{asset.assetClass}</p>
              </div>
              
              {/* Admin action buttons */}
              {isAdmin && (
                <AdminActions
                  asset={asset}
                  isEditing={isEditing}
                  isSubmitting={isSubmitting}
                  onMarkAsInTesting={handleMarkAsInTesting}
                  onShowFailureForm={() => setShowFailureForm(true)}
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => setShowDeleteConfirm(true)}
                />
              )}
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <AssetForm
                  initialData={asset}
                  onSubmit={handleUpdateAsset}
                  onCancel={() => setIsEditing(false)}
                  isSubmitting={isSubmitting}
                />
              ) : (
                renderAssetDetails()
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Documents sidebar */}
        <div className="lg:col-span-1">
          <AssetDocuments
            asset={asset}
            isAdmin={isAdmin}
            isUploading={isUploading}
            onDocumentUpload={handleDocumentUpload}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default AssetDetailsPage;