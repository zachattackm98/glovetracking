import React from 'react';
import { Edit, Trash2, TestTube } from 'lucide-react';
import { Asset } from '../../types';
import Button from '../ui/Button';

interface AdminActionsProps {
  asset: Asset;
  isEditing: boolean;
  isSubmitting: boolean;
  onMarkAsInTesting: () => void;
  onShowFailureForm: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * AdminActions Component
 * 
 * Renders admin-only action buttons for asset management
 * Includes conditional rendering based on asset status and editing state
 */
const AdminActions: React.FC<AdminActionsProps> = ({
  asset,
  isEditing,
  isSubmitting,
  onMarkAsInTesting,
  onShowFailureForm,
  onEdit,
  onDelete,
}) => {
  // Don't render if in editing mode
  if (isEditing) return null;

  return (
    <div className="flex space-x-2">
      {/* Show testing button for non-failed, non-testing assets */}
      {asset.status !== 'failed' && asset.status !== 'in-testing' && (
        <Button
          size="sm"
          variant="outline"
          onClick={onMarkAsInTesting}
          disabled={isSubmitting}
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
          onClick={onShowFailureForm}
          disabled={isSubmitting}
          className="text-gray-500 hover:bg-gray-50"
        >
          Mark as Failed
        </Button>
      )}
      
      <Button
        size="sm"
        variant="outline"
        leftIcon={<Edit className="h-4 w-4" />}
        onClick={onEdit}
        disabled={isSubmitting}
      >
        Edit
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        leftIcon={<Trash2 className="h-4 w-4" />}
        onClick={onDelete}
        disabled={isSubmitting}
        className="text-danger-500 hover:bg-danger-50 hover:border-danger-300"
      >
        Delete
      </Button>
    </div>
  );
};

export default AdminActions;