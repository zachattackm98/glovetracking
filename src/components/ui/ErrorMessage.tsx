import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/**
 * ErrorMessage Component
 * 
 * Displays error messages with optional retry functionality
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  isRetrying = false 
}) => {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                isLoading={isRetrying}
                disabled={isRetrying}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;