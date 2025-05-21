
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
    { date: '2024-07-01', price: 0.80 }, { date: '2024-07-08', price: 0.85 }, { date: '2024-07-15', price: 0.78 }, { date: '2024-07-22', price: 0.90 }, { date: '2024-07-29', price: 0.95 },
  ],
  cryptoMajorBTC: [ // Pattern for BTC
    { date: '2024-07-01', price: 60000 }, { date: '2024-07-08', price: 62000 }, { date: '2024-07-15', price: 59000 }, { date: '2024-07-22', price: 63000 }, { date: '2024-07-29', price: 65000 },
  ],
  cryptoMajorETH: [ // Pattern for ETH
    { date: '2024-07-01', price: 3000 }, { date: '2024-07-08', price: 3200 }, { date: '2024-07-15', price: 2900 }, { date: '2024-07-22', price: 3300 }, { date: '2024-07-29', price: 3500 },
  ],
   cryptoADA: [ // Specific pattern for Cardano (ADA)
    { date: '2024-07-01', price: 60 }, { date: '2024-07-08', price: 62 }, { date: '2024-07-15', price: 58 }, { date: '2024-07-22', price: 66 }, { date: '2024-07-29', price: 70 },
  ],
   mutualfund: [ // Suitable for mutual funds
    { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 51 }, { date: '2024-07-15', price: 50.5 }, { date: '2024-07-22', price: 52 }, { date: '2024-07-29', price: 53 },
  ],
};

// Helper function to create a somewhat deterministic factor (0 to 1) from a string
function getDeterministicFactor(str: string | undefined): number {
  if (!str || str.length === 0) return 0.5; // Default if no string or empty string
  let sum = 0;
  for (let i = 0; i < Math.min(str.length, 10); i++) { // Use first few chars for stability
    sum += str.charCodeAt(i);
  }
  return (sum % 101) / 100; // Returns a value between 0.00 and 1.00
}


export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD'
): Promise<PriceFetchResult> {
  console.log(`Simulating price fetch for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 750)); // Simulate network delay

  let baseTargetPriceInCurrency: number;
  let historyPatternKey = 'default';
  const deterministicFactor = getDeterministicFactor(tickerSymbol); // Factor based on ticker

  // --- Generate baseTargetPriceInCurrency directly in the target currency ---
  switch (category) {
    case 'stock':
      historyPatternKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      if (currency === 'INR') {
        baseTargetPriceInCurrency = 500 + deterministicFactor * (4500 - 500); // Range 500 - 4500 INR
      } else if (currency === 'EUR') {
        baseTargetPriceInCurrency = 50 + deterministicFactor * (450 - 50);   // Range 50 - 450 EUR
      } else { // USD or other similar magnitude
        baseTargetPriceInCurrency = 50 + deterministicFactor * (450 - 50);   // Range 50 - 450 USD
      }
      break;
    case 'crypto':
      const upperTicker = tickerSymbol?.toUpperCase();
      if (upperTicker === 'BTC' || upperTicker === 'BTCUSD') {
        historyPatternKey = 'cryptoMajorBTC';
        if (currency === 'INR') baseTargetPriceInCurrency = 5000000 + deterministicFactor * (1000000); // 5.0M - 6.0M INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = 55000 + deterministicFactor * (10000); // 55k - 65k EUR
        else baseTargetPriceInCurrency = 60000 + deterministicFactor * (10000); // 60k - 70k USD
      } else if (upperTicker === 'ETH' || upperTicker === 'ETHUSD') {
        historyPatternKey = 'cryptoMajorETH';
        if (currency === 'INR') baseTargetPriceInCurrency = 240000 + deterministicFactor * (40000);  // 240k - 280k INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = 2800 + deterministicFactor * (500);    // 2.8k - 3.3k EUR
        else baseTargetPriceInCurrency = 3000 + deterministicFactor * (500);    // 3k - 3.5k USD
      } else if (upperTicker === 'ADA') { // Specific case for Cardano (ADA)
        historyPatternKey = 'cryptoADA';
        if (currency === 'INR') baseTargetPriceInCurrency = 50 + deterministicFactor * (30); // Range 50 - 80 INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = 0.5 + deterministicFactor * (0.3); // Range 0.5 - 0.8 EUR
        else baseTargetPriceInCurrency = 0.6 + deterministicFactor * (0.4); // Range 0.6 - 1.0 USD
      } else { // General altcoins
        historyPatternKey = 'cryptoGeneral';
        if (currency === 'INR') baseTargetPriceInCurrency = 15 + deterministicFactor * (185 - 15);     // e.g. 15 - 185 INR (updated range from 200)
        else if (currency === 'EUR') baseTargetPriceInCurrency = 0.15 + deterministicFactor * (2.5 - 0.15); // e.g. 0.15 - 2.5 EUR
        else baseTargetPriceInCurrency = 0.2 + deterministicFactor * (3 - 0.2);     // e.g. 0.2 - 3 USD
      }
      break;
    case 'mutualfund':
      historyPatternKey = 'mutualfund';
      if (currency === 'INR') {
        baseTargetPriceInCurrency = 200 + deterministicFactor * (800 - 200); // e.g., 200 - 800 INR
      } else if (currency === 'EUR') {
        baseTargetPriceInCurrency = 20 + deterministicFactor * (100 - 20);  // e.g., 20 - 100 EUR
      } else { // USD or other similar magnitude
        baseTargetPriceInCurrency = 20 + deterministicFactor * (100 - 20);  // e.g., 20 - 100 USD
      }
      break;
    case 'bank':
    case 'property':
      // For bank/property, the 'currentPrice' in AssetContext is the total value.
      // The fetch operation can simulate a slight change if desired, or just return existing.
      // For simplicity, let's assume these don't auto-fetch volatile prices this way.
      // Their value update is more manual or via statement uploads in a real app.
      // We'll return a slightly fluctuated version of a hypothetical "stable" value for mock purposes.
      const existingValueBase = (currency === 'INR' ? 500000 : currency === 'EUR' ? 75000 : 100000);
      const stableBase = existingValueBase + deterministicFactor * (existingValueBase * 0.5); // More varied base
      
      const currentPriceForNonTrackable = stableBase * (1 + (Math.random() - 0.5) * 0.005); // Very small daily fluctuation (0.5%)
      const previousCloseForNonTrackable = currentPriceForNonTrackable * (1 + (Math.random() - 0.5) * 0.002); // Even smaller change for prev close
       return {
        currentPrice: parseFloat(currentPriceForNonTrackable.toFixed(2)),
        previousClosePrice: parseFloat(previousCloseForNonTrackable.toFixed(2)),
        priceHistory: [ // Simple history for bank/property
            {date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], price: parseFloat((stableBase * 0.99).toFixed(2))}, 
            {date: new Date().toISOString().split('T')[0], price: parseFloat(currentPriceForNonTrackable.toFixed(2))}
        ],
      };
    default: // Should not happen if categories are well-defined
      baseTargetPriceInCurrency = 100; // Fallback default
  }

  // Fluctuate the currentPrice slightly around the baseTargetPriceInCurrency for trackable assets
  const currentPriceInTargetCurrency = baseTargetPriceInCurrency * (1 + (Math.random() - 0.5) * 0.06); // Fluctuate by +/- 3%

  // previousClosePrice is a small fluctuation from the currentPrice
  const previousClosePriceInTargetCurrency = currentPriceInTargetCurrency * (1 + (Math.random() - 0.5) * 0.04); // Fluctuate by +/- 2% from current

  // --- Price History Scaling ---
  let baseHistoryPattern = mockPriceHistoryPatterns[historyPatternKey] || mockPriceHistoryPatterns.default;
  // The last point in the pattern should correspond to a "base" from which current price is derived.
  // To scale correctly, we find the ratio of the generated current price (in target currency)
  // to the last point of the selected history pattern (which is just a relative pattern).
  const lastPatternPointValue = baseHistoryPattern.length > 0 ? baseHistoryPattern[baseHistoryPattern.length - 1].price : currentPriceInTargetCurrency;
  
  // Scale factor: how much to multiply each point in the pattern by to make its end align with our generated current price.
  const scaleFactor = lastPatternPointValue !== 0 ? currentPriceInTargetCurrency / lastPatternPointValue : 1;

  const finalPriceHistory = baseHistoryPattern.map(p => {
    // Optional: Add a tiny bit of extra jitter to each historical point if desired
    // const jitter = 1 + (Math.random() - 0.5) * 0.02; // +/- 1% jitter
    return {
      ...p,
      price: parseFloat((p.price * scaleFactor /* * jitter */).toFixed(2)) // Apply scale factor
    };
  });

  // Ensure the very last point in the history exactly matches the fetched current price
  if (finalPriceHistory.length > 0) {
      finalPriceHistory[finalPriceHistory.length - 1].price = parseFloat(currentPriceInTargetCurrency.toFixed(2));
  } else { // If no history pattern, create a single point
      finalPriceHistory.push({ date: new Date().toISOString().split('T')[0], price: parseFloat(currentPriceInTargetCurrency.toFixed(2))});
  }

  return {
    currentPrice: parseFloat(currentPriceInTargetCurrency.toFixed(2)),
    previousClosePrice: parseFloat(previousClosePriceInTargetCurrency.toFixed(2)),
    priceHistory: finalPriceHistory,
  };
}

    