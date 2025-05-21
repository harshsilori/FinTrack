
'use server'; // Or remove if only used client-side with fetch directly

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[]; 
}

// Keep mockPriceHistories in a base currency (e.g., USD-like magnitudes)
const mockPriceHistories: Record<string, AssetPriceData[]> = {
  default: [ // Suitable for general stocks
    { date: '2024-07-01', price: 100 }, { date: '2024-07-08', price: 102 }, { date: '2024-07-15', price: 101 }, { date: '2024-07-22', price: 105 }, { date: '2024-07-29', price: 108 },
  ],
  tech: [ // Slightly different pattern for "tech" stocks
    { date: '2024-07-01', price: 200 }, { date: '2024-07-08', price: 205 }, { date: '2024-07-15', price: 210 }, { date: '2024-07-22', price: 208 }, { date: '2024-07-29', price: 215 },
  ],
  crypto: [ // Base USD-like values for altcoins (e.g., $0.2 to $5 range) - this history will be scaled
    { date: '2024-07-01', price: 0.50 }, { date: '2024-07-08', price: 0.55 }, { date: '2024-07-15', price: 0.48 }, { date: '2024-07-22', price: 0.60 }, { date: '2024-07-29', price: 0.65 },
  ],
   mutualfund: [ // Suitable for mutual funds
    { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 51 }, { date: '2024-07-15', price: 50.5 }, { date: '2024-07-22', price: 52 }, { date: '2024-07-29', price: 53 },
  ],
};

export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD'
): Promise<PriceFetchResult> {
  console.log(`Simulating price fetch for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 750));

  let baseUsdEquivalentPrice: number;
  let historyKey = 'default';
  
  const currencyMultiplier = currency === 'INR' ? 80 : currency === 'EUR' ? 0.92 : currency === 'GBP' ? 0.79 : currency === 'JPY' ? 157 : currency === 'CAD' ? 1.37 : currency === 'AUD' ? 1.50 : 1; // USD is 1

  switch (category) {
    case 'stock':
      baseUsdEquivalentPrice = Math.random() * 400 + 50; // Base price in USD
      historyKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      break;
    case 'crypto':
      if (tickerSymbol?.toUpperCase() === 'BTC' || tickerSymbol?.toUpperCase() === 'BTCUSD') {
        baseUsdEquivalentPrice = Math.random() * 10000 + 60000; // e.g., $60k - $70k for BTC
      } else if (tickerSymbol?.toUpperCase() === 'ETH' || tickerSymbol?.toUpperCase() === 'ETHUSD') {
        baseUsdEquivalentPrice = Math.random() * 500 + 3000; // e.g., $3k - $3.5k for ETH
      } else {
        baseUsdEquivalentPrice = Math.random() * 5 + 0.20; // $0.20 - $5.20 for other altcoins
      }
      historyKey = 'crypto';
      break;
    case 'mutualfund':
      baseUsdEquivalentPrice = Math.random() * 100 + 20; // Base price in USD
      historyKey = 'mutualfund';
      break;
    case 'bank':
    case 'property':
      // For bank/property, value is assumed to be manually input in the target currency.
      // We simulate a slight change if "refreshed".
      const existingValueInTargetCurrency = (Math.random() * 100000 + 5000); // This mock should reflect a typical value in ANY currency for these assets
      const newCurrentPriceInTargetCurrency = existingValueInTargetCurrency * (1 + (Math.random() - 0.5) * 0.005); // Very slight change
       return {
        currentPrice: parseFloat(newCurrentPriceInTargetCurrency.toFixed(2)),
        previousClosePrice: parseFloat(existingValueInTargetCurrency.toFixed(2)), // Previous could be the same or slightly different
        priceHistory: [
            {date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], price: parseFloat(existingValueInTargetCurrency.toFixed(2))},
            {date: new Date().toISOString().split('T')[0], price: parseFloat(newCurrentPriceInTargetCurrency.toFixed(2))}
        ],
      };
    default: // Should not happen
      baseUsdEquivalentPrice = 100;
  }

  // Fluctuate the USD equivalent price
  const currentUsdEquivalentPrice = baseUsdEquivalentPrice * (1 + (Math.random() - 0.45) * 0.05); // Smaller fluctuation band
  const previousCloseUsdEquivalentPrice = currentUsdEquivalentPrice * (1 + (Math.random() - 0.5) * 0.03); // Smaller fluctuation band

  // Convert final prices to the target currency
  const finalCurrentPrice = currentUsdEquivalentPrice * currencyMultiplier;
  const finalPreviousClosePrice = previousCloseUsdEquivalentPrice * currencyMultiplier;

  // Get base USD history and scale it
  let baseHistoryUsdPrices = mockPriceHistories[historyKey] || mockPriceHistories.default;
  
  const lastBaseHistoryUsdPricePoint = baseHistoryUsdPrices.length > 0 
    ? baseHistoryUsdPrices[baseHistoryUsdPrices.length - 1].price 
    : baseUsdEquivalentPrice; // Fallback to baseUsdEquivalentPrice if history is empty for scaling

  // Scale factor based on current USD equivalent price vs last USD history point
  const scaleFactor = currentUsdEquivalentPrice / lastBaseHistoryUsdPricePoint;

  const priceHistoryInTargetCurrency = baseHistoryUsdPrices.map(p => {
    // p.price is a USD-equivalent value from mockPriceHistories
    const scaledUsdHistoryPoint = p.price * scaleFactor * (1 + (Math.random() - 0.5) * 0.02); // Apply scale and slight random variation to USD value
    return {
      ...p,
      price: parseFloat((scaledUsdHistoryPoint * currencyMultiplier).toFixed(2)) // Convert to target currency
    };
  });
  
  // Ensure the last point in the history matches the finalCurrentPrice (in target currency)
  if (priceHistoryInTargetCurrency.length > 0) {
      priceHistoryInTargetCurrency[priceHistoryInTargetCurrency.length - 1].price = parseFloat(finalCurrentPrice.toFixed(2));
  } else { // If somehow base history was empty, create a single point for current price
      priceHistoryInTargetCurrency.push({ date: new Date().toISOString().split('T')[0], price: parseFloat(finalCurrentPrice.toFixed(2))});
  }

  return {
    currentPrice: parseFloat(finalCurrentPrice.toFixed(2)),
    previousClosePrice: parseFloat(finalPreviousClosePrice.toFixed(2)),
    priceHistory: priceHistoryInTargetCurrency,
  };
}
