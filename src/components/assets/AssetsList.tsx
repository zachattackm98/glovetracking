import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Asset, AssetStatus, AssetClass } from '../../types';
import AssetCard from './AssetCard';

interface AssetsListProps {
  assets: Asset[];
  userMap?: Record<string, string>;
}

const AssetsList: React.FC<AssetsListProps> = ({ assets, userMap = {} }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>(
    (searchParams.get('status') as AssetStatus | 'all') || 'all'
  );
  const [classFilter, setClassFilter] = useState<AssetClass | 'all'>('all');
  
  // Update status filter when URL parameter changes
  useEffect(() => {
    const statusParam = searchParams.get('status') as AssetStatus | null;
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);
  
  const filteredAssets = assets.filter(asset => {
    // Apply search filter
    const matchesSearch = (asset.serial_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    
    // Apply class filter
    const matchesClass = classFilter === 'all' || asset.asset_class === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });
  
  const handleStatusChange = (value: AssetStatus | 'all') => {
    setStatusFilter(value);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams);
  };
  
  const assetClasses: AssetClass[] = ['Class 0', 'Class 00', 'Class 1', 'Class 2', 'Class 3', 'Class 4'];
  
  return (
    <div>
      <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="relative md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search by serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <div className="relative inline-flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as AssetStatus | 'all')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="near-due">Due Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value as AssetClass | 'all')}
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Classes</option>
            {assetClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-lg text-gray-500">No assets found.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredAssets.map((asset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset} 
              userName={asset.assigned_user_id ? userMap[asset.assigned_user_id] : 'Unassigned'} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetsList;