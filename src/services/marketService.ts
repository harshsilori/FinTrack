
'use server'; // Or remove if only used client-side with fetch directly

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[]; 
}

const mockPriceHistories: Record<string, AssetPriceData[]> = {
  default: [
    { date: '2024-07-01', price: 100 },
    { date: '2024-07-08', price: 102 },
    { date: '2024-07-15', price: 101 },
    { date: '2024-07-22', price: 105 },
    { date: '2024-07-29', price: 108 },
  ],
  tech: [
    { date: '2024-07-01', price: 200 },
    { date: '2024-07-08', price: 205 },
    { date: '2024-07-15', price: 210 },
    { date: '2024-07-22', price: 208 },
    { date: '2024-07-29', price: 215 },
  ],
  crypto: [
    { date: '2024-07-01', price: 5000 },
    { date: '2024-07-08', price: 5200 },
    { date: '2024-07-15', price: 4800 },
    { date: '2024-07-22', price: 5300 },
    { date: '2024-07-29', price: 5500 },
  ],
   mutualfund: [
    { date: '2024-07-01', price: 50 },
    { date: '2024-07-08', price: 51 },
    { date: '2024-07-15', price: 50.5 },
    { date: '2024-07-22', price: 52 },
    { date: '2024-07-29', price: 53 },
  ],
};

/**
 * MOCK FUNCTION: Simulates fetching price data for an asset.
 * In a real application, this would make API calls to Yahoo Finance, CoinGecko, etc.
 * based on the asset category and ticker symbol.
 * The currency parameter is added but not deeply integrated into mock generation yet,
 * prices are mostly USD-centric in mocks.
 */
export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD' // Added currency, defaults to USD for mock
): Promise<PriceFetchResult> {
  console.log(`Simulating price fetch for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 750));

  let basePrice = 100; // Base for USD-like values
  let historyKey = 'default';

  // Adjust basePrice slightly if non-USD, for more varied mock data
  // This is a very rough simulation and not real conversion
  if (currency === 'INR') basePrice *= 80;
  else if (currency === 'EUR') basePrice *= 0.9;
  else if (currency === 'JPY') basePrice *= 150;


  switch (category) {
    case 'stock':
      basePrice = (Math.random() * 400 + 50) * (currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'JPY' ? 150 : 1);
      historyKey = tickerSymbol?.toLowerCase().includes('tech') ? 'tech' : 'default';
      break;
    case 'crypto':
      basePrice = (Math.random() * 10000 + 1000) * (currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'JPY' ? 150 : 1);
      historyKey = 'crypto';
      break;
    case 'mutualfund':
      basePrice = (Math.random() * 100 + 20) * (currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'JPY' ? 150 : 1);
      historyKey = 'mutualfund';
      break;
    case 'bank':
    case 'property':
      const existingValue = (Math.random() * 100000 + 5000) * (currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'JPY' ? 150 : 1);
      const newCurrentPrice = existingValue * (1 + (Math.random() - 0.5) * 0.01); 
       return {
        currentPrice: parseFloat(newCurrentPrice.toFixed(2)),
        previousClosePrice: parseFloat(existingValue.toFixed(2)),
        priceHistory: [{date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], price: parseFloat(existingValue.toFixed(2))}, {date: new Date().toISOString().split('T')[0], price: parseFloat(newCurrentPrice.toFixed(2))}],
      };
  }

  const currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.1); 
  const previousClosePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.05); 

  let baseHistoryPrices = mockPriceHistories[historyKey] || mockPriceHistories.default;
  // If basePrice was significantly scaled (e.g. for INR/JPY), scale history too.
  const scaleFactor = basePrice / (mockPriceHistories[historyKey]?.[0]?.price || 100);


  const priceHistory = baseHistoryPrices.map(p => ({
      ...p,
      price: parseFloat((p.price * scaleFactor * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2))
  }));
  
  if (priceHistory.length > 0) {
      priceHistory[priceHistory.length -1].price = parseFloat(currentPrice.toFixed(2));
  }


  return {
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
    priceHistory: priceHistory,
  };
}

    