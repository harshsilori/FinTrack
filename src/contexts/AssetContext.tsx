
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
  currency: string; // e.g., "USD", "EUR", "INR"
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
      id: '3', name: 'Digital Token X', category: 'crypto', currency: 'USD', tickerSymbol: 'DTX', quantity: 5, purchasePrice: 3000, 
      currentPrice: 3500, previousClosePrice: 3450, lastUpdated: '2024-07-27', lastPriceUpdate: '2024-07-29',
      priceHistory: mockCryptoPriceHistory
    },
    { 
      id: '4', name: 'Investment Property', category: 'property', currency: 'EUR', quantity: 1, 
      currentPrice: 320000, lastUpdated: '2024-07-01', lastPriceUpdate: '2024-07-01',
      priceHistory: [{date: '2024-01-01', price: 315000}, {date: '2024-07-01', price: 320000}]
    },
    {
      id: '5', name: 'Diversified Index Fund', category: 'mutualfund', currency: 'INR', tickerSymbol: 'DIF99', quantity: 200, purchasePrice: 6000, // Assuming INR purchase price
      currentPrice: 6240, previousClosePrice: 6200, lastUpdated: '2024-07-25', lastPriceUpdate: '2024-07-29', // Assuming INR current price
      priceHistory: mockMutualFundPriceHistory.map(p => ({ ...p, price: p.price * 80 })) // Scale example for INR
    }
  ]);

  const addAsset = useCallback((newAssetData: Omit<Asset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'>) => {
    const isTrackable = newAssetData.category === 'stock' || newAssetData.category === 'crypto' || newAssetData.category === 'mutualfund';
    
    let historyForNewAsset: AssetPriceData[] = [];
    const basePriceForHistory = isTrackable ? (newAssetData.purchasePrice || 0) : (newAssetData.currentPrice || 0);

    if (isTrackable) {
        // Simplified mock history generation, doesn't perfectly scale but gives varied data
        let baseHistory: AssetPriceData[];
        if (newAssetData.category === 'stock') baseHistory = mockStockPriceHistory;
        else if (newAssetData.category === 'crypto') baseHistory = mockCryptoPriceHistory;
        else baseHistory = mockMutualFundPriceHistory; // for mutualfund

        const firstHistoryPrice = baseHistory.length > 0 ? baseHistory[0].price : 1; // Avoid division by zero
        historyForNewAsset = baseHistory.map(p => ({
            ...p, 
            price: parseFloat(((p.price / firstHistoryPrice) * basePriceForHistory).toFixed(2))
        }));
         // Ensure the last point in history is the purchase price for new trackable assets
        if (historyForNewAsset.length > 0) {
            historyForNewAsset[historyForNewAsset.length - 1].price = basePriceForHistory;
        }

    } else { // Bank or Property
        historyForNewAsset = [{date: new Date().toISOString().split('T')[0], price: basePriceForHistory}];
    }


    const fullNewAsset: Asset = {
      ...newAssetData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
      currentPrice: isTrackable ? newAssetData.purchasePrice : newAssetData.currentPrice, 
      previousClosePrice: isTrackable ? newAssetData.purchasePrice : undefined, 
      lastPriceUpdate: newAssetData.currentPrice !== undefined || newAssetData.purchasePrice !== undefined ? new Date().toISOString().split('T')[0] : undefined,
      priceHistory: historyForNewAsset,
    };
    setAssets((prevAssets) => [...prevAssets, fullNewAsset]);
  }, []);

  const updateAsset = useCallback((updatedAssetData: Partial<Omit<Asset, 'lastUpdated' | 'lastPriceUpdate'>> & { id: string }) => {
    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.id === updatedAssetData.id
          ? { 
              ...a, 
              ...updatedAssetData, 
              lastUpdated: new Date().toISOString().split('T')[0],
              // Only update lastPriceUpdate if currentPrice is explicitly part of updatedAssetData (for bank/property) and changed
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
              priceHistory: priceData.priceHistory || asset.priceHistory // Keep existing history if new one isn't provided
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

    