
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
  name: string; // User-defined name, e.g., "Google Shares"
  category: AssetCategory; // To determine how to handle it
  tickerSymbol?: string; // e.g., GOOG, BTC-USD, ISIN. User input.
  quantity: number; // User input
  purchasePrice?: number; // User input (per unit), optional for bank/property

  // Fetched or manually updated data
  currentPrice?: number; // Current market price per unit (or total value for bank/property)
  previousClosePrice?: number; // Previous day's closing price for daily gain calc

  lastUpdated: string; // When the asset details were last saved
  lastPriceUpdate?: string; // When currentPrice was last fetched/updated

  priceHistory?: AssetPriceData[]; // For individual asset chart
}

interface AssetContextType {
  assets: Asset[];
  addAsset: (newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>) => void;
  updateAsset: (updatedAsset: Omit<Asset, 'lastUpdated' | 'lastPriceUpdate'> & { id: string }) => void;
  deleteAsset: (assetId: string) => void;
  updateAssetPrice: (assetId: string, priceData: { currentPrice: number; previousClosePrice: number; priceHistory?: AssetPriceData[] }) => void;
  getAssetMarketValue: (asset: Asset) => number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

const initialPriceHistory: AssetPriceData[] = [
  { date: '2024-07-01', price: 100 },
  { date: '2024-07-08', price: 102 },
  { date: '2024-07-15', price: 101 },
  { date: '2024-07-22', price: 105 },
  { date: '2024-07-29', price: 108 },
];

export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([
    { 
      id: '1', name: 'Savings Account', category: 'bank', quantity: 1, 
      currentPrice: 15000, lastUpdated: '2024-07-28', lastPriceUpdate: '2024-07-28',
      priceHistory: [{date: '2024-07-01', price: 14900}, {date: '2024-07-28', price: 15000}]
    },
    { 
      id: '2', name: 'Tech Innovators LLC', category: 'stock', tickerSymbol: 'TECH', quantity: 50, purchasePrice: 200, 
      currentPrice: 250, previousClosePrice: 245, lastUpdated: '2024-07-28', lastPriceUpdate: '2024-07-29',
      priceHistory: initialPriceHistory.map(p => ({...p, price: p.price * 2.5}))
    },
    { 
      id: '3', name: 'Digital Coin', category: 'crypto', tickerSymbol: 'DGC', quantity: 10, purchasePrice: 700, 
      currentPrice: 800, previousClosePrice: 810, lastUpdated: '2024-07-27', lastPriceUpdate: '2024-07-29',
      priceHistory: initialPriceHistory.map(p => ({...p, price: p.price * 8}))
    },
    { 
      id: '4', name: 'Downtown Apartment', category: 'property', quantity: 1, 
      currentPrice: 250000, lastUpdated: '2024-07-01', lastPriceUpdate: '2024-07-01',
      priceHistory: [{date: '2024-01-01', price: 245000}, {date: '2024-07-01', price: 250000}]
    },
    {
      id: '5', name: 'Global Growth Fund', category: 'mutualfund', tickerSymbol: 'GGF001', quantity: 100, purchasePrice: 50,
      currentPrice: 55, previousClosePrice: 54.5, lastUpdated: '2024-07-25', lastPriceUpdate: '2024-07-29',
      priceHistory: initialPriceHistory.map(p => ({...p, price: p.price * 0.55}))
    }
  ]);

  const addAsset = useCallback((newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>) => {
    const fullNewAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
      lastPriceUpdate: newAssetData.currentPrice !== undefined ? new Date().toISOString().split('T')[0] : undefined,
      priceHistory: newAssetData.category !== 'bank' && newAssetData.category !== 'property' ? [...initialPriceHistory] : [{date: new Date().toISOString().split('T')[0], price: newAssetData.currentPrice || 0}],
    };
    setAssets((prevAssets) => [...prevAssets, fullNewAsset]);
  }, []);

  const updateAsset = useCallback((updatedAssetData: Omit<Asset, 'lastUpdated' | 'lastPriceUpdate'> & { id: string }) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.id === updatedAssetData.id
          ? { 
              ...a, // keep existing priceHistory and lastPriceUpdate unless new currentPrice is provided
              ...updatedAssetData, 
              lastUpdated: new Date().toISOString().split('T')[0],
              lastPriceUpdate: updatedAssetData.currentPrice !== undefined && updatedAssetData.currentPrice !== a.currentPrice ? new Date().toISOString().split('T')[0] : a.lastPriceUpdate,
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
              priceHistory: priceData.priceHistory || asset.priceHistory // Optionally update history
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
