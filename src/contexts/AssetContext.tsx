
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext } from 'react';

export interface Asset {
  id: string;
  name: string;
  type: 'bank' | 'stock' | 'crypto' | 'property' | 'mutualfund';
  value: number;
  lastUpdated: string;
}

interface AssetContextType {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  addAsset: (newAssetData: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  updateAsset: (updatedAsset: Asset) => void;
  deleteAsset: (assetId: string) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([
    // Initial example data. Users can modify/delete these or add new ones.
    { id: '1', name: 'Savings Account', type: 'bank', value: 15000, lastUpdated: '2024-07-28' },
    { id: '2', name: 'Tech Stocks', type: 'stock', value: 25000, lastUpdated: '2024-07-28' },
    { id: '3', name: 'Bitcoin Wallet', type: 'crypto', value: 8000, lastUpdated: '2024-07-27' },
    { id: '4', name: 'Rental Property', type: 'property', value: 250000, lastUpdated: '2024-07-01' },
  ]);

  const addAsset = (newAssetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
    const fullNewAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setAssets((prevAssets) => [...prevAssets, fullNewAsset]);
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) => (a.id === updatedAsset.id ? { ...updatedAsset, lastUpdated: new Date().toISOString().split('T')[0] } : a))
    );
  };

  const deleteAsset = (assetId: string) => {
    setAssets((prevAssets) => prevAssets.filter((a) => a.id !== assetId));
  };

  return (
    <AssetContext.Provider value={{ assets, setAssets, addAsset, updateAsset, deleteAsset }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};
