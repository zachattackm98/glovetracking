import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Edit, Trash2, AlertTriangle, Clock, CheckCircle, XCircle, TestTube } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUser } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useAssets } from '../context/AssetContext';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import AssetForm from '../components/assets/AssetForm';
import DocumentUpload from '../components/assets/DocumentUpload';
import StatusBadge from '../components/ui/StatusBadge';

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
  
  /**
   * Utility function to format date strings consistently
   */
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };
  
  /**
   * Get appropriate status icon based on asset status
   */
  const getStatusIcon = (): React.ReactNode => {
    switch (asset.status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'near-due':
        return <Clock className="h-5 w-5 text-warning-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-danger-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'in-testing':
        return <TestTube className="h-5 w-5 text-primary-500" />;
      default:
        return null;
    }
  };
  
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
  
  // Render functions for better code organization
  /**
   * Renders the admin action buttons in the header
   */
  const renderAdminActions = (): React.ReactNode => {
    if (!isAdmin || isEditing) return null;

    return (
      <div className="flex space-x-2">
        {/* Show testing button for non-failed, non-testing assets */}
        {asset.status !== 'failed' && asset.status !== 'in-testing' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAsInTesting}
            className="text-primary-600 hover:bg-primary-50"
            leftIcon={<TestTube className="h-4 w-4" />}
          >
            Mark as Testing
          </Button>
        )}
        
        {/* Show failure button for non-failed assets */}
        {asset.status !== 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFailureForm(true)}
            className="text-gray-500 hover:bg-gray-50"
          >
            Mark as Failed
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Edit className="h-4 w-4" />}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => setShowDeleteConfirm(true)}
          className="text-danger-500 hover:bg-danger-50 hover:border-danger-300"
        >
          Delete
        </Button>
      </div>
    );
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
                    {getStatusIcon()}
                    <span className="ml-2">{formatDate(asset.nextCertificationDate)}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Conditional forms */}
        {renderDeleteConfirmation()}
        {renderFailureForm()}
      </div>
    );
  };

  /**
   * Renders delete confirmation dialog
   */
  const renderDeleteConfirmation = (): React.ReactNode => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="mt-4 bg-danger-50 border border-danger-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-danger-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">Confirm Deletion</h3>
            <div className="mt-2 text-sm text-danger-700">
              <p>Are you sure you want to delete this asset? This action cannot be undone.</p>
            </div>
            <div className="mt-4 flex space-x-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteAsset}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Delete Asset
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders failure reason form
   */
  const renderFailureForm = (): React.ReactNode => {
    if (!showFailureForm) return null;

    return (
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="failureReason" className="block text-sm font-medium text-gray-700">
              Failure Reason
            </label>
            <textarea
              id="failureReason"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="Describe the reason for failure..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              size="sm"
              variant="outline"
              onClick={resetFailureForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleMarkAsFailed}
              isLoading={isSubmitting}
              disabled={isSubmitting || !failureReason.trim()}
            >
              Mark as Failed
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders the documents section
   */
  const renderDocumentsSection = (): React.ReactNode => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Certification Documents</h3>
          </div>
        </CardHeader>
        <CardContent>
          {isAdmin && asset.status !== 'failed' ? (
            <DocumentUpload
              assetId={asset.id}
              onUpload={handleDocumentUpload}
              documents={asset.certificationDocuments}
              isUploading={isUploading}
            />
          ) : (
            <div>
              {asset.certificationDocuments.length === 0 ? (
                <p className="text-gray-500 text-sm">No documents available</p>
              ) : (
                <ul className="space-y-2">
                  {asset.certificationDocuments.map((doc) => (
                    <li key={doc.id} className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-primary-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                          {doc.appliedToAssets && (
                            <p className="text-xs text-gray-500 mt-1">
                              Applied to {doc.appliedToAssets.length} asset{doc.appliedToAssets.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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
              {renderAdminActions()}
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
          {renderDocumentsSection()}
        </div>
      </div>
    </PageLayout>
  );
};

export default AssetDetailsPage;