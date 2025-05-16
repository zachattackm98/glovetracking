import React from 'react';
import { Asset, AssetStatus } from '../../types';

interface StatusChartProps {
  assets: Asset[];
}

const StatusChart: React.FC<StatusChartProps> = ({ assets }) => {
  // Count assets by status
  const counts = {
    active: assets.filter(a => a.status === 'active').length,
    nearDue: assets.filter(a => a.status === 'near-due').length,
    expired: assets.filter(a => a.status === 'expired').length,
  };
  
  const total = assets.length;
  
  // Calculate percentages
  const percentages = {
    active: total ? Math.round((counts.active / total) * 100) : 0,
    nearDue: total ? Math.round((counts.nearDue / total) * 100) : 0,
    expired: total ? Math.round((counts.expired / total) * 100) : 0,
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5">
        <h3 className="text-lg font-medium text-gray-900">Asset Status Overview</h3>
        
        <div className="mt-4 space-y-6">
          {/* Progress bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-success-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{counts.active}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-success-500 h-2 rounded-full"
                  style={{ width: `${percentages.active}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-warning-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700">Due Soon</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{counts.nearDue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-warning-500 h-2 rounded-full"
                  style={{ width: `${percentages.nearDue}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-danger-500 mr-2"></span>
                  <span className="text-sm font-medium text-gray-700">Expired</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{counts.expired}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-danger-500 h-2 rounded-full"
                  style={{ width: `${percentages.expired}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Legend and total */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">Total Assets</div>
              <div className="text-lg font-semibold text-gray-900">{total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusChart;