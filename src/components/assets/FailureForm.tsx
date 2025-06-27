import React from 'react';
import Button from '../ui/Button';

interface FailureFormProps {
  showFailureForm: boolean;
  failureReason: string;
  isSubmitting: boolean;
  onFailureReasonChange: (reason: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * FailureForm Component
 * 
 * Renders a form for entering failure reasons when marking an asset as failed
 * Includes validation to ensure a reason is provided
 */
const FailureForm: React.FC<FailureFormProps> = ({
  showFailureForm,
  failureReason,
  isSubmitting,
  onFailureReasonChange,
  onSubmit,
  onCancel,
}) => {
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
            onChange={(e) => onFailureReasonChange(e.target.value)}
            placeholder="Describe the reason for failure..."
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end space-x-3">
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
            variant="primary"
            onClick={onSubmit}
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

export default FailureForm;