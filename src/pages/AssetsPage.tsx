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

const AssetsPage: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, isMember } = useRole();
  const { assets, organizationMembers, addAsset, bulkUploadDocument } = useAssets();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const userMap = useMemo(() => {
    return organizationMembers.reduce<Record<string, string>>((acc, member) => {
      acc[member.id] = member.name;
      return acc;
    }, {});
  }, [organizationMembers]);
  
  const displayedAssets = useMemo(() => {
    if (isAdmin) {
      return assets;
    } else if (isMember) {
      return assets.filter(asset => asset.assignedUserId === user?.id);
    }
    return [];
  }, [assets, user, isAdmin, isMember]);
  
  const handleCreateAsset = async (data: any) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      addAsset(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async (assetIds: string[], file: File) => {
    setIsUploading(true);
    try {
      await bulkUploadDocument(assetIds, file);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <PageLayout 
      title="Assets" 
      description={isAdmin 
        ? "Manage all safety equipment assets" 
        : "View your assigned safety equipment"}
    >
      {isAdmin && (
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
      )}
      
      {showCreateForm && (
        <div className="mb-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Asset</h2>
          <AssetForm 
            onSubmit={handleCreateAsset} 
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
      
      {showBulkUpload && (
        <BulkUpload
          assets={displayedAssets}
          onUpload={handleBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          isUploading={isUploading}
        />
      )}
      
      <AssetsList assets={displayedAssets} userMap={userMap} />
    </PageLayout>
  );
};

export default AssetsPage;