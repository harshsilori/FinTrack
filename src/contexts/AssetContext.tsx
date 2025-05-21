
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useState, useContext, useCallback } from 'react';

export interface AssetPriceData {
  date: string;
  price: number;
}

export type AssetCategory = 'bank' | 'stock' | 'crypto' | 'property' | 'mutualfund';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  quantity: number; 
  purchasePrice?: number; // Optional, mainly for trackable assets
  tickerSymbol?: string; // Optional, mainly for trackable assets
  currentPrice?: number; // For bank/property this is their main value. For trackable, it's fetched.
  previousClosePrice?: number; // For trackable assets
  lastUpdated: string;
  lastPriceUpdate?: string;
  priceHistory?: AssetPriceData[];
}

interface AssetContextType {
  assets: Asset[];
  addAsset: (newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>) => void;
  updateAsset: (updatedAsset: Partial<Omit<Asset, 'lastUpdated' | 'lastPriceUpdate'>> & { id: string }) => void;
  deleteAsset: (assetId: string) => void;
  updateAssetPrice: (assetId: string, priceData: { currentPrice: number; previousClosePrice: number; priceHistory?: AssetPriceData[] }) => void;
  getAssetMarketValue: (asset: Asset) => number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// More distinct mock price histories for different asset types for better visual variety
const mockStockPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 150 }, { date: '2024-07-08', price: 155 }, { date: '2024-07-15', price: 152 }, { date: '2024-07-22', price: 160 }, { date: '2024-07-29', price: 165 },
];
const mockCryptoPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 3000 }, { date: '2024-07-08', price: 3200 }, { date: '2024-07-15', price: 2900 }, { date: '2024-07-22', price: 3300 }, { date: '2024-07-29', price: 3500 },
];
const mockMutualFundPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 75 }, { date: '2024-07-08', price: 76 }, { date: '2024-07-15', price: 75.5 }, { date: '2024-07-22', price: 77 }, { date: '2024-07-29', price: 78 },
];

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([
    { 
      id: '1', name: 'Main Savings', category: 'bank', quantity: 1, 
      currentPrice: 25000, lastUpdated: '2024-07-28', lastPriceUpdate: '2024-07-28',
      priceHistory: [{date: '2024-07-01', price: 24900}, {date: '2024-07-28', price: 25000}]
    },
    { 
      id: '2', name: 'Innovate Corp Shares', category: 'stock', tickerSymbol: 'INVC', quantity: 100, purchasePrice: 150, 
      currentPrice: 165, previousClosePrice: 162, lastUpdated: '2024-07-28', lastPriceUpdate: '2024-07-29',
      priceHistory: mockStockPriceHistory
    },
    { 
      id: '3', name: 'Digital Token X', category: 'crypto', tickerSymbol: 'DTX', quantity: 5, purchasePrice: 3000, 
      currentPrice: 3500, previousClosePrice: 3450, lastUpdated: '2024-07-27', lastPriceUpdate: '2024-07-29',
      priceHistory: mockCryptoPriceHistory
    },
    { 
      id: '4', name: 'Investment Property', category: 'property', quantity: 1, 
      currentPrice: 320000, lastUpdated: '2024-07-01', lastPriceUpdate: '2024-07-01',
      priceHistory: [{date: '2024-01-01', price: 315000}, {date: '2024-07-01', price: 320000}]
    },
    {
      id: '5', name: 'Diversified Index Fund', category: 'mutualfund', tickerSymbol: 'DIF99', quantity: 200, purchasePrice: 75,
      currentPrice: 78, previousClosePrice: 77.5, lastUpdated: '2024-07-25', lastPriceUpdate: '2024-07-29',
      priceHistory: mockMutualFundPriceHistory
    }
  ]);

  const addAsset = useCallback((newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>) => {
    const isTrackable = newAssetData.category === 'stock' || newAssetData.category === 'crypto' || newAssetData.category === 'mutualfund';
    let historyForNewAsset: AssetPriceData[] = [];
    if (isTrackable) {
        if (newAssetData.category === 'stock') historyForNewAsset = mockStockPriceHistory.map(p => ({...p, price: p.price * ((newAssetData.purchasePrice || 150) / 150) }));
        else if (newAssetData.category === 'crypto') historyForNewAsset = mockCryptoPriceHistory.map(p => ({...p, price: p.price * ((newAssetData.purchasePrice || 3000) / 3000) }));
        else if (newAssetData.category === 'mutualfund') historyForNewAsset = mockMutualFundPriceHistory.map(p => ({...p, price: p.price * ((newAssetData.purchasePrice || 75) / 75) }));
    } else {
        historyForNewAsset = [{date: new Date().toISOString().split('T')[0], price: newAssetData.currentPrice || 0}];
    }

    const fullNewAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
      // For trackable, currentPrice and previousClosePrice are initially set to purchasePrice (or 0 if not available), will be updated by refresh
      // For non-trackable, currentPrice is set from form, no previousClosePrice
      currentPrice: newAssetData.currentPrice, // This will be purchasePrice for new trackable, or form value for non-trackable
      previousClosePrice: newAssetData.previousClosePrice, // This will be purchasePrice for new trackable, or undefined for non-trackable
      lastPriceUpdate: newAssetData.currentPrice !== undefined ? new Date().toISOString().split('T')[0] : undefined,
      priceHistory: historyForNewAsset,
    };
    setAssets((prevAssets) => [...prevAssets, fullNewAsset]);
  }, []);

  const updateAsset = useCallback((updatedAssetData: Partial<Omit<Asset, 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory' | 'priceHistory'>> & { id: string }) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.id === updatedAssetData.id
          ? { 
              ...a, 
              ...updatedAssetData, 
              lastUpdated: new Date().toISOString().split('T')[0],
              // Only update lastPriceUpdate if currentPrice is explicitly part of updatedAssetData (for bank/property) and changed
              lastPriceUpdate: (updatedAssetData.currentPrice !== undefined && updatedAssetData.currentPrice !== a.currentPrice)
                               ? new Date().toISOString().split('T')[0]
                               : a.lastPriceUpdate,
            }
          : a
      )
    );
  }, []);

  const deleteAsset = useCallback((assetId: string) => {
    setAssets((prevAssets) => prevAssets.filter((a) => a.id !== assetId));
  }, []);

  const updateAssetPrice = useCallback((assetId: string, priceData: { currentPrice: number; previousClosePrice: number; priceHistory?: AssetPriceData[] }) => {
    setAssets((prevAssets) => 
      prevAssets.map((asset) => 
        asset.id === assetId 
          ? { 
              ...asset, 
              currentPrice: priceData.currentPrice, 
              previousClosePrice: priceData.previousClosePrice,
              lastPriceUpdate: new Date().toISOString().split('T')[0],
              priceHistory: priceData.priceHistory || asset.priceHistory 
            } 
          : asset
      )
    );
  }, []);
  
  const getAssetMarketValue = useCallback((asset: Asset): number => {
    if (asset.category === 'bank' || asset.category === 'property') {
      return asset.currentPrice || 0; // For these types, currentPrice is the total value, quantity is 1
    }
    // For trackable assets
    if (asset.currentPrice !== undefined && asset.quantity !== undefined) {
      return asset.currentPrice * asset.quantity;
    }
    return 0;
  }, []);


  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset, updateAssetPrice, getAssetMarketValue }}>
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
