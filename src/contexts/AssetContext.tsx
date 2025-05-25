
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
  currency: string;
  quantity: number;
  purchasePrice?: number;
  tickerSymbol?: string;
  currentPrice?: number;
  previousClosePrice?: number;
  lastUpdated: string;
  lastPriceUpdate?: string;
  priceHistory?: AssetPriceData[];
}

interface AssetContextType {
  assets: Asset[];
  addAsset: (newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>) => Asset; // Changed return type
  updateAsset: (updatedAsset: Partial<Omit<Asset, 'lastUpdated' | 'lastPriceUpdate'>> & { id: string }) => void;
  deleteAsset: (assetId: string) => void;
  updateAssetPrice: (assetId: string, priceData: { currentPrice: number; previousClosePrice: number; priceHistory?: AssetPriceData[] }) => void;
  getAssetMarketValue: (asset: Asset) => number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

const mockStockPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 150 }, { date: '2024-07-08', price: 155 }, { date: '2024-07-15', price: 152 }, { date: '2024-07-22', price: 160 }, { date: '2024-07-29', price: 165 },
];
const mockCryptoPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 0.50 }, { date: '2024-07-08', price: 0.52 }, { date: '2024-07-15', price: 0.48 }, { date: '2024-07-22', price: 0.55 }, { date: '2024-07-29', price: 0.58 },
];
const mockMutualFundPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 75 }, { date: '2024-07-08', price: 76 }, { date: '2024-07-15', price: 75.5 }, { date: '2024-07-22', price: 77 }, { date: '2024-07-29', price: 78 },
];

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1', name: 'Main Savings', category: 'bank', currency: 'USD', quantity: 1,
      currentPrice: 25000, lastUpdated: '2024-07-28', lastPriceUpdate: '2024-07-28',
      priceHistory: [{date: '2024-07-01', price: 24900}, {date: '2024-07-28', price: 25000}]
    },
    {
      id: '2', name: 'Innovate Corp Shares', category: 'stock', currency: 'USD', tickerSymbol: 'INVC', quantity: 100, purchasePrice: 150,
      currentPrice: 165, previousClosePrice: 162, lastUpdated: '2024-07-28', lastPriceUpdate: '2024-07-29',
      priceHistory: mockStockPriceHistory
    },
    {
      id: '3', name: 'Digital Token X', category: 'crypto', currency: 'USD', tickerSymbol: 'DTX', quantity: 5000, purchasePrice: 0.50,
      currentPrice: 0.58, previousClosePrice: 0.55, lastUpdated: '2024-07-27', lastPriceUpdate: '2024-07-29',
      priceHistory: mockCryptoPriceHistory
    },
    {
      id: '4', name: 'Investment Property', category: 'property', currency: 'EUR', quantity: 1,
      currentPrice: 320000, lastUpdated: '2024-07-01', lastPriceUpdate: '2024-07-01',
      priceHistory: [{date: '2024-01-01', price: 315000}, {date: '2024-07-01', price: 320000}]
    },
    {
      id: '5', name: 'Diversified Index Fund', category: 'mutualfund', currency: 'INR', tickerSymbol: 'DIF99', quantity: 200, purchasePrice: 6000,
      currentPrice: 6240, previousClosePrice: 6200, lastUpdated: '2024-07-25', lastPriceUpdate: '2024-07-29',
      priceHistory: mockMutualFundPriceHistory.map(p => ({ ...p, price: p.price * 80 }))
    }
  ]);

  const addAsset = useCallback((newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>): Asset => {
    const isTrackable = newAssetData.category === 'stock' || newAssetData.category === 'crypto' || newAssetData.category === 'mutualfund';

    let historyForNewAsset: AssetPriceData[] = [];
    const basePriceForHistory = isTrackable ? (newAssetData.purchasePrice || 0) : (newAssetData.currentPrice || 0);

    if (isTrackable) {
        let baseHistory: AssetPriceData[];
        if (newAssetData.category === 'stock') baseHistory = mockStockPriceHistory;
        else if (newAssetData.category === 'crypto') baseHistory = mockCryptoPriceHistory;
        else baseHistory = mockMutualFundPriceHistory;

        const firstHistoryPrice = baseHistory.length > 0 ? baseHistory[0].price : 1;
        historyForNewAsset = baseHistory.map(p => ({
            ...p,
            price: parseFloat(((p.price / firstHistoryPrice) * basePriceForHistory).toFixed(2))
        }));
        if (historyForNewAsset.length > 0) {
            historyForNewAsset[historyForNewAsset.length - 1].price = basePriceForHistory;
        } else {
            historyForNewAsset.push({date: new Date().toISOString().split('T')[0], price: basePriceForHistory});
        }

    } else {
        historyForNewAsset = [{date: new Date().toISOString().split('T')[0], price: basePriceForHistory}];
    }

    const fullNewAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // More unique ID
      lastUpdated: new Date().toISOString().split('T')[0],
      currentPrice: isTrackable ? newAssetData.purchasePrice : newAssetData.currentPrice,
      previousClosePrice: isTrackable ? newAssetData.purchasePrice : undefined,
      lastPriceUpdate: (newAssetData.currentPrice !== undefined || newAssetData.purchasePrice !== undefined) ? new Date().toISOString().split('T')[0] : undefined,
      priceHistory: historyForNewAsset,
    };
    setAssets((prevAssets) => [...prevAssets, fullNewAsset]);
    return fullNewAsset; // Return the newly created asset
  }, []);

  const updateAsset = useCallback((updatedAssetData: Partial<Omit<Asset, 'lastUpdated' | 'lastPriceUpdate'>> & { id: string }) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.id === updatedAssetData.id
          ? {
              ...a,
              ...updatedAssetData,
              lastUpdated: new Date().toISOString().split('T')[0],
              lastPriceUpdate: (updatedAssetData.currentPrice !== undefined && updatedAssetData.currentPrice !== a.currentPrice && (a.category === 'bank' || a.category === 'property'))
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
      return asset.currentPrice || 0;
    }
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
