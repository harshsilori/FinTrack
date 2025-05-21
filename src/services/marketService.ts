
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
  
  // --- START REAL API INTEGRATION SECTION (Illustrative) ---
  // You would replace the mock logic below with actual API calls.
  // Store API keys in environment variables (e.g., .env.local) and access them via process.env.YOUR_API_KEY
  // Remember to handle errors, rate limits, and data parsing for each API.

  /*
  // Example for Crypto using CoinGecko API (public, no key needed for simple price)
  if (category === 'crypto' && tickerSymbol) {
    // Map your tickerSymbol to CoinGecko's asset ID (e.g., 'BTC' -> 'bitcoin', 'ETH' -> 'ethereum')
    const coinGeckoId = tickerSymbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                        tickerSymbol.toLowerCase() === 'eth' ? 'ethereum' : 
                        tickerSymbol.toLowerCase() === 'ada' ? 'cardano' : 
                        tickerSymbol.toLowerCase(); // Fallback, might need better mapping

    const targetCurrencyLower = currency.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=${targetCurrencyLower}&include_24hr_change=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data[coinGeckoId] && data[coinGeckoId][targetCurrencyLower]) {
        const currentPrice = data[coinGeckoId][targetCurrencyLower];
        const dailyChange = data[coinGeckoId][`${targetCurrencyLower}_24h_change`] || 0;
        const previousClosePrice = currentPrice / (1 + (dailyChange / 100));

        // For priceHistory, you'd need another CoinGecko endpoint (e.g., /coins/{id}/market_chart)
        // and then map its data to AssetPriceData[] format.
        // This example just returns a simple mock history based on current price for now.
        const historyPattern = mockPriceHistoryPatterns.cryptoGeneral; // Or a more specific one
        const lastPatternPoint = historyPattern.length > 0 ? historyPattern[historyPattern.length - 1].price : currentPrice;
        const scaleFactor = lastPatternPoint !== 0 ? currentPrice / lastPatternPoint : 1;
        const priceHistory = historyPattern.map(p => ({
          ...p,
          price: parseFloat((p.price * scaleFactor).toFixed(2))
        }));
        if (priceHistory.length > 0) priceHistory[priceHistory.length -1].price = currentPrice;


        return {
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          previousClosePrice: parseFloat(previousClosePrice.toFixed(2)),
          priceHistory: priceHistory, // Replace with actual fetched history
        };
      } else {
        console.warn(`Price data not found for ${coinGeckoId} in ${targetCurrencyLower} from CoinGecko.`);
      }
    } catch (error) {
      console.error("Error fetching from CoinGecko:", error);
      // Fall through to mock data if API fails
    }
  }

  // Placeholder for Stocks API (e.g., Yahoo Finance through a proxy/backend or a dedicated API like IEX Cloud)
  if (category === 'stock' && tickerSymbol) {
    // const YFINANCE_API_KEY = process.env.YFINANCE_API_KEY; 
    // const url = `https://your-stock-api-endpoint.com/price?symbol=${tickerSymbol}&currency=${currency}&apikey=${YFINANCE_API_KEY}`;
    // try {
    //   // ... fetch logic ...
    //   // const currentPrice = ...;
    //   // const previousClosePrice = ...;
    //   // const priceHistory = ...; // Map API response to AssetPriceData[]
    //   // return { currentPrice, previousClosePrice, priceHistory };
    // } catch (error) {
    //   console.error("Error fetching stock data:", error);
    // }
    console.log("Stock API integration placeholder for ticker:", tickerSymbol, "currency:", currency);
  }

  // Placeholder for Mutual Funds API (e.g., AMFI India, Morningstar, or a custom JSON)
  if (category === 'mutualfund' && tickerSymbol) {
    // const AMFI_API_ENDPOINT = '...'; // AMFI data often needs scraping or specific provider APIs
    // try {
    //   // ... fetch logic for NAV ...
    //   // const currentPrice = NAV;
    //   // const previousClosePrice = previousNAV; // MF data might not have typical open/close
    //   // const priceHistory = ...;
    //   // return { currentPrice, previousClosePrice, priceHistory };
    // } catch (error) {
    //   console.error("Error fetching mutual fund data:", error);
    // }
    console.log("Mutual Fund API integration placeholder for symbol:", tickerSymbol, "currency:", currency);
  }
  */
  // --- END REAL API INTEGRATION SECTION ---


  // --- MOCK DATA GENERATION (Fallback or if APIs not implemented) ---
  console.log(`Using MOCK data for ${category} - ${tickerSymbol || 'N/A'} in ${currency}`);
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); // Shorter delay for mock

  let baseTargetPriceInCurrency: number;
  let historyPatternKey = 'default';
  const deterministicFactor = getDeterministicFactor(tickerSymbol); 

  switch (category) {
    case 'stock':
      historyPatternKey = tickerSymbol?.toLowerCase().includes('tech') || tickerSymbol?.toLowerCase().includes('google') || tickerSymbol?.toLowerCase().includes('apple') ? 'tech' : 'default';
      if (currency === 'INR') {
        baseTargetPriceInCurrency = 500 + deterministicFactor * (4500 - 500); 
      } else if (currency === 'EUR') {
        baseTargetPriceInCurrency = 50 + deterministicFactor * (450 - 50);   
      } else { 
        baseTargetPriceInCurrency = 50 + deterministicFactor * (450 - 50);   
      }
      break;
    case 'crypto':
      const upperTicker = tickerSymbol?.toUpperCase();
      if (upperTicker === 'BTC' || upperTicker === 'BTCUSD') {
        historyPatternKey = 'cryptoMajorBTC';
        if (currency === 'INR') baseTargetPriceInCurrency = 5000000 + deterministicFactor * (1000000); 
        else if (currency === 'EUR') baseTargetPriceInCurrency = 55000 + deterministicFactor * (10000); 
        else baseTargetPriceInCurrency = 60000 + deterministicFactor * (10000); 
      } else if (upperTicker === 'ETH' || upperTicker === 'ETHUSD') {
        historyPatternKey = 'cryptoMajorETH';
        if (currency === 'INR') baseTargetPriceInCurrency = 240000 + deterministicFactor * (40000);  
        else if (currency === 'EUR') baseTargetPriceInCurrency = 2800 + deterministicFactor * (500);    
        else baseTargetPriceInCurrency = 3000 + deterministicFactor * (500);    
      } else if (upperTicker === 'ADA') { 
        historyPatternKey = 'cryptoADA';
        if (currency === 'INR') baseTargetPriceInCurrency = 50 + deterministicFactor * (30); 
        else if (currency === 'EUR') baseTargetPriceInCurrency = 0.5 + deterministicFactor * (0.3); 
        else baseTargetPriceInCurrency = 0.6 + deterministicFactor * (0.4); 
      } else { 
        historyPatternKey = 'cryptoGeneral';
        if (currency === 'INR') baseTargetPriceInCurrency = 15 + deterministicFactor * (185 - 15);     
        else if (currency === 'EUR') baseTargetPriceInCurrency = 0.15 + deterministicFactor * (2.5 - 0.15); 
        else baseTargetPriceInCurrency = 0.2 + deterministicFactor * (3 - 0.2);     
      }
      break;
    case 'mutualfund':
      historyPatternKey = 'mutualfund';
      if (currency === 'INR') {
        baseTargetPriceInCurrency = 200 + deterministicFactor * (800 - 200); 
      } else if (currency === 'EUR') {
        baseTargetPriceInCurrency = 20 + deterministicFactor * (100 - 20);  
      } else { 
        baseTargetPriceInCurrency = 20 + deterministicFactor * (100 - 20);  
      }
      break;
    case 'bank':
    case 'property':
      const existingValueBase = (currency === 'INR' ? 500000 : currency === 'EUR' ? 75000 : 100000);
      const stableBaseForNonTrackable = existingValueBase + deterministicFactor * (existingValueBase * 0.1); // More varied base
      
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
    default: 
      baseTargetPriceInCurrency = 100 * (currency === 'INR' ? 80 : currency === 'EUR' ? 0.9 : 1); 
  }

  const currentPriceInTargetCurrency = baseTargetPriceInCurrency * (1 + (Math.random() - 0.49) * 0.04); // Fluctuate by +/- 2% (less volatile)
  const previousClosePriceInTargetCurrency = currentPriceInTargetCurrency * (1 + (Math.random() - 0.49) * 0.03); // Fluctuate by +/- 1.5% from current

  let baseHistoryPattern = mockPriceHistoryPatterns[historyPatternKey] || mockPriceHistoryPatterns.default;
  const lastPatternPointValue = baseHistoryPattern.length > 0 ? baseHistoryPattern[baseHistoryPattern.length - 1].price : currentPriceInTargetCurrency;
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
