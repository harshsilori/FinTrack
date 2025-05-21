
'use server'; // Or remove if only used client-side with fetch directly

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[];
}

// These base histories represent price *patterns*, not absolute USD values.
// They will be scaled to the target currency's generated current price.
const mockPriceHistoryPatterns: Record<string, AssetPriceData[]> = {
  default: [ // Suitable for general stocks/funds
    { date: '2024-07-01', price: 100 }, { date: '2024-07-08', price: 102 }, { date: '2024-07-15', price: 101 }, { date: '2024-07-22', price: 105 }, { date: '2024-07-29', price: 108 },
  ],
  tech: [ // Slightly different pattern for "tech" stocks
    { date: '2024-07-01', price: 200 }, { date: '2024-07-08', price: 205 }, { date: '2024-07-15', price: 210 }, { date: '2024-07-22', price: 208 }, { date: '2024-07-29', price: 215 },
  ],
  cryptoGeneral: [ // Pattern for general altcoins
    { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 55 }, { date: '2024-07-15', price: 48 }, { date: '2024-07-22', price: 60 }, { date: '2024-07-29', price: 65 },
  ],
  cryptoMajor: [ // Pattern for BTC/ETH like assets
    { date: '2024-07-01', price: 3000 }, { date: '2024-07-08', price: 3200 }, { date: '2024-07-15', price: 2900 }, { date: '2024-07-22', price: 3300 }, { date: '2024-07-29', price: 3500 },
  ],
   mutualfund: [ // Suitable for mutual funds, similar to default
    { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 51 }, { date: '2024-07-15', price: 50.5 }, { date: '2024-07-22', price: 52 }, { date: '2024-07-29', price: 53 },
  ],
};

export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD'
): Promise<PriceFetchResult> {
  console.log(`Simulating price fetch for ${category} - ${tickerSymbol || 'N/A'} directly in ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 750));

  let currentPriceInTargetCurrency: number;
  let historyPatternKey = 'default';

  // --- Generate currentPriceInTargetCurrency with currency-specific magnitudes ---
  switch (category) {
    case 'stock':
      historyPatternKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      if (currency === 'INR') {
        currentPriceInTargetCurrency = Math.random() * 4500 + 500; // e.g., 500 - 5000 INR
      } else if (currency === 'EUR') {
        currentPriceInTargetCurrency = Math.random() * 450 + 50;   // e.g., 50 - 500 EUR
      } else { // USD or other similar magnitude
        currentPriceInTargetCurrency = Math.random() * 450 + 50;   // e.g., 50 - 500 USD
      }
      break;
    case 'crypto':
      if (tickerSymbol?.toUpperCase() === 'BTC' || tickerSymbol?.toUpperCase() === 'BTCUSD') {
        historyPatternKey = 'cryptoMajor';
        if (currency === 'INR') currentPriceInTargetCurrency = Math.random() * 800000 + 4800000; // 48L - 56L INR
        else if (currency === 'EUR') currentPriceInTargetCurrency = Math.random() * 10000 + 55000; // 55k - 65k EUR
        else currentPriceInTargetCurrency = Math.random() * 10000 + 60000; // 60k - 70k USD
      } else if (tickerSymbol?.toUpperCase() === 'ETH' || tickerSymbol?.toUpperCase() === 'ETHUSD') {
        historyPatternKey = 'cryptoMajor';
        if (currency === 'INR') currentPriceInTargetCurrency = Math.random() * 40000 + 240000;  // 2.4L - 2.8L INR
        else if (currency === 'EUR') currentPriceInTargetCurrency = Math.random() * 500 + 2800;    // 2.8k - 3.3k EUR
        else currentPriceInTargetCurrency = Math.random() * 500 + 3000;    // 3k - 3.5k USD
      } else { // General altcoins
        historyPatternKey = 'cryptoGeneral';
        if (currency === 'INR') currentPriceInTargetCurrency = Math.random() * 400 + 20; // 20 - 420 INR (e.g. Cardano ~60 INR)
        else if (currency === 'EUR') currentPriceInTargetCurrency = Math.random() * 5 + 0.2;     // 0.2 - 5.2 EUR
        else currentPriceInTargetCurrency = Math.random() * 5 + 0.2;     // 0.2 - 5.2 USD
      }
      break;
    case 'mutualfund':
      historyPatternKey = 'mutualfund';
      if (currency === 'INR') {
        currentPriceInTargetCurrency = Math.random() * 800 + 200; // e.g., 200 - 1000 INR for a fund unit
      } else if (currency === 'EUR') {
        currentPriceInTargetCurrency = Math.random() * 100 + 20;  // e.g., 20 - 120 EUR
      } else { // USD or other similar magnitude
        currentPriceInTargetCurrency = Math.random() * 100 + 20;  // e.g., 20 - 120 USD
      }
      break;
    case 'bank':
    case 'property':
      // For bank/property, value is assumed to be manually input in the target currency.
      // We simulate a slight change if "refreshed".
      const existingValue = (Math.random() * 100000 + 5000); // This mock should reflect a typical value
      currentPriceInTargetCurrency = existingValue * (1 + (Math.random() - 0.5) * 0.005); // Very slight change
      const previousCloseForNonTrackable = currentPriceInTargetCurrency * (1 + (Math.random() - 0.5) * 0.01); // slight variation for prev close
       return {
        currentPrice: parseFloat(currentPriceInTargetCurrency.toFixed(2)),
        previousClosePrice: parseFloat(previousCloseForNonTrackable.toFixed(2)),
        priceHistory: [
            {date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], price: parseFloat(existingValue.toFixed(2))},
            {date: new Date().toISOString().split('T')[0], price: parseFloat(currentPriceInTargetCurrency.toFixed(2))}
        ],
      };
    default: // Should not happen
      currentPriceInTargetCurrency = 100; // Fallback
  }

  // Fluctuate the currentPriceInTargetCurrency slightly to get a previousClosePrice
  const previousClosePriceInTargetCurrency = currentPriceInTargetCurrency * (1 + (Math.random() - 0.5) * 0.03); // Fluctuate by +/- 1.5% for previous close

  // Get base history pattern
  let baseHistoryPattern = mockPriceHistoryPatterns[historyPatternKey] || mockPriceHistoryPatterns.default;

  // Scale the history pattern
  const lastBaseHistoryPatternPoint = baseHistoryPattern.length > 0
    ? baseHistoryPattern[baseHistoryPattern.length - 1].price
    : currentPriceInTargetCurrency; // Fallback if history pattern is empty

  const scaleFactor = currentPriceInTargetCurrency / lastBaseHistoryPatternPoint;

  const finalPriceHistory = baseHistoryPattern.map(p => {
    return {
      ...p,
      price: parseFloat((p.price * scaleFactor * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)) // Apply scale and slight random variation
    };
  });

  // Ensure the last point in the history matches the finalCurrentPrice
  if (finalPriceHistory.length > 0) {
      finalPriceHistory[finalPriceHistory.length - 1].price = parseFloat(currentPriceInTargetCurrency.toFixed(2));
  } else {
      finalPriceHistory.push({ date: new Date().toISOString().split('T')[0], price: parseFloat(currentPriceInTargetCurrency.toFixed(2))});
  }

  return {
    currentPrice: parseFloat(currentPriceInTargetCurrency.toFixed(2)),
    previousClosePrice: parseFloat(previousClosePriceInTargetCurrency.toFixed(2)),
    priceHistory: finalPriceHistory,
  };
}
