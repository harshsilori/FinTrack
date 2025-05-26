
'use server';

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[];
  priceFetchError?: string; // To provide feedback to the UI
}

// Base patterns for price history - these are relative patterns
const mockPriceHistoryPatterns: Record<string, AssetPriceData[]> = {
  default: [ { date: '2024-07-01', price: 100 }, { date: '2024-07-08', price: 102 }, { date: '2024-07-15', price: 101 }, { date: '2024-07-22', price: 105 }, { date: '2024-07-29', price: 108 }, ],
  tech: [ { date: '2024-07-01', price: 200 }, { date: '2024-07-08', price: 205 }, { date: '2024-07-15', price: 210 }, { date: '2024-07-22', price: 208 }, { date: '2024-07-29', price: 215 }, ],
  cryptoGeneral: [ { date: '2024-07-01', price: 0.80 }, { date: '2024-07-08', price: 0.85 }, { date: '2024-07-15', price: 0.78 }, { date: '2024-07-22', price: 0.90 }, { date: '2024-07-29', price: 0.95 }, ],
  cryptoMajorBTC: [ { date: '2024-07-01', price: 60000 }, { date: '2024-07-08', price: 62000 }, { date: '2024-07-15', price: 59000 }, { date: '2024-07-22', price: 63000 }, { date: '2024-07-29', price: 65000 }, ],
  cryptoMajorETH: [ { date: '2024-07-01', price: 3000 }, { date: '2024-07-08', price: 3200 }, { date: '2024-07-15', price: 2900 }, { date: '2024-07-22', price: 3300 }, { date: '2024-07-29', price: 3500 }, ],
  cryptoADA: [ { date: '2024-07-01', price: 0.55 }, { date: '2024-07-08', price: 0.62 }, { date: '2024-07-15', price: 0.58 }, { date: '2024-07-22', price: 0.66 }, { date: '2024-07-29', price: 0.70 }, ],
  mutualfund: [ { date: '2024-07-01', price: 50 }, { date: '2024-07-08', price: 51 }, { date: '2024-07-15', price: 50.5 }, { date: '2024-07-22', price: 52 }, { date: '2024-07-29', price: 53 }, ],
};

function getDeterministicFactor(str: string | undefined): number {
  if (!str || str.length === 0) return 0.5;
  let sum = 0;
  for (let i = 0; i < Math.min(str.length, 10); i++) {
    sum += str.charCodeAt(i);
  }
  return ((sum * 13) % 101) / 100;
}

async function generateMockPriceData(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD',
  fallbackReason: string = "Using mock data."
): Promise<PriceFetchResult> {
  console.log(`Generating MOCK data for ${category} - ${tickerSymbol || 'N/A'} in ${currency}. Reason: ${fallbackReason}`);
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); 

  let baseTargetPriceInCurrency: number;
  let historyPatternKey = 'default';
  const deterministicFactor = getDeterministicFactor(tickerSymbol);

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
        if (currency === 'INR') baseTargetPriceInCurrency = (5000000 + deterministicFactor * (1000000)); // 5.0M to 6.0M INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (55000 + deterministicFactor * (10000));
        else baseTargetPriceInCurrency = (60000 + deterministicFactor * (10000));
      } else if (upperTicker === 'ETH' || upperTicker === 'ETHUSD') {
        historyPatternKey = 'cryptoMajorETH';
        if (currency === 'INR') baseTargetPriceInCurrency = (240000 + deterministicFactor * (60000));
        else if (currency === 'EUR') baseTargetPriceInCurrency = (2800 + deterministicFactor * (700));
        else baseTargetPriceInCurrency = (3000 + deterministicFactor * (500));
      } else if (upperTicker === 'ADA' || upperTicker === 'ADAUSD') {
        historyPatternKey = 'cryptoADA';
        if (currency === 'INR') baseTargetPriceInCurrency = (50 + deterministicFactor * (30)); // 50 to 80 INR
        else if (currency === 'EUR') baseTargetPriceInCurrency = (0.5 + deterministicFactor * (0.3));
        else baseTargetPriceInCurrency = (0.6 + deterministicFactor * (0.4));
      } else {
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
      const stableValue = (currency === 'INR' ? 100000 : currency === 'EUR' ? 10000 : 12000) * (1 + deterministicFactor * 0.1);
      return {
        currentPrice: parseFloat(stableValue.toFixed(2)),
        previousClosePrice: parseFloat((stableValue * 0.998).toFixed(2)),
        priceHistory: [{date: new Date().toISOString().split('T')[0], price: parseFloat(stableValue.toFixed(2))}],
        priceFetchError: "Manual value (mocked)"
      };
    default:
      baseTargetPriceInCurrency = (currency === 'INR' ? 1000 : currency === 'EUR' ? 10 : 10);
  }

  const currentPriceInTargetCurrency = baseTargetPriceInCurrency * (1 + (Math.random() - 0.5) * 0.04); // Fluctuate by +/- 2%
  const previousClosePriceInTargetCurrency = currentPriceInTargetCurrency * (1 + (Math.random() - 0.5) * 0.03);

  let baseHistoryPattern = mockPriceHistoryPatterns[historyPatternKey] || mockPriceHistoryPatterns.default;
  const lastPatternPointValue = baseHistoryPattern.length > 0 ? baseHistoryPattern[baseHistoryPattern.length - 1].price : currentPriceInTargetCurrency;
  const safeLastPatternPointValue = lastPatternPointValue === 0 ? 1 : lastPatternPointValue;
  const scaleFactor = currentPriceInTargetCurrency / safeLastPatternPointValue;

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
    priceFetchError: fallbackReason,
  };
}

export async function fetchAssetPrice(
  category: AssetCategory,
  tickerSymbol?: string,
  currency: string = 'USD'
): Promise<PriceFetchResult> {
  console.log(`Fetching price for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);

  if (category === 'stock' && tickerSymbol) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn("Alpha Vantage API key not found. Using mock data for stocks.");
      return generateMockPriceData(category, tickerSymbol, currency, "API key missing. Using mock data.");
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${tickerSymbol}&apikey=${apiKey}`;
    console.log(`Attempting to fetch stock data for ${tickerSymbol} from Alpha Vantage URL: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Alpha Vantage API request failed for ${tickerSymbol}: ${response.status} ${response.statusText}. Response: ${errorText}`);
        return generateMockPriceData(category, tickerSymbol, currency, `API request failed: ${response.status}. Using mock data.`);
      }
      
      const data = await response.json();

      if (data['Global Quote'] && data['Global Quote']['05. price'] && data['GlobalQuote']['08. previous close']) {
        const currentPriceStr = data['Global Quote']['05. price'];
        const previousCloseStr = data['Global Quote']['08. previous close'];
        
        const currentPrice = parseFloat(currentPriceStr);
        const previousClosePrice = parseFloat(previousCloseStr);

        console.log(`Alpha Vantage Raw Prices for ${tickerSymbol}: Current='${currentPriceStr}', PreviousClose='${previousCloseStr}'`);
        console.log(`Alpha Vantage Parsed Floats for ${tickerSymbol}: Current=${currentPrice}, PreviousClose=${previousClosePrice}`);

        if (isNaN(currentPrice) || currentPrice === 0 || isNaN(previousClosePrice) || previousClosePrice === 0) {
          console.warn(`Alpha Vantage returned non-numeric, zero, or invalid price for ${tickerSymbol}. Parsed: current=${currentPrice}, prevClose=${previousClosePrice}. Raw: current='${currentPriceStr}', prevClose='${previousCloseStr}'. Falling back to mock.`);
          return generateMockPriceData(category, tickerSymbol, currency, "API returned invalid price (0 or NaN). Using mock data.");
        } else {
          console.log(`Successfully fetched and parsed from Alpha Vantage for ${tickerSymbol}: Current Price USD ${currentPrice}, Previous Close USD ${previousClosePrice}`);

          const historyPattern = mockPriceHistoryPatterns.default; // Use default history pattern
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
            priceFetchError: undefined, // Success
          };
        }
      } else if (data['Note']) {
         console.warn(`Alpha Vantage API call limit likely reached for ${tickerSymbol}: ${data['Note']}`);
         console.warn("Raw Alpha Vantage response (Note):", JSON.stringify(data, null, 2));
         return generateMockPriceData(category, tickerSymbol, currency, `API limit likely reached. Using mock data.`);
      } else {
        console.warn(`Price data not found for ${tickerSymbol} in Alpha Vantage response. This could be an invalid ticker or other API issue.`);
        console.warn("Raw Alpha Vantage response (Data not found):", JSON.stringify(data, null, 2));
        return generateMockPriceData(category, tickerSymbol, currency, "Invalid API response (data not found). Using mock data.");
      }
    } catch (error) {
      console.error(`Error fetching or parsing from Alpha Vantage for ${tickerSymbol}:`, error);
      return generateMockPriceData(category, tickerSymbol, currency, "Network error fetching price. Using mock data.");
    }
  }
  
  // Fallback to mock data for other categories or if stock fetch fails above
  if (category === 'crypto') {
      return generateMockPriceData(category, tickerSymbol, currency, "Using mock data for crypto.");
  }
  if (category === 'mutualfund') {
      return generateMockPriceData(category, tickerSymbol, currency, "Using mock data for mutual funds.");
  }
  if (category === 'bank' || category === 'property') {
    // For bank/property, value is usually manually entered.
    // The generateMockPriceData handles this, but we can be explicit here.
    const deterministicFactor = getDeterministicFactor(tickerSymbol);
    const stableValue = (currency === 'INR' ? 100000 : currency === 'EUR' ? 10000 : 12000) * (1 + deterministicFactor * 0.1);
    return {
      currentPrice: parseFloat(stableValue.toFixed(2)),
      previousClosePrice: parseFloat((stableValue * 0.998).toFixed(2)),
      priceHistory: [{ date: new Date().toISOString().split('T')[0], price: parseFloat(stableValue.toFixed(2)) }],
      priceFetchError: "Manual value (mocked).",
    };
  }
  
  // Generic fallback if somehow none of the above matched
  console.warn(`Unhandled category or scenario for ${category} - ${tickerSymbol}. Falling back to default mock.`);
  return generateMockPriceData(category, tickerSymbol, currency, "Using default mock data.");
}
