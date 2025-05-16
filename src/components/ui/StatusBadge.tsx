import React from 'react';
import { AssetStatus } from '../../types';

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'near-due':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'expired':
        return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'failed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in-testing':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'near-due':
        return 'Due Soon';
      case 'expired':
        return 'Expired';
      case 'failed':
        return 'Failed';
      case 'in-testing':
        return 'In Testing';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusStyles()} ${className}`}>
      <span className={`mr-1.5 h-2 w-2 rounded-full ${
        status === 'active' ? 'bg-success-500' : 
        status === 'near-due' ? 'bg-warning-500' : 
        status === 'failed' ? 'bg-gray-500' :
        status === 'in-testing' ? 'bg-primary-500' :
        'bg-danger-500'
      }`}></span>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;