
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
  crypto: [ // These are USD-like base values for history scaling
    { date: '2024-07-01', price: 0.50 },
    { date: '2024-07-08', price: 0.55 },
    { date: '2024-07-15', price: 0.48 },
    { date: '2024-07-22', price: 0.60 },
    { date: '2024-07-29', price: 0.65 },
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

  let basePriceForCalc = 100; // Base for USD-like values
  let historyKey = 'default';
  
  // Currency multiplier relative to USD (1)
  const currencyMultiplier = currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : currency === 'JPY' ? 150 : 1;

  switch (category) {
    case 'stock':
      // Generates a USD-equivalent price between $50 and $450
      basePriceForCalc = (Math.random() * 400 + 50) * currencyMultiplier;
      historyKey = tickerSymbol?.toLowerCase().includes('tech') ? 'tech' : 'default';
      break;
    case 'crypto':
      // Generates a USD-equivalent price between $0.20 and $5.20 for altcoins
      // For BTC like values, a different ticker might yield different range in a real system
      basePriceForCalc = (Math.random() * 5 + 0.2) * currencyMultiplier;
      historyKey = 'crypto'; // Use a history that reflects smaller price changes
      break;
    case 'mutualfund':
      // Generates a USD-equivalent price between $20 and $120
      basePriceForCalc = (Math.random() * 100 + 20) * currencyMultiplier;
      historyKey = 'mutualfund';
      break;
    case 'bank':
    case 'property':
      // For bank/property, value is directly input, but we can simulate slight changes if refreshed
      const existingValue = (Math.random() * 100000 + 5000) * currencyMultiplier;
      const newCurrentPrice = existingValue * (1 + (Math.random() - 0.5) * 0.01); 
       return {
        currentPrice: parseFloat(newCurrentPrice.toFixed(2)),
        previousClosePrice: parseFloat(existingValue.toFixed(2)),
        priceHistory: [{date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], price: parseFloat(existingValue.toFixed(2))}, {date: new Date().toISOString().split('T')[0], price: parseFloat(newCurrentPrice.toFixed(2))}],
      };
  }

  const currentPrice = basePriceForCalc * (1 + (Math.random() - 0.45) * 0.1); // Fluctuate current price around the calculated base
  const previousClosePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.05); // Fluctuate previous close around current

  let baseHistoryPrices = mockPriceHistories[historyKey] || mockPriceHistories.default;
  
  // The mockPriceHistories are in USD-like magnitudes. Scale them to the currentPrice's magnitude.
  const firstHistoryPricePoint = baseHistoryPrices[0]?.price || (historyKey === 'crypto' ? 0.5 : 100); // Default base if history is empty
  const scaleFactor = currentPrice / (firstHistoryPricePoint * currencyMultiplier); // Scale based on target currency current price vs USD history

  const priceHistory = baseHistoryPrices.map(p => ({
      ...p,
      // Apply currencyMultiplier to the original USD-like history price, then scale factor, then slight random variation
      price: parseFloat(((p.price * currencyMultiplier) * scaleFactor * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2))
  }));
  
  // Ensure the last point in the history matches the just-fetched current price
  if (priceHistory.length > 0) {
      priceHistory[priceHistory.length -1].price = parseFloat(currentPrice.toFixed(2));
  }


  return {
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
    priceHistory: priceHistory,
  };
}
