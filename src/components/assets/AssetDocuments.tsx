import React from 'react';
import { FileText } from 'lucide-react';
import { Asset, CertificationDocument } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import DocumentUpload from './DocumentUpload';

interface AssetDocumentsProps {
  asset: Asset;
  isAdmin: boolean;
  isUploading: boolean;
  onDocumentUpload: (file: File) => void;
}

/**
 * AssetDocuments Component
 * 
 * Renders the documents section for an asset
 * Shows upload interface for admins or read-only list for members
 * Conditionally renders based on user role and asset status
 */
const AssetDocuments: React.FC<AssetDocumentsProps> = ({
  asset,
  isAdmin,
  isUploading,
  onDocumentUpload,
}) => {
  /**
   * Renders the document upload interface or document list
   */
  const renderDocumentContent = (): React.ReactNode => {
    // Show upload interface for admins on non-failed assets
    if (isAdmin && asset.status !== 'failed') {
      return (
        <DocumentUpload
          assetId={asset.id}
          onUpload={onDocumentUpload}
          documents={asset.certificationDocuments}
          isUploading={isUploading}
        />
      );
    }

    // Show read-only document list
    if (asset.certificationDocuments.length === 0) {
      return <p className="text-gray-500 text-sm">No documents available</p>;
    }

    return (
      <ul className="space-y-2">
        {asset.certificationDocuments.map((doc) => (
          <li 
            key={doc.id} 
            className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center justify-between"
          >
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
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Certification Documents</h3>
        </div>
      </CardHeader>
      <CardContent>
        {renderDocumentContent()}
      </CardContent>
    </Card>
  );
};

export default AssetDocuments;