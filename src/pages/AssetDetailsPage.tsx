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
import { User } from '../types';

const AssetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin, isMember } = useRole();
  const { getAssetById, updateAsset, deleteAsset, uploadDocument, markAsFailed, markAsInTesting } = useAssets();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFailureForm, setShowFailureForm] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  
  const asset = useMemo(() => {
    if (!id) return null;
    return getAssetById(id);
  }, [id, getAssetById]);
  
  const hasAccess = useMemo(() => {
    if (!asset || !user) return false;
    if (isAdmin) return true;
    if (isMember && asset.assignedUserId === user.id) return true;
    return false;
  }, [asset, user, isAdmin, isMember]);
  
  if (!asset || !hasAccess) {
    navigate('/assets');
    return null;
  }
  
  const users: User[] = [
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
      role: 'member',
      createdAt: new Date().toISOString(),
    },
  ];
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };
  
  const getStatusIcon = () => {
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
  
  const assignedUserName = useMemo(() => {
    if (!asset.assignedUserId) return 'Unassigned';
    const foundUser = users.find(u => u.id === asset.assignedUserId);
    return foundUser ? foundUser.name : 'Unknown User';
  }, [asset.assignedUserId, users]);
  
  const handleUpdateAsset = async (data: any) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      updateAsset(asset.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAsset = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      deleteAsset(asset.id);
      navigate('/assets');
    } catch (error) {
      console.error('Error deleting asset:', error);
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleDocumentUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadDocument(asset.id, file);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkAsFailed = async () => {
    if (!failureReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      markAsFailed(asset.id, failureReason);
      setShowFailureForm(false);
      setFailureReason('');
    } catch (error) {
      console.error('Error marking asset as failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsInTesting = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      markAsInTesting(asset.id);
    } catch (error) {
      console.error('Error marking asset as in testing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageLayout>
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
              
              {isAdmin && !isEditing && (
                <div className="flex space-x-2">
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
              )}
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <AssetForm
                  users={users}
                  initialData={asset}
                  onSubmit={handleUpdateAsset}
                  onCancel={() => setIsEditing(false)}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Asset ID</p>
                        <p className="mt-1 text-base text-gray-900">{asset.serialNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Class</p>
                        <p className="mt-1 text-base text-gray-900">{asset.assetClass}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assigned To</p>
                        <p className="mt-1 text-base text-gray-900">{assignedUserName}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Issue Date</p>
                        <p className="mt-1 text-base text-gray-900">{formatDate(asset.issueDate)}</p>
                      </div>
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
                  
                  {showDeleteConfirm && (
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
                  )}

                  {showFailureForm && (
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
                            onClick={() => {
                              setShowFailureForm(false);
                              setFailureReason('');
                            }}
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
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
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
                              <p className="text-xs text-gray-500">Uploaded on {doc.uploadDate}</p>
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
        </div>
      </div>
    </PageLayout>
  );
};

export default AssetDetailsPage;