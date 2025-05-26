import React, { useState, useMemo } from 'react';
import { PlusCircle, Upload } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useAssets } from '../hooks/useAssets';
import PageLayout from '../components/layout/PageLayout';
import AssetsList from '../components/assets/AssetsList';
import Button from '../components/ui/Button';
import AssetForm from '../components/assets/AssetForm';
import BulkUpload from '../components/assets/BulkUpload';
import { User } from '../types';
import { useLocation } from 'react-router-dom';

const AssetsPage: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, isMember } = useRole();
  const { assets, addAsset, bulkUploadDocument } = useAssets();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const statusFilter = params.get('status');
  
  const users: User[] = useMemo(() => {
    return [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Tech User',
        email: 'tech@example.com',
        role: 'technician',
        createdAt: new Date().toISOString(),
      },
    ];
  }, []);
  
  const userMap = useMemo(() => {
    return users.reduce<Record<string, string>>((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {});
  }, [users]);
  
  const displayedAssets = useMemo(() => {
    const ensureCertDocs = (asset: any) => ({
      ...asset,
      certificationDocuments: asset.certificationDocuments || [],
    });
    let filtered = assets;
    if (isAdmin) {
      filtered = assets;
    } else if (isMember) {
      filtered = assets.filter(asset => asset.assigned_user_id === user?.id);
    } else {
      filtered = [];
    }
    if (statusFilter) {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }
    return filtered.map(ensureCertDocs);
  }, [assets, user, isAdmin, isMember, statusFilter]);
  
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
            users={users} 
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