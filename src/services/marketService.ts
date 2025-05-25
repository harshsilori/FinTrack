
'use server';

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[];
}

// Base patterns for price history - these are relative patterns
const mockPriceHistoryPatterns: Record<string, AssetPriceData[]> = {
  default: [
    { date: '2024-07-01', price: 100 }, { date: '2024-07-08', price: 102 }, { date: '2024-07-15', price: 101 }, { date: '2024-07-22', price: 105 }, { date: '2024-07-29', price: 108 },
  ],
  tech: [
    { date: '2024-07-01', price: 200 }, { date: '2024-07-08', price: 205 }, { date: '2024-07-15', price: 210 }, { date: '2024-07-22', price: 208 }, { date: '2024-07-29', price: 215 },
  ],
  cryptoGeneral: [ // For altcoins other than BTC/ETH
    { date: '2024-07-01', price: 0.80 }, { date: '2024-07-08', price: 0.85 }, { date: '2024-07-15', price: 0.78 }, { date: '2024-07-22', price: 0.90 }, { date: '2024-07-29', price: 0.95 },
  ],
  cryptoMajorBTC: [
    { date: '2024-07-01', price: 60000 }, { date: '2024-07-08', price: 62000 }, { date: '2024-07-15', price: 59000 }, { date: '2024-07-22', price: 63000 }, { date: '2024-07-29', price: 65000 },
  ],
  cryptoMajorETH: [
    { date: '2024-07-01', price: 3000 }, { date: '2024-07-08', price: 3200 }, { date: '2024-07-15', price: 2900 }, { date: '2024-07-22', price: 3300 }, { date: '2024-07-29', price: 3500 },
  ],
   cryptoADA: [ // Specific pattern for Cardano
    { date: '2024-07-01', price: 0.55 }, { date: '2024-07-08', price: 0.62 }, { date: '2024-07-15', price: 0.58 }, { date: '2024-07-22', price: 0.66 }, { date: '2024-07-29', price: 0.70 },
  ],
  mutualfund: [
    { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 51 }, { date: '2024-07-15', price: 50.5 }, { date: '2024-07-22', price: 52 }, { date: '2024-07-29', price: 53 },
  ],
};

function getDeterministicFactor(str: string | undefined): number {
  if (!str || str.length === 0) return 0.5; // Default factor if no string
  let sum = 0;
  for (let i = 0; i < Math.min(str.length, 10); i++) { // Use more characters for better distribution
    sum += str.charCodeAt(i);
  }
  // Simple hash to get a 0-1 factor, slightly more distributed
  return ((sum * 13) % 101) / 100; 
}


export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD'
): Promise<PriceFetchResult> {
  console.log(`Fetching price for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);

  // --- START REAL API INTEGRATION SECTION ---
  if (category === 'stock' && tickerSymbol) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (apiKey) {
      console.log(`Attempting to fetch stock data for ${tickerSymbol} using Alpha Vantage API.`);
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${tickerSymbol}&apikey=${apiKey}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Alpha Vantage API request failed for ${tickerSymbol}: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Alpha Vantage API request failed: ${response.statusText}`);
        }
        const data = await response.json();

        if (data['Global Quote'] && data['Global Quote']['05. price']) {
          const currentPrice = parseFloat(data['Global Quote']['05. price']);
          const previousClosePrice = parseFloat(data['Global Quote']['08. previous close']);

          const historyPattern = mockPriceHistoryPatterns.default; 
          const lastPatternPoint = historyPattern.length > 0 ? historyPattern[historyPattern.length - 1].price : currentPrice;
          const scaleFactor = lastPatternPoint !== 0 ? currentPrice / lastPatternPoint : 1;
          
          const priceHistory = historyPattern.map(p => ({
            ...p,
            price: parseFloat((p.price * scaleFactor).toFixed(2))
          }));
          if (priceHistory.length > 0) {
            priceHistory[priceHistory.length - 1].price = currentPrice;
          }

           if (currency !== 'USD') {
             console.warn(`Alpha Vantage provides USD prices. Currency conversion to ${currency} is not yet implemented for real data. Displaying as USD value with ${currency} symbol.`);
           }

          return {
            currentPrice: parseFloat(currentPrice.toFixed(2)),
            previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
            priceHistory: priceHistory,
          };
        } else if (data['Note']) {
           console.warn(`Alpha Vantage API call limit likely reached for ${tickerSymbol}: ${data['Note']}`);
        } else {
          console.warn(`Price data not found for ${tickerSymbol} in Alpha Vantage response. Raw response:`, JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error(`Error fetching from Alpha Vantage for ${tickerSymbol}:`, error);
      }
    } else {
      console.log("Alpha Vantage API key not found. Falling back to mock stock data.");
    }
  }
  // --- END REAL API INTEGRATION SECTION ---


  // --- MOCK DATA GENERATION (Fallback or if APIs not implemented/failed) ---
  console.log(`Using MOCK data for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); // Simulate network delay

  let baseTargetPriceInCurrency: number;
  let historyPatternKey = 'default';
  const deterministicFactor = getDeterministicFactor(tickerSymbol); // Use ticker for more stable base

  switch (category) {
    case 'stock':
      historyPatternKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      if (currency === 'INR') baseTargetPriceInCurrency = (1000 + deterministicFactor * (15000 - 1000));
      else if (currency === 'EUR') baseTargetPriceInCurrency = (10 + deterministicFactor * (500 - 10));
      else baseTargetPriceInCurrency = (10 + deterministicFactor * (500 - 10)); // USD or other
      break;
    case 'crypto':
      const upperTicker = tickerSymbol?.toUpperCase();
      if (upperTicker === 'BTC' || upperTicker === 'BTCUSD') {
        historyPatternKey = 'cryptoMajorBTC';
        if (currency === 'INR') baseTargetPriceInCurrency = (5000000 + deterministicFactor * (1000000)); // 5M to 6M INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (55000 + deterministicFactor * (10000)); // 55k to 65k EUR
        else baseTargetPriceInCurrency = (60000 + deterministicFactor * (10000)); // 60k to 70k USD
      } else if (upperTicker === 'ETH' || upperTicker === 'ETHUSD') {
        historyPatternKey = 'cryptoMajorETH';
        if (currency === 'INR') baseTargetPriceInCurrency = (240000 + deterministicFactor * (60000));
        else if (currency === 'EUR') baseTargetPriceInCurrency = (2800 + deterministicFactor * (700));
        else baseTargetPriceInCurrency = (3000 + deterministicFactor * (500));
      } else if (upperTicker === 'ADA' || upperTicker === 'ADAUSD') {
        historyPatternKey = 'cryptoADA';
        if (currency === 'INR') baseTargetPriceInCurrency = (50 + deterministicFactor * (30)); // 50 to 80 INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (0.5 + deterministicFactor * (0.3)); // 0.5 to 0.8 EUR
        else baseTargetPriceInCurrency = (0.6 + deterministicFactor * (0.4)); // 0.6 to 1.0 USD
      } else { // General altcoins
        historyPatternKey = 'cryptoGeneral';
        if (currency === 'INR') baseTargetPriceInCurrency = (15 + deterministicFactor * (185 - 15)); // 15 to 200 INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (0.15 + deterministicFactor * (2.5 - 0.15));
        else baseTargetPriceInCurrency = (0.2 + deterministicFactor * (3 - 0.2));
      }
      break;
    case 'mutualfund':
      historyPatternKey = 'mutualfund';
      if (currency === 'INR') baseTargetPriceInCurrency = (200 + deterministicFactor * (800 - 200));
      else if (currency === 'EUR') baseTargetPriceInCurrency = (20 + deterministicFactor * (100 - 20));
      else baseTargetPriceInCurrency = (20 + deterministicFactor * (100 - 20));
      break;
    case 'bank':
    case 'property':
      // For bank/property, value is usually manual or statement-based, not "fetched" like market assets.
      // The 'currentPrice' field in AssetContext stores their value.
      // This function is for market-trackable assets. If called for bank/property, return a stable mock.
      const stableValue = (currency === 'INR' ? 100000 : currency === 'EUR' ? 10000 : 12000) * (1 + deterministicFactor * 0.1);
      return {
        currentPrice: parseFloat(stableValue.toFixed(2)),
        previousClosePrice: parseFloat((stableValue * 0.998).toFixed(2)), // Minimal change
        priceHistory: [{date: new Date().toISOString().split('T')[0], price: parseFloat(stableValue.toFixed(2))}]
      };
    default:
      baseTargetPriceInCurrency = 100; // Generic fallback
  }

  // Apply a small random fluctuation to the stable base price for current price
  const currentPriceInTargetCurrency = baseTargetPriceInCurrency * (1 + (Math.random() - 0.5) * 0.04); // Fluctuate by +/- 2% from stable base
  // Previous close is a small fluctuation from current
  const previousClosePriceInTargetCurrency = currentPriceInTargetCurrency * (1 + (Math.random() - 0.5) * 0.03); // Fluctuate by +/- 1.5% from current

  let baseHistoryPattern = mockPriceHistoryPatterns[historyPatternKey] || mockPriceHistoryPatterns.default;
  const lastPatternPointValue = baseHistoryPattern.length > 0 ? baseHistoryPattern[baseHistoryPattern.length - 1].price : currentPriceInTargetCurrency;
  const scaleFactor = lastPatternPointValue !== 0 ? currentPriceInTargetCurrency / lastPatternPointValue : 1;

  const finalPriceHistory = baseHistoryPattern.map(p => ({
    ...p,
    price: parseFloat((p.price * scaleFactor).toFixed(2))
  }));
  
  if (finalPriceHistory.length > 0) {
      finalPriceHistory[finalPriceHistory.length - 1].price = parseFloat(currentPriceInTargetCurrency.toFixed(2));
  } else { // Ensure history has at least one point
      finalPriceHistory.push({ date: new Date().toISOString().split('T')[0], price: parseFloat(currentPriceInTargetCurrency.toFixed(2))});
  }

  return {
    currentPrice: parseFloat(currentPriceInTargetCurrency.toFixed(2)),
    previousClosePrice: parseFloat(previousClosePriceInTargetCurrency.toFixed(2)),
    priceHistory: finalPriceHistory,
  };
}

