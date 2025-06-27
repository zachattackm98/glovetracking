import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, TestTube } from 'lucide-react';
import { AssetStatus } from '../../types';

interface StatusIconProps {
  status: AssetStatus;
  className?: string;
}

/**
 * StatusIcon Component
 * 
 * Renders the appropriate icon based on asset status with consistent styling
 */
const StatusIcon: React.FC<StatusIconProps> = ({ status, className = "h-5 w-5" }) => {
  switch (status) {
    case 'active':
      return <CheckCircle className={`${className} text-success-500`} />;
    case 'near-due':
      return <Clock className={`${className} text-warning-500`} />;
    case 'expired':
      return <AlertTriangle className={`${className} text-danger-500`} />;
    case 'failed':
      return <XCircle className={`${className} text-gray-500`} />;
    case 'in-testing':
      return <TestTube className={`${className} text-primary-500`} />;
    default:
      return null;
  }
};

export default StatusIcon;