import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, addMonths } from 'date-fns';
import { Asset, AssetStatus, User, CertificationDocument } from '../types';
import { useUser, useOrganization } from '@clerk/clerk-react';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  uploadDocument: (assetId: string, file: File) => Promise<void>;
  bulkUploadDocument: (assetIds: string[], file: File) => Promise<void>;
  markAsFailed: (id: string, reason: string) => void;
  markAsInTesting: (id: string) => void;
  getAssetsByUser: (userId: string) => Asset[];
  getAssetById: (id: string) => Asset | undefined;
  importAssets: (assets: Partial<Asset>[]) => void;
  exportAssets: () => string;
}

const AssetContext = createContext<AssetContextType>({
  assets: [],
  addAsset: () => {},
  updateAsset: () => {},
  deleteAsset: () => {},
  uploadDocument: async () => {},
  bulkUploadDocument: async () => {},
  markAsFailed: () => {},
  markAsInTesting: () => {},
  getAssetsByUser: () => [],
  getAssetById: () => undefined,
  importAssets: () => {},
  exportAssets: () => '',
});

export const useAssets = () => useContext(AssetContext);

const calculateAssetStatus = (nextCertificationDate: string): AssetStatus => {
  const now = new Date();
  const certDate = new Date(nextCertificationDate);
  const daysUntilExpiration = Math.floor((certDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) {
    return 'expired';
  } else if (daysUntilExpiration <= 30) {
    return 'near-due';
  } else {
    return 'active';
  }
};

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [assets, setAssets] = useState<Asset[]>([]);
  const isAdmin = organization?.membership?.role === 'admin';
  const orgId = organization?.id;

  useEffect(() => {
    if (user && orgId) {
      const storedAssets = localStorage.getItem('safeguard_assets');
      if (storedAssets) {
        const parsedAssets = JSON.parse(storedAssets);
        // Filter assets by organization and user role
        const filteredAssets = parsedAssets.filter((asset: Asset) => {
          const belongsToOrg = asset.orgId === orgId;
          if (!belongsToOrg) return false;
          if (isAdmin) return true;
          return asset.assignedUserId === user.id;
        });
        setAssets(filteredAssets);
      }
    }
  }, [user, orgId, isAdmin]);

  useEffect(() => {
    if (assets.length > 0) {
      localStorage.setItem('safeguard_assets', JSON.stringify(assets));
    }
  }, [assets]);

  const addAsset = (assetData: Omit<Asset, 'id' | 'status' | 'nextCertificationDate' | 'certificationDocuments' | 'orgId'>) => {
    if (!orgId) return;

    const nextCertificationDate = format(addMonths(new Date(assetData.lastCertificationDate), 6), 'yyyy-MM-dd');
    const status = calculateAssetStatus(nextCertificationDate);
    
    const newAsset: Asset = {
      ...assetData,
      id: uuidv4(),
      orgId,
      status,
      nextCertificationDate,
      certificationDocuments: [],
    };
    
    setAssets(prevAssets => [...prevAssets, newAsset]);
  };

  const updateAsset = (id: string, assetData: Partial<Asset>) => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === id && asset.orgId === orgId) {
          const updatedAsset = { ...asset, ...assetData };
          
          if (assetData.lastCertificationDate && !['failed', 'in-testing'].includes(updatedAsset.status)) {
            updatedAsset.nextCertificationDate = format(
              addMonths(new Date(assetData.lastCertificationDate), 6),
              'yyyy-MM-dd'
            );
            updatedAsset.status = calculateAssetStatus(updatedAsset.nextCertificationDate);
          }
          
          return updatedAsset;
        }
        return asset;
      });
    });
  };

  const deleteAsset = (id: string) => {
    setAssets(prevAssets => prevAssets.filter(asset => !(asset.id === id && asset.orgId === orgId)));
  };

  const uploadDocument = async (assetId: string, file: File) => {
    if (!user || !orgId) return;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newDocument: CertificationDocument = {
      id: uuidv4(),
      assetId,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadDate: format(new Date(), 'yyyy-MM-dd'),
      uploadedBy: user.id,
    };
    
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === assetId && asset.orgId === orgId) {
          return {
            ...asset,
            lastCertificationDate: format(new Date(), 'yyyy-MM-dd'),
            nextCertificationDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
            status: 'active',
            certificationDocuments: [...asset.certificationDocuments, newDocument],
          };
        }
        return asset;
      });
    });
  };

  const bulkUploadDocument = async (assetIds: string[], file: File) => {
    if (!user || !orgId) return;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newDocument: CertificationDocument = {
      id: uuidv4(),
      assetId: 'bulk',
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadDate: format(new Date(), 'yyyy-MM-dd'),
      uploadedBy: user.id,
      appliedToAssets: assetIds,
    };
    
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (assetIds.includes(asset.id) && asset.orgId === orgId) {
          return {
            ...asset,
            lastCertificationDate: format(new Date(), 'yyyy-MM-dd'),
            nextCertificationDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
            status: 'active',
            certificationDocuments: [...asset.certificationDocuments, newDocument],
          };
        }
        return asset;
      });
    });
  };

  const markAsFailed = (id: string, reason: string) => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === id && asset.orgId === orgId) {
          return {
            ...asset,
            status: 'failed',
            failureDate: format(new Date(), 'yyyy-MM-dd'),
            failureReason: reason,
          };
        }
        return asset;
      });
    });
  };

  const markAsInTesting = (id: string) => {
    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === id && asset.orgId === orgId) {
          return {
            ...asset,
            status: 'in-testing',
            testingStartDate: format(new Date(), 'yyyy-MM-dd'),
          };
        }
        return asset;
      });
    });
  };

  const getAssetsByUser = (userId: string) => {
    return assets.filter(asset => 
      asset.orgId === orgId && 
      asset.assignedUserId === userId
    );
  };

  const getAssetById = (id: string) => {
    return assets.find(asset => 
      asset.id === id && 
      asset.orgId === orgId
    );
  };

  const importAssets = (newAssets: Partial<Asset>[]) => {
    if (!orgId) return;

    const processedAssets = newAssets.map(asset => {
      if (!asset.lastCertificationDate) {
        throw new Error('Assets must include lastCertificationDate');
      }
      
      const nextCertificationDate = format(
        addMonths(new Date(asset.lastCertificationDate), 6), 
        'yyyy-MM-dd'
      );
      
      return {
        id: uuidv4(),
        orgId,
        serialNumber: asset.serialNumber || `SN-${uuidv4().substring(0, 8)}`,
        assetClass: asset.assetClass || 'Class 1',
        assignedUserId: asset.assignedUserId || null,
        issueDate: asset.issueDate || format(new Date(), 'yyyy-MM-dd'),
        lastCertificationDate: asset.lastCertificationDate,
        nextCertificationDate,
        status: calculateAssetStatus(nextCertificationDate),
        certificationDocuments: [],
      } as Asset;
    });
    
    setAssets(prevAssets => [...prevAssets, ...processedAssets]);
  };

  const exportAssets = () => {
    const orgAssets = assets.filter(asset => asset.orgId === orgId);
    const headers = 'id,serialNumber,assetClass,assignedUserId,issueDate,lastCertificationDate,nextCertificationDate,status,failureDate,failureReason,testingStartDate,orgId\n';
    const csvContent = orgAssets.map(asset => {
      return `${asset.id},${asset.serialNumber},${asset.assetClass},${asset.assignedUserId || ''},${asset.issueDate},${asset.lastCertificationDate},${asset.nextCertificationDate},${asset.status},${asset.failureDate || ''},${asset.failureReason || ''},${asset.testingStartDate || ''},${asset.orgId}`;
    }).join('\n');
    
    return headers + csvContent;
  };

  return (
    <AssetContext.Provider
      value={{
        assets,
        addAsset,
        updateAsset,
        deleteAsset,
        uploadDocument,
        bulkUploadDocument,
        markAsFailed,
        markAsInTesting,
        getAssetsByUser,
        getAssetById,
        importAssets,
        exportAssets,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};