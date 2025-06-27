import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

interface DeleteConfirmProps {
  showDeleteConfirm: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConfirm Component
 * 
 * Renders a confirmation dialog for asset deletion
 * Includes warning styling and clear action buttons
 */
const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  showDeleteConfirm,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
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
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onConfirm}
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

export default DeleteConfirm;