
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
  cryptoGeneral: [
    { date: '2024-07-01', price: 0.80 }, { date: '2024-07-08', price: 0.85 }, { date: '2024-07-15', price: 0.78 }, { date: '2024-07-22', price: 0.90 }, { date: '2024-07-29', price: 0.95 },
  ],
  cryptoMajorBTC: [
    { date: '2024-07-01', price: 60000 }, { date: '2024-07-08', price: 62000 }, { date: '2024-07-15', price: 59000 }, { date: '2024-07-22', price: 63000 }, { date: '2024-07-29', price: 65000 },
  ],
  cryptoMajorETH: [
    { date: '2024-07-01', price: 3000 }, { date: '2024-07-08', price: 3200 }, { date: '2024-07-15', price: 2900 }, { date: '2024-07-22', price: 3300 }, { date: '2024-07-29', price: 3500 },
  ],
  cryptoADA: [
    { date: '2024-07-01', price: 0.55 }, { date: '2024-07-08', price: 0.62 }, { date: '2024-07-15', price: 0.58 }, { date: '2024-07-22', price: 0.66 }, { date: '2024-07-29', price: 0.70 },
  ],
  mutualfund: [
    { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 51 }, { date: '2024-07-15', price: 50.5 }, { date: '2024-07-22', price: 52 }, { date: '2024-07-29', price: 53 },
  ],
};

function getDeterministicFactor(str: string | undefined): number {
  if (!str || str.length === 0) return 0.5;
  let sum = 0;
  for (let i = 0; i < Math.min(str.length, 10); i++) {
    sum += str.charCodeAt(i);
  }
  return (sum % 101) / 100;
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

          // For priceHistory, Alpha Vantage's GLOBAL_QUOTE doesn't provide it.
          // You'd typically use TIME_SERIES_DAILY_ADJUSTED or similar for history.
          // For now, we'll generate a simple mock history based on the current price.
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


          // Alpha Vantage prices are typically in USD.
          // If target currency is not USD, you'd need an exchange rate API here.
          // For simplicity, this example assumes prices are directly usable or currency matches.
          // TODO: Implement currency conversion if fetched currency (USD) !== target currency.
           if (currency !== 'USD') {
             console.warn(`Alpha Vantage provides USD prices. Currency conversion to ${currency} is not yet implemented. Displaying as USD.`);
           }


          return {
            currentPrice: parseFloat(currentPrice.toFixed(2)),
            previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
            priceHistory: priceHistory,
          };
        } else if (data['Note']) {
           console.warn(`Alpha Vantage API call limit likely reached for ${tickerSymbol}: ${data['Note']}`);
           // Fall through to mock data
        } else {
          console.warn(`Price data not found for ${tickerSymbol} in Alpha Vantage response:`, data);
          // Fall through to mock data
        }
      } catch (error) {
        console.error(`Error fetching from Alpha Vantage for ${tickerSymbol}:`, error);
        // Fall through to mock data
      }
    } else {
      console.log("Alpha Vantage API key not found. Falling back to mock stock data.");
    }
  }

  // --- Placeholder for Crypto API (e.g., CoinGecko) ---
  if (category === 'crypto' && tickerSymbol) {
    // const coinGeckoId = tickerSymbol.toLowerCase(); // Map your ticker to CoinGecko ID
    // const targetCurrencyLower = currency.toLowerCase();
    // const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=${targetCurrencyLower}&include_24hr_change=true`;
    // try {
    //   // ... fetch logic ...
    //   // return { currentPrice, previousClosePrice, priceHistory (from another endpoint) };
    // } catch (error) {
    //   console.error("Error fetching crypto data:", error);
    // }
    console.log("Crypto API integration placeholder for symbol:", tickerSymbol, "currency:", currency);
  }

  // --- Placeholder for Mutual Funds API (e.g., AMFI India, Morningstar, or custom JSON) ---
  if (category === 'mutualfund' && tickerSymbol) {
    // try {
    //   // ... fetch logic for NAV ...
    //   // return { currentPrice, previousClosePrice, priceHistory };
    // } catch (error) {
    //   console.error("Error fetching mutual fund data:", error);
    // }
    console.log("Mutual Fund API integration placeholder for symbol:", tickerSymbol, "currency:", currency);
  }
  // --- END REAL API INTEGRATION SECTION ---


  // --- MOCK DATA GENERATION (Fallback or if APIs not implemented) ---
  console.log(`Using MOCK data for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  let baseTargetPriceInCurrency: number;
  let historyPatternKey = 'default';
  const deterministicFactor = getDeterministicFactor(tickerSymbol);

  switch (category) {
    case 'stock':
      historyPatternKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      if (currency === 'INR') {
        baseTargetPriceInCurrency = (1000 + deterministicFactor * (15000 - 1000)); // e.g. 1000 to 15000 INR for a stock
      } else if (currency === 'EUR') {
        baseTargetPriceInCurrency = (10 + deterministicFactor * (500 - 10)); // e.g. 10 to 500 EUR
      } else { // USD
        baseTargetPriceInCurrency = (10 + deterministicFactor * (500 - 10)); // e.g. 10 to 500 USD
      }
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
        if (currency === 'INR') baseTargetPriceInCurrency = (240000 + deterministicFactor * (60000));  // 240k to 300k INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (2800 + deterministicFactor * (700));    // 2.8k to 3.5k EUR
        else baseTargetPriceInCurrency = (3000 + deterministicFactor * (500));    // 3k to 3.5k USD
      } else if (upperTicker === 'ADA') {
        historyPatternKey = 'cryptoADA';
        if (currency === 'INR') baseTargetPriceInCurrency = (50 + deterministicFactor * (30)); // 50 to 80 INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (0.5 + deterministicFactor * (0.3)); // 0.5 to 0.8 EUR
        else baseTargetPriceInCurrency = (0.6 + deterministicFactor * (0.4)); // 0.6 to 1.0 USD
      } else { // General altcoins
        historyPatternKey = 'cryptoGeneral';
        if (currency === 'INR') baseTargetPriceInCurrency = (15 + deterministicFactor * (185 - 15)); // 15 to 200 INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (0.15 + deterministicFactor * (2.5 - 0.15)); // 0.15 to 2.5 EUR
        else baseTargetPriceInCurrency = (0.2 + deterministicFactor * (3 - 0.2)); // 0.2 to 3 USD
      }
      break;
    case 'mutualfund':
      historyPatternKey = 'mutualfund';
      if (currency === 'INR') {
        baseTargetPriceInCurrency = (200 + deterministicFactor * (800 - 200)); // 200 to 1000 INR NAV
      } else if (currency === 'EUR') {
        baseTargetPriceInCurrency = (20 + deterministicFactor * (100 - 20));  // 20 to 100 EUR NAV
      } else { // USD
        baseTargetPriceInCurrency = (20 + deterministicFactor * (100 - 20));  // 20 to 100 USD NAV
      }
      break;
    case 'bank':
    case 'property':
      const existingValueBase = (currency === 'INR' ? 500000 : currency === 'EUR' ? 75000 : 100000);
      const stableBaseForNonTrackable = existingValueBase + deterministicFactor * (existingValueBase * 0.1);

      const currentPriceForNonTrackable = stableBaseForNonTrackable * (1 + (Math.random() - 0.5) * 0.005);
      const previousCloseForNonTrackable = currentPriceForNonTrackable * (1 + (Math.random() - 0.5) * 0.002);
       return {
        currentPrice: parseFloat(currentPriceForNonTrackable.toFixed(2)),
        previousClosePrice: parseFloat(previousCloseForNonTrackable.toFixed(2)),
        priceHistory: [
            {date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], price: parseFloat((stableBaseForNonTrackable * 0.99).toFixed(2))},
            {date: new Date().toISOString().split('T')[0], price: parseFloat(currentPriceForNonTrackable.toFixed(2))}
        ],
      };
    default: // Should not happen if category is always valid
      baseTargetPriceInCurrency = 100;
  }

  // Apply a small random fluctuation to the stable base price
  const currentPriceInTargetCurrency = baseTargetPriceInCurrency * (1 + (Math.random() - 0.5) * 0.04); // Fluctuate by +/- 2%
  const previousClosePriceInTargetCurrency = currentPriceInTargetCurrency * (1 + (Math.random() - 0.5) * 0.03); // Fluctuate by +/- 1.5% from current

  let baseHistoryPattern = mockPriceHistoryPatterns[historyPatternKey] || mockPriceHistoryPatterns.default;
  const lastPatternPointValue = baseHistoryPattern.length > 0 ? baseHistoryPattern[baseHistoryPattern.length - 1].price : currentPriceInTargetCurrency;

  // Ensure scaleFactor is not zero or excessively small/large
  const scaleFactor = lastPatternPointValue !== 0 ? currentPriceInTargetCurrency / lastPatternPointValue : 1;

  const finalPriceHistory = baseHistoryPattern.map(p => ({
    ...p,
    price: parseFloat((p.price * scaleFactor).toFixed(2))
  }));

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
