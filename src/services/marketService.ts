
'use server';

import type { AssetCategory, AssetPriceData } from '@/contexts/AssetContext';

interface PriceFetchResult {
  currentPrice: number;
  previousClosePrice: number;
  priceHistory: AssetPriceData[];
  priceFetchError?: string;
}

export interface TickerSuggestion {
  symbol: string;
  name: string;
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
  return ((sum * 13) % 101) / 100; // Ensure value is between 0 and 1
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
  const deterministicFactor = getDeterministicFactor(tickerSymbol); // 0 to 1

  switch (category) {
    case 'stock':
      historyPatternKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      if (currency === 'INR') baseTargetPriceInCurrency = (1000 + deterministicFactor * (15000 - 1000));
      else if (currency === 'EUR') baseTargetPriceInCurrency = (10 + deterministicFactor * (500 - 10));
      else baseTargetPriceInCurrency = (10 + deterministicFactor * (500 - 10));
      break;
    case 'crypto':
      const upperTicker = tickerSymbol?.toUpperCase();
      if (upperTicker === 'BTC' || upperTicker === 'BTCUSD') {
        historyPatternKey = 'cryptoMajorBTC';
        if (currency === 'INR') baseTargetPriceInCurrency = (5000000 + deterministicFactor * (1000000)); 
        else if (currency === 'EUR') baseTargetPriceInCurrency = (55000 + deterministicFactor * (10000));
        else baseTargetPriceInCurrency = (60000 + deterministicFactor * (10000));
      } else if (upperTicker === 'ETH' || upperTicker === 'ETHUSD') {
        historyPatternKey = 'cryptoMajorETH';
        if (currency === 'INR') baseTargetPriceInCurrency = (240000 + deterministicFactor * (60000));
        else if (currency === 'EUR') baseTargetPriceInCurrency = (2800 + deterministicFactor * (700));
        else baseTargetPriceInCurrency = (3000 + deterministicFactor * (500));
      } else if (upperTicker === 'ADA' || upperTicker === 'ADAUSD') {
        historyPatternKey = 'cryptoADA';
        if (currency === 'INR') baseTargetPriceInCurrency = (50 + deterministicFactor * (30));
        else if (currency === 'EUR') baseTargetPriceInCurrency = (0.4 + deterministicFactor * (0.4));
        else baseTargetPriceInCurrency = (0.5 + deterministicFactor * (0.5));
      } else {
        historyPatternKey = 'cryptoGeneral';
        if (currency === 'INR') baseTargetPriceInCurrency = (15 + deterministicFactor * (185 - 15));
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
      const stableBaseValue = currency === 'INR' ? 100000 : currency === 'EUR' ? 10000 : 12000;
      const currentManualValue = stableBaseValue * (1 + deterministicFactor * 0.1);
      return {
        currentPrice: parseFloat(currentManualValue.toFixed(2)),
        previousClosePrice: parseFloat((currentManualValue * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2)),
        priceHistory: [{date: new Date().toISOString().split('T')[0], price: parseFloat(currentManualValue.toFixed(2))}],
        priceFetchError: "Manual value."
      };
    default:
      baseTargetPriceInCurrency = (currency === 'INR' ? 1000 : currency === 'EUR' ? 10 : 10);
  }

  const currentPriceInTargetCurrency = baseTargetPriceInCurrency * (1 + (Math.random() - 0.5) * 0.04);
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
  console.log(`[MarketService] Attempting to fetch price for: Category=${category}, Ticker=${tickerSymbol}, Currency=${currency}`);

  if (category === 'stock' && tickerSymbol) {
    // Basic ticker format validation
    const trimmedTicker = tickerSymbol.trim();
    if (!trimmedTicker || trimmedTicker.length > 15 || !/^[a-zA-Z0-9.-]+$/.test(trimmedTicker)) {
        console.warn(`[MarketService] Invalid or malformed ticker symbol provided for stock: '${tickerSymbol}'. Falling back to mock data.`);
        return generateMockPriceData(category, tickerSymbol, currency, `Malformed ticker: '${tickerSymbol}'. Using mock data.`);
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn("[MarketService] Alpha Vantage API key not found. Using mock data for stocks.");
      return generateMockPriceData(category, tickerSymbol, currency, "API key missing. Using mock data.");
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${trimmedTicker}&apikey=${apiKey}`;
    console.log(`[MarketService] Attempting to fetch stock data for ${trimmedTicker} from Alpha Vantage URL: ${url}`);

    try {
      const response = await fetch(url, { cache: 'no-store' }); // Prevent caching for fresh data

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MarketService] Alpha Vantage API request failed for ${trimmedTicker}: ${response.status} ${response.statusText}. Response: ${errorText}`);
        return generateMockPriceData(category, tickerSymbol, currency, `API request failed: ${response.status}. Using mock data.`);
      }

      const data = await response.json();
      console.log(`[MarketService] Raw Alpha Vantage response for ${trimmedTicker}:`, JSON.stringify(data, null, 2));

      if (data['Global Quote'] && data['Global Quote']['05. price'] && data['Global Quote']['08. previous close']) {
        const currentPriceStr = data['Global Quote']['05. price'];
        const previousCloseStr = data['Global Quote']['08. previous close'];

        const currentPrice = parseFloat(currentPriceStr);
        const previousClosePrice = parseFloat(previousCloseStr);

        console.log(`[MarketService] Alpha Vantage Raw Prices for ${trimmedTicker}: Current='${currentPriceStr}', PreviousClose='${previousCloseStr}'`);
        console.log(`[MarketService] Alpha Vantage Parsed Floats for ${trimmedTicker}: Current=${currentPrice}, PreviousClose=${previousClosePrice}`);

        if (isNaN(currentPrice) || currentPrice === 0 || isNaN(previousClosePrice)) { // Allow previousClose to be 0 if current is not
          console.warn(`[MarketService] Alpha Vantage returned non-numeric, zero, or invalid price for ${trimmedTicker}. Parsed: current=${currentPrice}, prevClose=${previousClosePrice}. Raw: current='${currentPriceStr}', prevClose='${previousCloseStr}'. Falling back to mock.`);
          return generateMockPriceData(category, tickerSymbol, currency, "API returned invalid price (0 or NaN). Using mock data.");
        } else {
          console.log(`[MarketService] Successfully fetched and parsed from Alpha Vantage for ${trimmedTicker}: Current Price USD ${currentPrice}, Previous Close USD ${previousClosePrice}`);

          const historyPattern = mockPriceHistoryPatterns.default;
          const lastPatternPoint = historyPattern.length > 0 ? historyPattern[historyPattern.length - 1].price : currentPrice;
          const scaleFactor = lastPatternPoint !== 0 ? currentPrice / lastPatternPoint : 1;

          const priceHistory = historyPattern.map(p => ({
            ...p,
            price: parseFloat((p.price * scaleFactor).toFixed(2))
          }));

          if (priceHistory.length > 0) {
            priceHistory[priceHistory.length - 1].price = currentPrice;
          } else {
            priceHistory.push({ date: new Date().toISOString().split('T')[0], price: currentPrice });
          }

          if (currency !== 'USD') {
            console.warn(`[MarketService] Alpha Vantage provides USD prices. Currency for ${trimmedTicker} is ${currency}. Displaying USD value with ${currency} symbol. Actual conversion not implemented.`);
          }

          return {
            currentPrice: parseFloat(currentPrice.toFixed(2)),
            previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
            priceHistory: priceHistory,
            priceFetchError: undefined,
          };
        }
      } else if (data['Note']) {
         console.warn(`[MarketService] Alpha Vantage API call limit likely reached for ${trimmedTicker}: ${data['Note']}`);
         return generateMockPriceData(category, tickerSymbol, currency, `API limit: ${data['Note']}. Using mock data.`);
      } else {
        console.warn(`[MarketService] Price data not found for ${trimmedTicker} in Alpha Vantage response. This could be an invalid ticker or other API issue. Raw response:`, data);
        return generateMockPriceData(category, tickerSymbol, currency, "Invalid API response (data not found). Using mock data.");
      }
    } catch (error) {
      let detailedError = "Network error fetching price. Using mock data.";
      if (error instanceof Error) {
        console.error(`[MarketService] Network error fetching from Alpha Vantage for ${trimmedTicker}: Name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`);
        detailedError = `Network Error: ${error.name} - ${error.message}. Using mock data.`;
      } else if (typeof error === 'string') {
        console.error(`[MarketService] Network error (string) fetching from Alpha Vantage for ${trimmedTicker}: ${error}`);
        detailedError = `Network Error: ${error}. Using mock data.`;
      } else {
        console.error(`[MarketService] Network error (unknown) fetching from Alpha Vantage for ${trimmedTicker}:`, error);
        detailedError = `Network Error: ${String(error)}. Using mock data.`;
      }
      return generateMockPriceData(category, tickerSymbol, currency, detailedError);
    }
  }

  if (category === 'crypto') {
      return generateMockPriceData(category, tickerSymbol, currency, `Using mock data for crypto.`);
  }
  if (category === 'mutualfund') {
      return generateMockPriceData(category, tickerSymbol, currency, `Using mock data for mutual funds.`);
  }
  if (category === 'bank' || category === 'property') {
    // For bank/property, currentPrice is the manually entered balance/value
    // We can simulate a small, almost negligible fluctuation for previousClose for consistency if needed,
    // but typically these don't have a "previous close" in the market sense.
    // For simplicity, we'll use the current price as the previous close for these types.
    const existingAsset = /* how to get current value here if not passed? This function is about fetching. */ null;
    const currentVal = (existingAsset as any)?.currentPrice || (currency === 'INR' ? 50000 : currency === 'EUR' ? 5000 : 7000); // Placeholder
    return {
      currentPrice: currentVal,
      previousClosePrice: currentVal, // Assume no daily change for manual entries for now
      priceHistory: [{ date: new Date().toISOString().split('T')[0], price: currentVal }],
      priceFetchError: "Manual value.",
    };
  }

  console.warn(`[MarketService] Unhandled category or scenario for ${category} - ${tickerSymbol}. Falling back to default mock.`);
  return generateMockPriceData(category, tickerSymbol, currency, "Using default mock data for unhandled category.");
}


export async function searchTickerSymbols(keywords: string): Promise<TickerSuggestion[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error("[MarketService] Alpha Vantage API key not found for ticker search.");
    return [];
  }

  if (!keywords || keywords.trim() === '') {
    return [];
  }

  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`;
  console.log(`[MarketService] Searching ticker symbols with URL: ${url}`);

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MarketService] Alpha Vantage SYMBOL_SEARCH API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      return [];
    }
    const data = await response.json();
    console.log(`[MarketService] Raw SYMBOL_SEARCH response for "${keywords}":`, JSON.stringify(data, null, 2));

    if (data.Note) {
      console.warn(`[MarketService] Alpha Vantage API Note (likely call limit) for SYMBOL_SEARCH: ${data.Note}`);
      return [];
    }

    if (data.Information && data.Information.includes("Thank you for using Alpha Vantage!")) {
      console.warn(`[MarketService] Alpha Vantage API call limit reached for SYMBOL_SEARCH.`);
      return [];
    }


    if (data.bestMatches && Array.isArray(data.bestMatches)) {
      return data.bestMatches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
      })).slice(0, 5); // Limit to top 5 suggestions
    } else {
      console.warn("[MarketService] No 'bestMatches' found in SYMBOL_SEARCH response or it's not an array:", data);
      return [];
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[MarketService] Error fetching ticker symbols for "${keywords}": ${error.name} - ${error.message}`);
    } else {
      console.error(`[MarketService] Unknown error fetching ticker symbols for "${keywords}":`, error);
    }
    return [];
  }
}
