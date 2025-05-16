import React from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color: 'primary' | 'success' | 'warning' | 'danger';
  linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  color,
  linkTo,
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary-50 text-primary-700';
      case 'success':
        return 'bg-success-50 text-success-700';
      case 'warning':
        return 'bg-warning-50 text-warning-700';
      case 'danger':
        return 'bg-danger-50 text-danger-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const CardContent = () => (
    <>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${getColorStyles()}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm flex items-center">
            <span
              className={`mr-1 ${
                change.type === 'increase' ? 'text-success-500' : 'text-danger-500'
              }`}
            >
              {change.type === 'increase' ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </span>
            <span
              className={`font-medium ${
                change.type === 'increase' ? 'text-success-600' : 'text-danger-600'
              }`}
            >
              {change.value}%
            </span>
            <span className="ml-1 text-gray-500">from last month</span>
          </div>
        </div>
      )}
    </>
  );

  const baseClasses = "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md";

  return linkTo ? (
    <Link to={linkTo} className={baseClasses}>
      <CardContent />
    </Link>
  ) : (
    <div className={baseClasses}>
      <CardContent />
    </div>
  );
};

export default StatCard;