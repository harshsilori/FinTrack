
'use server';

import type { AssetCategory } from '@/contexts/AssetContext';

// Note: Price fetching functionality has been removed for manual price entry.
// This service is currently not actively used for fetching market data.

// export interface AssetPriceData { // No longer used for price history
//   date: string;
//   price: number;
// }

// export interface PriceFetchResult { // No longer used
//   currentPrice: number;
//   previousClosePrice: number;
//   priceHistory: AssetPriceData[];
//   priceFetchError?: string;
// }

// export interface TickerSuggestion { // No longer used
//   symbol: string;
//   name: string;
// }

// export async function fetchAssetPrice( // This function is no longer called by the UI
//   category: AssetCategory,
//   tickerSymbol?: string,
//   currency: string = 'USD'
// ): Promise<PriceFetchResult | null > { // Adjusted to potentially return null or a simplified structure
//   console.warn(`[MarketService] fetchAssetPrice called for ${tickerSymbol}, but app is in manual price entry mode. No data fetched.`);
//   // In a manual system, this function wouldn't typically be called for fetching.
//   // If it were, it might return the asset's stored currentPrice if available, or null.
//   return null; // Or some default if needed by any vestigial calls
// }


// export async function searchTickerSymbols(keywords: string): Promise<TickerSuggestion[]> { // No longer used
//   console.warn(`[MarketService] searchTickerSymbols called for ${keywords}, but app is in manual price entry mode. No search performed.`);
//   return [];
// }

// Placeholder to keep the file if other non-fetching market utilities might be added later.
// For now, it serves as an indicator that fetching services were previously here.
export {};
