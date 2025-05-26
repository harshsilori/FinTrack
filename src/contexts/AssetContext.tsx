
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export type AssetCategory = 'bank' | 'stock' | 'crypto' | 'property' | 'mutualfund';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currency: string;
  quantity: number;
  purchasePrice?: number; // Optional: for calculating all-time gain/loss
  currentPrice: number; // Mandatory: user-inputted current price
  tickerSymbol?: string; // Optional: for user reference
  lastUpdated: string;
}

interface AssetContextType {
  assets: Asset[];
  addAsset: (newAssetData: Omit<Asset, 'id' | 'lastUpdated'>) => Asset;
  updateAsset: (updatedAsset: Partial<Omit<Asset, 'lastUpdated'>> & { id: string }) => void;
  deleteAsset: (assetId: string) => void;
  getAssetMarketValue: (asset: Asset) => number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1', name: 'Main Savings', category: 'bank', currency: 'USD', quantity: 1,
      currentPrice: 25000, lastUpdated: '2024-07-28',
    },
    {
      id: '2', name: 'Innovate Corp Shares', category: 'stock', currency: 'USD', tickerSymbol: 'INVC', quantity: 100, purchasePrice: 150,
      currentPrice: 165, lastUpdated: '2024-07-28',
    },
    {
      id: '3', name: 'Digital Token X', category: 'crypto', currency: 'USD', tickerSymbol: 'DTX', quantity: 5000, purchasePrice: 0.50,
      currentPrice: 0.58, lastUpdated: '2024-07-27',
    },
    {
      id: '4', name: 'Investment Property', category: 'property', currency: 'EUR', quantity: 1,
      currentPrice: 320000, lastUpdated: '2024-07-01',
    },
    {
      id: '5', name: 'Diversified Index Fund', category: 'mutualfund', currency: 'INR', tickerSymbol: 'DIF99', quantity: 200, purchasePrice: 6000,
      currentPrice: 6240, lastUpdated: '2024-07-25',
    }
  ]);

  const addAsset = useCallback((newAssetData: Omit<Asset, 'id' | 'lastUpdated'>): Asset => {
    const fullNewAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setAssets((prevAssets) => [...prevAssets, fullNewAsset]);
    return fullNewAsset;
  }, []);

  const updateAsset = useCallback((updatedAssetData: Partial<Omit<Asset, 'lastUpdated'>> & { id: string }) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.id === updatedAssetData.id
          ? {
              ...a,
              ...updatedAssetData,
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : a
      )
    );
  }, []);

  const deleteAsset = useCallback((assetId: string) => {
    setAssets((prevAssets) => prevAssets.filter((a) => a.id !== assetId));
  }, []);

  const getAssetMarketValue = useCallback((asset: Asset): number => {
    // For bank/property, currentPrice is the total value, quantity is 1.
    // For others, it's currentPrice per unit * quantity.
    if (asset.category === 'bank' || asset.category === 'property') {
      return asset.currentPrice;
    }
    return asset.currentPrice * asset.quantity;
  }, []);


  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset, getAssetMarketValue }}>
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
