import React, { useMemo } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, TestTube, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
import PageLayout from '../components/layout/PageLayout';
import { useAssets } from '../context/AssetContext';
import StatusChart from '../components/dashboard/StatusChart';
import StatCard from '../components/dashboard/StatCard';
import AssetCard from '../components/assets/AssetCard';
import Button from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { assets } = useAssets();
  
  const isAdmin = organization?.membership?.role === 'admin';
  const isMember = organization?.membership?.role === 'member';
  
  const assetStats = useMemo(() => {
    return {
      total: assets.length,
      active: assets.filter(a => a.status === 'active').length,
      nearDue: assets.filter(a => a.status === 'near-due').length,
      expired: assets.filter(a => a.status === 'expired').length,
      inTesting: assets.filter(a => a.status === 'in-testing').length,
      failed: assets.filter(a => a.status === 'failed').length,
    };
  }, [assets]);
  
  const userAssets = useMemo(() => {
    if (isMember) {
      return assets.filter(asset => asset.assignedUserId === user?.id);
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
          
          const dateA = new Date(a.nextCertificationDate);
          const dateB = new Date(b.nextCertificationDate);
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
        const dateA = new Date(a.testingStartDate!);
        const dateB = new Date(b.testingStartDate!);
        return dateB.getTime() - dateA.getTime();
      });
  }, [assets]);

  const failedAssets = useMemo(() => {
    return assets
      .filter(asset => asset.status === 'failed')
      .sort((a, b) => {
        const dateA = new Date(a.failureDate!);
        const dateB = new Date(b.failureDate!);
        return dateB.getTime() - dateA.getTime();
      });
  }, [assets]);
  
  return (
    <PageLayout title="Dashboard" description="Overview of your safety equipment status">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Total Assets"
          value={assetStats.total}
          icon={<Shield className="h-6 w-6" />}
          color="primary"
          linkTo="/assets"
        />
        <StatCard
          title="Active"
          value={assetStats.active}
          icon={<CheckCircle className="h-6 w-6" />}
          color="success"
          linkTo="/assets?status=active"
        />
        <StatCard
          title="Due Soon"
          value={assetStats.nearDue}
          icon={<Clock className="h-6 w-6" />}
          color="warning"
          linkTo="/assets?status=near-due"
        />
        <StatCard
          title="Expired"
          value={assetStats.expired}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="danger"
          linkTo="/assets?status=expired"
        />
        <StatCard
          title="In Testing"
          value={assetStats.inTesting}
          icon={<TestTube className="h-6 w-6" />}
          color="primary"
          linkTo="/assets?status=in-testing"
        />
        <StatCard
          title="Failed"
          value={assetStats.failed}
          icon={<XCircle className="h-6 w-6" />}
          color="danger"
          linkTo="/assets?status=failed"
        />
      </div>
      
      {isAdmin && (
        <div className="mt-8 flex gap-4">
          <Link to="/users">
            <Button>Manage Users</Button>
          </Link>
          <Link to="/import-export">
            <Button variant="secondary">Import/Export Assets</Button>
          </Link>
        </div>
      )}
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatusChart assets={assets} />
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
                                {asset.serialNumber}
                              </Link>
                              <p className="text-sm text-gray-500">{asset.assetClass}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Testing since: {new Date(asset.testingStartDate!).toLocaleDateString()}
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
                                {asset.serialNumber}
                              </Link>
                              <p className="text-sm text-gray-500">{asset.assetClass}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Failed on: {new Date(asset.failureDate!).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-danger-600 mt-1">
                                Reason: {asset.failureReason}
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
                                {asset.serialNumber}
                              </Link>
                              <p className="text-sm text-gray-500">{asset.assetClass}</p>
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