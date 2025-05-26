import React, { useMemo } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, TestTube, XCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useRole } from '../hooks/useRole';
import { useAssets } from '../hooks/useAssets';
import PageLayout from '../components/layout/PageLayout';
import StatusChart from '../components/dashboard/StatusChart';
import StatCard from '../components/dashboard/StatCard';
import AssetCard from '../components/assets/AssetCard';
import Button from '../components/ui/Button';

// Add DashboardStatCard component
const DashboardStatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center">
    <div className="text-4xl font-bold text-primary-600 mb-2">{value}</div>
    <div className="text-lg font-semibold text-gray-700">{title}</div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, isMember } = useRole();
  const { assets } = useAssets();
  
  const assetStats = useMemo(() => {
    const relevantAssets = isAdmin
      ? assets
      : isMember
        ? assets.filter(asset => asset.assigned_user_id === user?.id)
        : [];
    return {
      total: relevantAssets.length,
      active: relevantAssets.filter(a => a.status === 'active').length,
      near_due: relevantAssets.filter(a => a.status === 'near-due').length,
      expired: relevantAssets.filter(a => a.status === 'expired').length,
      in_testing: relevantAssets.filter(a => a.status === 'in-testing').length,
      failed: relevantAssets.filter(a => a.status === 'failed').length,
    };
  }, [assets, user, isAdmin, isMember]);
  
  const userAssets = useMemo(() => {
    if (isMember) {
      return assets.filter(asset => asset.assigned_user_id === user?.id);
    }
    return [];
  }, [assets, user, isMember]);
  
  const assetsNeedingAttention = useMemo(() => {
    if (isAdmin) {
      return assets
        .filter(asset => asset.status === 'expired' || asset.status === 'near-due')
        .sort((a, b) => {
          if (a.status === 'expired' && b.status !== 'expired') return -1;
          if (a.status !== 'expired' && b.status === 'expired') return 1;
          
          const dateA = new Date(a.next_certification_date);
          const dateB = new Date(b.next_certification_date);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 3);
    }
    return [];
  }, [assets, isAdmin]);

  const assetsInTesting = useMemo(() => {
    return assets
      .filter(asset => asset.status === 'in-testing')
      .sort((a, b) => {
        const dateA = new Date(a.testing_start_date!);
        const dateB = new Date(b.testing_start_date!);
        return dateB.getTime() - dateA.getTime();
      });
  }, [assets]);

  const failedAssets = useMemo(() => {
    return assets
      .filter(asset => asset.status === 'failed')
      .sort((a, b) => {
        const dateA = new Date(a.failure_date!);
        const dateB = new Date(b.failure_date!);
        return dateB.getTime() - dateA.getTime();
      });
  }, [assets]);

  return (
    <PageLayout title="Dashboard" description="Overview of your organization's safety equipment.">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/assets">
          <DashboardStatCard title="Total Assets" value={assetStats.total} />
        </Link>
        <Link to="/assets?status=active">
          <DashboardStatCard title="Active" value={assetStats.active} />
        </Link>
        <Link to="/assets?status=near-due">
          <DashboardStatCard title="Due Soon" value={assetStats.near_due} />
        </Link>
        <Link to="/assets?status=expired">
          <DashboardStatCard title="Expired" value={assetStats.expired} />
        </Link>
        <Link to="/assets?status=in-testing">
          <DashboardStatCard title="In Testing" value={assetStats.in_testing} />
        </Link>
        <Link to="/assets?status=failed">
          <DashboardStatCard title="Failed" value={assetStats.failed} />
        </Link>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatusChart assets={isAdmin ? assets : isMember ? assets.filter(asset => asset.assigned_user_id === user?.id) : []} 
            showStatuses={['active', 'near-due', 'expired', 'in-testing', 'failed']} 
          />
        </div>
        <div className="lg:col-span-2">
          {isAdmin && (
            <div className="space-y-6">
              {assetsInTesting.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <TestTube className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Assets In Testing</h3>
                      </div>
                      <Link
                        to="/assets?status=in-testing"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {assetsInTesting.slice(0, 3).map(asset => (
                        <div key={asset.id} className="border border-gray-200 rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link
                                to={`/assets/${asset.id}`}
                                className="text-base font-medium text-gray-900 hover:text-primary-600"
                              >
                                {asset.serial_number}
                              </Link>
                              <p className="text-sm text-gray-500">{asset.asset_class}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Testing since: {new Date(asset.testing_start_date!).toLocaleDateString()}
                              </p>
                            </div>
                            <Link to={`/assets/${asset.id}`}>
                              <Button size="sm">Update Certification</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {failedAssets.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-danger-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Failed Assets</h3>
                      </div>
                      <Link
                        to="/assets?status=failed"
                        className="text-sm font-medium text-danger-600 hover:text-danger-700"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {failedAssets.slice(0, 3).map(asset => (
                        <div key={asset.id} className="border border-gray-200 rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link
                                to={`/assets/${asset.id}`}
                                className="text-base font-medium text-gray-900 hover:text-primary-600"
                              >
                                {asset.serial_number}
                              </Link>
                              <p className="text-sm text-gray-500">{asset.asset_class}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Failed on: {new Date(asset.failure_date!).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-danger-600 mt-1">
                                Reason: {asset.failure_reason}
                              </p>
                            </div>
                            <Link to={`/assets/${asset.id}`}>
                              <Button size="sm">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {assetsNeedingAttention.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Assets Needing Attention</h3>
                      <Link
                        to="/assets"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {assetsNeedingAttention.map(asset => (
                        <div key={asset.id} className="border border-gray-200 rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link
                                to={`/assets/${asset.id}`}
                                className="text-base font-medium text-gray-900 hover:text-primary-600"
                              >
                                {asset.serial_number}
                              </Link>
                              <p className="text-sm text-gray-500">{asset.asset_class}</p>
                            </div>
                            <div>
                              {asset.status === 'expired' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                                  Due Soon
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Link to={`/assets/${asset.id}`}>
                              <Button size="sm">Mark as Testing</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {isMember && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Assigned Assets</h3>
                  <div className="text-sm">
                    Total: <span className="font-medium">{userAssets.length}</span>
                  </div>
                </div>
                {userAssets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No assets are currently assigned to you.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userAssets.slice(0, 4).map(asset => (
                      <AssetCard 
                        key={asset.id} 
                        asset={asset} 
                        userName={user?.fullName || 'Unknown'} 
                        showActions={false} 
                      />
                    ))}
                  </div>
                )}
                {userAssets.length > 4 && (
                  <div className="mt-4 text-center">
                    <Link
                      to="/assets"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View all {userAssets.length} assets
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;