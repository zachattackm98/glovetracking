import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import Button from '../ui/Button';
import { CertificationDocument } from '../../types';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  assetId: string;
  onUpload: (document: CertificationDocument) => void;
  documents: CertificationDocument[];
  isUploading?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  assetId,
  onUpload, 
  documents, 
  isUploading = false 
}) => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedFile || !user || !organization) return;

    setUploading(true);
    const uploadPromise = (async () => {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('assetId', assetId);
        formData.append('orgId', organization.id);
        formData.append('userId', user.id);

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const { data } = await response.json();
        onUpload(data);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return 'Document uploaded successfully';
      } catch (error) {
        throw new Error('Failed to upload document');
      } finally {
        setUploading(false);
      }
    })();

    toast.promise(uploadPromise, {
      loading: 'Uploading document...',
      success: (message) => message,
      error: (error) => error.message,
    });
  };
  
  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        
        <Upload className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-lg font-medium text-gray-700 mb-1">Drag and drop your file here</p>
        <p className="text-sm text-gray-500">PDF files only</p>
        
        <Button 
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </Button>
      </div>
      
      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <File className="h-6 w-6 text-primary-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="text-gray-500"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              isLoading={uploading || isUploading}
              disabled={uploading || isUploading}
            >
              Upload
            </Button>
          </div>
        </div>
      )}
      
      {documents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">Uploaded Documents</h3>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id} className="bg-white border border-gray-200 rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <File className="h-5 w-5 text-primary-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">Uploaded on {new Date(doc.uploadDate).toLocaleDateString()}</p>
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
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;