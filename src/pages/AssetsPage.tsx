import React, { useState, useMemo } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useAssets } from '../context/AssetContext';
import PageLayout from '../components/layout/PageLayout';
import AssetsList from '../components/assets/AssetsList';
import Button from '../components/ui/Button';
import AssetForm from '../components/assets/AssetForm';
import BulkUpload from '../components/assets/BulkUpload';

/**
 * AssetsPage Component
 * 
 * Main page for managing assets. Provides different functionality based on user role:
 * - Admins: Can view all assets, create new assets, and bulk upload certifications
 * - Members: Can view only their assigned assets
 */
const AssetsPage: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, isMember } = useRole();
  const { assets, organizationMembers, addAsset, bulkUploadDocument } = useAssets();
  
  // Component state management
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  /**
   * Creates a mapping of user IDs to user names for display purposes
   * Used by AssetsList to show assigned user names instead of IDs
   */
  const userMap = useMemo(() => {
    return organizationMembers.reduce<Record<string, string>>((acc, member) => {
      acc[member.id] = member.name;
      return acc;
    }, {});
  }, [organizationMembers]);
  
  /**
   * Filters assets based on user role:
   * - Admins see all organization assets
   * - Members see only assets assigned to them
   * - Others see no assets
   */
  const displayedAssets = useMemo(() => {
    if (isAdmin) {
      return assets;
    } else if (isMember && user?.id) {
      return assets.filter(asset => asset.assignedUserId === user.id);
    }
    return [];
  }, [assets, user, isAdmin, isMember]);
  
  /**
   * Handles asset creation with loading state management
   * Simulates API delay and closes form on success
   */
  const handleCreateAsset = async (data: any): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      await addAsset(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating asset:', error);
      // Error handling is managed by the context/toast system
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles bulk document upload to multiple assets
   * Manages loading state during upload process
   */
  const handleBulkUpload = async (assetIds: string[], file: File): Promise<void> => {
    setIsUploading(true);
    try {
      await bulkUploadDocument(assetIds, file);
    } catch (error) {
      console.error('Error uploading document:', error);
      // Error handling is managed by the context/toast system
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Generates page description based on user role
   */
  const getPageDescription = (): string => {
    return isAdmin 
      ? "Manage all safety equipment assets" 
      : "View your assigned safety equipment";
  };

  /**
   * Renders the admin action buttons (Create Asset, Bulk Upload)
   * Only visible to admin users
   */
  const renderAdminActions = () => {
    if (!isAdmin) return null;

    return (
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowCreateForm(true)}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Create New Asset
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Bulk Upload Certification
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renders the asset creation form
   * Only shown when showCreateForm is true
   */
  const renderCreateForm = () => {
    if (!showCreateForm) return null;

    return (
      <div className="mb-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Asset</h2>
        <AssetForm 
          onSubmit={handleCreateAsset} 
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  };

  /**
   * Renders the bulk upload modal
   * Only shown when showBulkUpload is true
   */
  const renderBulkUploadModal = () => {
    if (!showBulkUpload) return null;

    return (
      <BulkUpload
        assets={displayedAssets}
        onUpload={handleBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        isUploading={isUploading}
      />
    );
  };
  
  return (
    <PageLayout 
      title="Assets" 
      description={getPageDescription()}
    >
      {/* Admin-only action buttons */}
      {renderAdminActions()}
      
      {/* Asset creation form */}
      {renderCreateForm()}
      
      {/* Bulk upload modal */}
      {renderBulkUploadModal()}
      
      {/* Main assets list */}
      <AssetsList 
        assets={displayedAssets} 
        userMap={userMap} 
      />
    </PageLayout>
  );
};

export default AssetsPage;