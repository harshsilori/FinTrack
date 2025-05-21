
'use server'; // Or remove if only used client-side with fetch directly

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[]; // Simplified history for the chart
  // In a real scenario, you might get more data like 52-week high/low, etc.
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
 */
export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string
): Promise<PriceFetchResult> {
  console.log(`Simulating price fetch for ${category} - ${tickerSymbol || 'N/A'}`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 750));

  let basePrice = 100;
  let historyKey = 'default';

  switch (category) {
    case 'stock':
      basePrice = Math.random() * 400 + 50; // Random stock price between 50 and 450
      historyKey = tickerSymbol?.toLowerCase().includes('tech') ? 'tech' : 'default';
      break;
    case 'crypto':
      basePrice = Math.random() * 10000 + 1000; // Random crypto price between 1000 and 11000
      historyKey = 'crypto';
      break;
    case 'mutualfund':
      basePrice = Math.random() * 100 + 20; // Random MF NAV between 20 and 120
      historyKey = 'mutualfund';
      break;
    case 'bank':
    case 'property':
      // For bank/property, price is usually manually entered or from a different source.
      // This function might not be called, or return a stable value.
      // For simulation, let's assume a slight random fluctuation if fetched.
      const existingValue = Math.random() * 100000 + 5000;
      const newCurrentPrice = existingValue * (1 + (Math.random() - 0.5) * 0.01); // +/- 0.5% change
       return {
        currentPrice: parseFloat(newCurrentPrice.toFixed(2)),
        previousClosePrice: parseFloat(existingValue.toFixed(2)),
        priceHistory: [{date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], price: existingValue}, {date: new Date().toISOString().split('T')[0], price: newCurrentPrice}],
      };
  }

  const currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.1); // +/- 5% fluctuation
  const previousClosePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.05); // +/- 2.5% from current for prev close

  const priceHistory = (mockPriceHistories[historyKey] || mockPriceHistories.default).map(p => ({
      ...p,
      price: parseFloat((p.price * (basePrice / 100) * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)) // Scale and add slight randomness
  }));
  // Ensure the last point in history somewhat matches currentPrice for realism
  if (priceHistory.length > 0) {
      priceHistory[priceHistory.length -1].price = parseFloat(currentPrice.toFixed(2));
  }


  return {
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
    priceHistory: priceHistory,
  };
}
