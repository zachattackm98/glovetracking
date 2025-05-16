import React, { useState } from 'react';
import { X, Upload, Check } from 'lucide-react';
import Button from '../ui/Button';
import { Asset } from '../../types';

interface BulkUploadProps {
  assets: Asset[];
  onUpload: (assetIds: string[], file: File) => Promise<void>;
  onClose: () => void;
  isUploading?: boolean;
}

const BulkUpload: React.FC<BulkUploadProps> = ({
  assets,
  onUpload,
  onClose,
  isUploading = false,
}) => {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAssetToggle = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets.map(asset => asset.id)));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Please select a PDF file');
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedFile && selectedAssets.size > 0) {
      await onUpload(Array.from(selectedAssets), selectedFile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Bulk Certification Upload</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Select Assets</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
              >
                {selectedAssets.size === assets.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {assets.map(asset => (
                <label
                  key={asset.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAssets.has(asset.id)}
                    onChange={() => handleAssetToggle(asset.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{asset.serialNumber}</p>
                    <p className="text-sm text-gray-500">{asset.assetClass}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Certification Document
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-4 bg-gray-50 rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-sm text-gray-900">{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || selectedAssets.size === 0 || isUploading}
            isLoading={isUploading}
          >
            Upload to {selectedAssets.size} Asset{selectedAssets.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;