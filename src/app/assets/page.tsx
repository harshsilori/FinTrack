
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2, TrendingUp, RefreshCcw, WalletCards, TrendingDown, Coins, Info, AlertTriangle, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useAssets, type Asset as ContextAsset, type AssetCategory } from '@/contexts/AssetContext';
import { fetchAssetPrice, searchTickerSymbols, type TickerSuggestion } from '@/services/marketService';
import Link from 'next/link';

const assetIcons: Record<AssetCategory, React.ReactNode> = {
  bank: <Landmark className="h-8 w-8 text-blue-500" />,
  stock: <BarChartBig className="h-8 w-8 text-green-500" />,
  crypto: <Bitcoin className="h-8 w-8 text-orange-500" />,
  property: <Building2 className="h-8 w-8 text-purple-500" />,
  mutualfund: <WalletCards className="h-8 w-8 text-indigo-500" />,
};

const initialAssetFormState: Partial<ContextAsset> = {
  name: '',
  category: 'stock',
  currency: 'USD',
  quantity: 1,
  purchasePrice: 0,
  tickerSymbol: '',
};

const supportedCurrencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
];

const chartConfigBase = {
  price: { label: "Price", color: "hsl(var(--primary))" },
};

const categoryDisplayNames: Record<AssetCategory | 'overview', string> = {
  overview: "Overview",
  bank: "Bank Accounts",
  stock: "Stocks",
  crypto: "Cryptocurrencies",
  property: "Properties",
  mutualfund: "Mutual Funds",
};

const assetCategories: AssetCategory[] = ['bank', 'stock', 'crypto', 'property', 'mutualfund'];

const STALE_PRICE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export default function AssetsPage() {
  const { toast } = useToast();
  const { assets: allAssets, addAsset, updateAsset, deleteAsset: deleteAssetFromContext, updateAssetPrice, getAssetMarketValue } = useAssets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Partial<ContextAsset>>(initialAssetFormState);
  const [isFetchingPrice, setIsFetchingPrice] = useState<Record<string, boolean>>({});
  const [initialRefreshPerformedForTab, setInitialRefreshPerformedForTab] = useState<Record<string, boolean>>({});

  // State for company name search and suggestions
  const [companyNameSearchQuery, setCompanyNameSearchQuery] = useState('');
  const [companyNameSuggestions, setCompanyNameSuggestions] = useState<TickerSuggestion[]>([]);
  const [isCompanyNameSearching, setIsCompanyNameSearching] = useState(false);
  const [showCompanyNameSuggestionsPopover, setShowCompanyNameSuggestionsPopover] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('category') as AssetCategory | 'overview' | null;
    if (tabParam && (assetCategories.includes(tabParam as AssetCategory) || tabParam === 'overview')) {
        return tabParam;
    }
    return 'overview';
  }, [searchParams]);


  const handleTabChange = (newTabValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTabValue === 'overview') {
      params.delete('category');
    } else {
      params.set('category', newTabValue);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    if (newTabValue !== 'overview' && newTabValue !== 'property' && newTabValue !== 'bank') { // Only reset for trackable asset tabs
      setInitialRefreshPerformedForTab(prev => ({ ...prev, [newTabValue]: false }));
    }
  };

  const displayedAssets = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      return allAssets.filter(asset => asset.category === activeTab);
    }
    return []; // No assets displayed directly under "Overview" tab, only the snapshot
  }, [allAssets, activeTab]);

  const isCurrentAssetTrackable = useMemo(() => {
    if (!currentAsset || !currentAsset.category) return false;
    return currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';
  }, [currentAsset]);

  const openForm = (asset?: ContextAsset) => {
    if (asset) {
      setCurrentAsset({ ...asset });
      setCompanyNameSearchQuery(asset.name || ''); 
    } else {
      const prefilledCategory = (activeTab && activeTab !== 'overview') ? activeTab : 'stock';
      const newInitialState: Partial<ContextAsset> = {
        ...initialAssetFormState,
        category: prefilledCategory as AssetCategory,
        currency: 'USD',
      };
      if (prefilledCategory === 'bank' || prefilledCategory === 'property') {
        newInitialState.quantity = 1;
        delete newInitialState.purchasePrice;
        delete newInitialState.tickerSymbol;
      } else {
        newInitialState.quantity = 1;
        newInitialState.purchasePrice = 0;
        newInitialState.tickerSymbol = '';
      }
      setCurrentAsset(newInitialState);
      setCompanyNameSearchQuery(newInitialState.name || '');
    }
    setCompanyNameSuggestions([]);
    setShowCompanyNameSuggestionsPopover(false);
    setIsFormOpen(true);
  };

  const handleRefreshPrice = useCallback(async (asset: ContextAsset) => {
    if (!asset || !asset.id) {
      console.error("handleRefreshPrice called with invalid asset:", asset);
      return;
    }

    if (asset.category === 'bank' || asset.category === 'property') {
       // toast({ title: "Manual Update", description: `${asset.name} value is updated manually or via statements.`, variant: "default" });
        updateAssetPrice(asset.id, {
            currentPrice: asset.currentPrice || 0,
            previousClosePrice: asset.previousClosePrice || asset.currentPrice || 0,
            priceHistory: asset.priceHistory || [{ date: new Date().toISOString().split('T')[0], price: asset.currentPrice || 0 }],
            priceFetchError: "Manual value."
        });
      return;
    }

    if (!asset.tickerSymbol && (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund')) {
        const missingTickerError = `Ticker missing for ${asset.name}. Cannot refresh price. Please edit the asset and provide a name that can resolve to a ticker.`;
        // toast({title: "Ticker Missing", description: missingTickerError, variant: "destructive"});
        updateAssetPrice(asset.id, {
            currentPrice: asset.currentPrice || 0,
            previousClosePrice: asset.previousClosePrice || asset.currentPrice || 0,
            priceHistory: asset.priceHistory,
            priceFetchError: missingTickerError
        });
        return;
    }

    setIsFetchingPrice(prev => ({ ...prev, [asset.id!]: true }));
    let priceData;
    try {
      priceData = await fetchAssetPrice(asset.category, asset.tickerSymbol, asset.currency);
      updateAssetPrice(asset.id!, priceData);
      if (!priceData.priceFetchError?.toLowerCase().includes("error") && !priceData.priceFetchError?.toLowerCase().includes("failed")) {
        if (!(priceData.priceFetchError?.includes("mock data") || priceData.priceFetchError?.includes("Manual value."))) {
             // toast({ title: "Price Updated", description: `Price for ${asset.name} refreshed.` }); // Reduced toast frequency
        }
      }
    } catch (error) {
      let detailedError = "Could not refresh price due to an unknown error.";
      if (error instanceof Error) {
          detailedError = `Could not refresh price for ${asset.name}. Error: ${error.message}.`;
      }
      console.error("Failed to fetch price:", error);
      toast({ title: "Fetch Error", description: detailedError, variant: "destructive" });
      updateAssetPrice(asset.id!, {
        currentPrice: asset.currentPrice || 0,
        previousClosePrice: asset.previousClosePrice || asset.currentPrice || 0,
        priceHistory: asset.priceHistory,
        priceFetchError: detailedError
      });
    } finally {
      setIsFetchingPrice(prev => ({ ...prev, [asset.id!]: false }));
    }
  }, [toast, updateAssetPrice]);


  useEffect(() => {
    const performTabRefresh = async () => {
        if (activeTab === 'overview' || !activeTab || initialRefreshPerformedForTab[activeTab] || !allAssets.length) {
            return;
        }

        const assetsInTabToRefresh = allAssets.filter(asset =>
            asset.category === activeTab &&
            (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund') &&
            asset.tickerSymbol &&
            (!asset.lastPriceUpdate || (new Date().getTime() - new Date(asset.lastPriceUpdate).getTime() > STALE_PRICE_THRESHOLD_MS))
        );

        if (assetsInTabToRefresh.length > 0) {
            console.log(`Refreshing ${assetsInTabToRefresh.length} assets in tab ${activeTab}`);
            let refreshedCount = 0;
            for (const asset of assetsInTabToRefresh) {
                if (!isFetchingPrice[asset.id]) { // Check if not already fetching
                    await handleRefreshPrice(asset);
                    refreshedCount++;
                    if (refreshedCount < assetsInTabToRefresh.length) { // Add delay only if there are more assets to refresh
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
        }
        setInitialRefreshPerformedForTab(prev => ({ ...prev, [activeTab]: true }));
    };

    if (activeTab !== 'overview' && !isFetchingPrice[Object.keys(isFetchingPrice)[0]]) { // Check if not already fetching globally
      performTabRefresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allAssets, initialRefreshPerformedForTab, handleRefreshPrice]); // Removed isFetchingPrice from deps


  const handleSaveAsset = () => {
    if (!currentAsset || !companyNameSearchQuery || !currentAsset.category || !currentAsset.currency) {
      toast({ title: "Error", description: "Please fill name, category, and currency.", variant: "destructive" });
      return;
    }

    const isTrackableCategory = currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';
    
    const finalName = companyNameSearchQuery; // Always use companyNameSearchQuery as the source of truth for name
    const quantityToSave = (currentAsset.category === 'bank' || currentAsset.category === 'property') ? 1 : (Number(currentAsset.quantity) || 0);
    const finalTickerSymbol = isTrackableCategory ? currentAsset.tickerSymbol : undefined;


    if (isTrackableCategory) {
        if (!finalTickerSymbol) {
            toast({ title: "Error", description: "Ticker symbol is required for stocks, crypto, and mutual funds. Please select an asset name from the suggestions or ensure a valid ticker is present.", variant: "destructive" });
            return;
        }
         if (currentAsset.quantity === undefined || currentAsset.quantity <= 0) {
            toast({ title: "Error", description: "Quantity must be greater than zero for trackable assets.", variant: "destructive" });
            return;
        }
        if (currentAsset.purchasePrice === undefined || currentAsset.purchasePrice < 0) {
            toast({ title: "Error", description: "Purchase price must be zero or positive for trackable assets.", variant: "destructive" });
            return;
        }
    } else { // Bank or Property
        if (currentAsset.currentPrice === undefined || currentAsset.currentPrice < 0) {
            toast({ title: "Error", description: "Current value must be zero or positive for bank accounts and property.", variant: "destructive" });
            return;
        }
    }

    let addedAssetWithId: ContextAsset | undefined = undefined;

    if (currentAsset.id) {
      const payloadForUpdate: Partial<ContextAsset> & { id: string } = {
        id: currentAsset.id,
        name: finalName,
        category: currentAsset.category!,
        currency: currentAsset.currency!,
        quantity: quantityToSave,
      };
      if (isTrackableCategory) {
        payloadForUpdate.tickerSymbol = finalTickerSymbol;
        payloadForUpdate.purchasePrice = Number(currentAsset.purchasePrice) || 0;
      } else {
        payloadForUpdate.currentPrice = Number(currentAsset.currentPrice) || 0;
      }
      updateAsset(payloadForUpdate);
      toast({ title: "Asset Updated", description: `${payloadForUpdate.name} has been updated.` });
    } else {
      const newAssetPayload: Omit<ContextAsset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory' | 'priceFetchError' | 'currentPrice' | 'previousClosePrice'> & { purchasePrice?: number; currentPrice?: number; tickerSymbol?: string; } = {
        name: finalName,
        category: currentAsset.category!,
        currency: currentAsset.currency!,
        quantity: quantityToSave,
      };
      if (isTrackableCategory) {
        newAssetPayload.purchasePrice = Number(currentAsset.purchasePrice) || 0;
        newAssetPayload.tickerSymbol = finalTickerSymbol; 
      } else {
        newAssetPayload.currentPrice = Number(currentAsset.currentPrice) || 0;
      }
      addedAssetWithId = addAsset(newAssetPayload);
      toast({ title: "Asset Added", description: `${newAssetPayload.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentAsset(initialAssetFormState);
    setCompanyNameSearchQuery('');
    setCompanyNameSuggestions([]);
    setShowCompanyNameSuggestionsPopover(false);

    if (addedAssetWithId && isTrackableCategory && addedAssetWithId.tickerSymbol) {
        handleRefreshPrice(addedAssetWithId);
        if (addedAssetWithId.category) {
           setInitialRefreshPerformedForTab(prev => ({ ...prev, [addedAssetWithId!.category as string]: false }));
        }
    } else if (currentAsset.id && isTrackableCategory) { // For existing asset edit
        const existingAsset = allAssets.find(a => a.id === currentAsset.id);
        if (existingAsset && (existingAsset.tickerSymbol !== finalTickerSymbol || existingAsset.name !== finalName || existingAsset.currency !== currentAsset.currency)) {
             // Refresh price if critical identifiers changed
             handleRefreshPrice({...existingAsset, name: finalName, tickerSymbol: finalTickerSymbol, currency: currentAsset.currency!});
             if(existingAsset.category && existingAsset.category !== currentAsset.category){
                 setInitialRefreshPerformedForTab(prev => ({ ...prev, [existingAsset.category as string]: false, [currentAsset.category!]: false }));
             } else if (existingAsset.category){
                 setInitialRefreshPerformedForTab(prev => ({ ...prev, [existingAsset.category as string]: false }));
             }
        }
    }
  };

  const handleDeleteAsset = (id: string) => {
    deleteAssetFromContext(id);
    toast({ title: "Asset Deleted", description: `Asset has been removed.`, variant: "destructive" });
  };

  const formatCurrency = (value: number | undefined, currencyCode: string) => {
    if (value === undefined) return 'N/A';
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateTotals = useCallback((assetsToSummarize: ContextAsset[]) => {
    const totals: Record<string, {marketValue: number, dailyGain: number, allTimeGain: number, totalPurchaseCost: number }> = {};
    assetsToSummarize.forEach(asset => {
      if (!totals[asset.currency]) {
        totals[asset.currency] = { marketValue: 0, dailyGain: 0, allTimeGain: 0, totalPurchaseCost: 0 };
      }
      const marketValue = getAssetMarketValue(asset);
      totals[asset.currency].marketValue += marketValue;

      const isTrackableAsset = asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund';
      if (isTrackableAsset) {
        if (asset.currentPrice !== undefined && asset.previousClosePrice !== undefined) {
          totals[asset.currency].dailyGain += (asset.currentPrice - asset.previousClosePrice) * asset.quantity;
        }
        if (asset.currentPrice !== undefined && asset.purchasePrice !== undefined) {
          const purchaseCostForAsset = asset.purchasePrice * asset.quantity;
          totals[asset.currency].allTimeGain += (marketValue - purchaseCostForAsset);
          totals[asset.currency].totalPurchaseCost += purchaseCostForAsset;
        }
      }
    });
    return totals;
  }, [getAssetMarketValue]);

  const portfolioTotalsByCurrency = useMemo(() => calculateTotals(allAssets), [allAssets, calculateTotals]);

  const categorySpecificTotals = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      const filteredAssetsForTab = allAssets.filter(asset => asset.category === activeTab);
      return calculateTotals(filteredAssetsForTab);
    }
    return {};
  }, [allAssets, activeTab, calculateTotals]);


  const handleCategoryChange = (value: AssetCategory) => {
    const newState: Partial<ContextAsset> = { ...currentAsset, category: value };
    const isNewCategoryTrackable = value === 'stock' || value === 'crypto' || value === 'mutualfund';

    if (isNewCategoryTrackable) {
        setCompanyNameSearchQuery(currentAsset?.name || ''); 
        newState.purchasePrice = currentAsset?.purchasePrice === undefined ? 0 : currentAsset.purchasePrice;
        newState.quantity = (currentAsset?.quantity === undefined || (currentAsset.quantity === 1 && (currentAsset.category === 'bank' || currentAsset.category === 'property'))) ? 1 : currentAsset.quantity;
        newState.tickerSymbol = currentAsset?.tickerSymbol || ''; 
        delete newState.currentPrice;
    } else {
        newState.currentPrice = currentAsset?.currentPrice === undefined ? 0 : currentAsset.currentPrice;
        newState.quantity = 1;
        setCompanyNameSearchQuery(currentAsset?.name || ''); 
        delete newState.tickerSymbol;
        delete newState.purchasePrice;
    }
    setCurrentAsset(newState);
    setCompanyNameSuggestions([]);
    setShowCompanyNameSuggestionsPopover(false);
  };

  const debounce = <F extends (...args: any[]) => void>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const performCompanyNameSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 1) {
      setCompanyNameSuggestions([]);
      setShowCompanyNameSuggestionsPopover(false);
      return;
    }
    setIsCompanyNameSearching(true);
    try {
      const results = await searchTickerSymbols(query);
      setCompanyNameSuggestions(results);
      setShowCompanyNameSuggestionsPopover(results.length > 0 || query.trim().length > 0);
    } catch (error) {
      console.error("Company name search failed:", error);
      setCompanyNameSuggestions([]);
      setShowCompanyNameSuggestionsPopover(query.trim().length > 0); // Keep popover open to show no results
      toast({ title: "Search Error", description: "Could not fetch company/asset suggestions.", variant: "destructive" });
    } finally {
      setIsCompanyNameSearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCompanyNameSearch = useCallback(debounce(performCompanyNameSearch, 500), [performCompanyNameSearch]);

  const handleCompanyNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCompanyNameSearchQuery(query); // Update the local state for the input field

    // If the user is typing a new name, and a ticker was previously auto-filled or set,
    // it's best to clear the ticker in currentAsset as it might no longer be valid.
    // currentAsset.name itself should not be updated here to avoid input focus issues.
    // It will be updated either by suggestion click or on save from companyNameSearchQuery.
    if (currentAsset?.tickerSymbol) { // Only update if a ticker was previously set
        setCurrentAsset(prev => ({ ...prev!, tickerSymbol: '' }));
    }

    if (query.trim().length > 0 && isCurrentAssetTrackable) {
      debouncedCompanyNameSearch(query);
    } else {
      setCompanyNameSuggestions([]);
      setShowCompanyNameSuggestionsPopover(false);
    }
  };


  const handleCompanyNameSuggestionClick = (suggestion: TickerSuggestion) => {
    setCompanyNameSearchQuery(suggestion.name);
    setCurrentAsset(prev => ({
      ...prev,
      name: suggestion.name, // Set currentAsset.name directly from suggestion
      tickerSymbol: suggestion.symbol.toUpperCase(),
    }));
    setCompanyNameSuggestions([]);
    setShowCompanyNameSuggestionsPopover(false);
  };


  const AssetCardComponent = ({ asset }: { asset: ContextAsset }) => {
    const marketValue = getAssetMarketValue(asset);
    const isTrackableAsset = asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund';

    const [clientFormattedLastPriceUpdate, setClientFormattedLastPriceUpdate] = useState<string | null>(null);
    const [clientFormattedLastUpdated, setClientFormattedLastUpdated] = useState<string | null>(null);

    useEffect(() => {
      let priceUpdateText: string | null = null;
      if (asset.lastPriceUpdate) {
        priceUpdateText = `Price as of: ${new Date(asset.lastPriceUpdate).toLocaleTimeString()} ${new Date(asset.lastPriceUpdate).toLocaleDateString()}`;
      } else if (isTrackableAsset) {
        priceUpdateText = 'Price not yet updated';
      }
      setClientFormattedLastPriceUpdate(priceUpdateText);

      let detailsSavedText: string | null = null;
      if (asset.lastUpdated) {
        detailsSavedText = `Details last saved: ${new Date(asset.lastUpdated).toLocaleDateString()}`;
      }
      setClientFormattedLastUpdated(detailsSavedText);

    }, [asset.lastPriceUpdate, asset.lastUpdated, isTrackableAsset]);


    let dailyGainLoss = 0;
    let dailyGainLossPercent = 0;
    if (isTrackableAsset && asset.currentPrice !== undefined && asset.previousClosePrice !== undefined && asset.previousClosePrice !== 0) {
      dailyGainLoss = (asset.currentPrice - asset.previousClosePrice) * asset.quantity;
      dailyGainLossPercent = ((asset.currentPrice - asset.previousClosePrice) / asset.previousClosePrice) * 100;
    }

    let allTimeGainLoss = 0;
    let allTimeGainLossPercent = 0;
    if (isTrackableAsset && asset.currentPrice !== undefined && asset.purchasePrice !== undefined && asset.purchasePrice !== undefined) {
      allTimeGainLoss = (asset.currentPrice - asset.purchasePrice) * asset.quantity;
      const totalPurchaseCostForAsset = asset.purchasePrice * asset.quantity;
       if (totalPurchaseCostForAsset !== 0) {
         allTimeGainLossPercent = (allTimeGainLoss / totalPurchaseCostForAsset) * 100;
       } else if (allTimeGainLoss !== 0) { // If purchase cost is 0 but there's a gain (e.g. airdrop)
         allTimeGainLossPercent = allTimeGainLoss > 0 ? Infinity : -Infinity;
       }
    }

    return (
      <Card className="rounded-2xl shadow-lg flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            <CardDescription className="capitalize">
              {categoryDisplayNames[asset.category]} {asset.tickerSymbol && `(${asset.tickerSymbol})`} - {asset.currency}
            </CardDescription>
          </div>
          {assetIcons[asset.category]}
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="space-y-1">
            <p className="text-2xl font-semibold">{formatCurrency(marketValue, asset.currency)}</p>
            {isTrackableAsset && asset.currentPrice !== undefined && (
              <p className="text-xs text-muted-foreground">
                {asset.quantity.toLocaleString()} { asset.category === 'stock' ? 'shares' : asset.category === 'crypto' ? 'coins' : 'units'} @ {formatCurrency(asset.currentPrice, asset.currency)}/unit
              </p>
            )}
             {!isTrackableAsset && (
              <p className="text-xs text-muted-foreground">
                Current Value
              </p>
            )}
          </div>

          {isTrackableAsset && (
            <>
              <div className="text-sm">
                <span className="font-medium">Daily: </span>
                <span className={dailyGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {dailyGainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                  {dailyGainLoss >= 0 ? '+' : ''}{formatCurrency(dailyGainLoss, asset.currency)} ({!isNaN(dailyGainLossPercent) && isFinite(dailyGainLossPercent) ? dailyGainLossPercent.toFixed(2) : '0.00'}%)
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">All-Time: </span>
                <span className={allTimeGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {allTimeGainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                  {allTimeGainLoss >= 0 ? '+' : ''}{formatCurrency(allTimeGainLoss, asset.currency)} ({!isNaN(allTimeGainLossPercent) && isFinite(allTimeGainLossPercent) ? allTimeGainLossPercent.toFixed(2) : (asset.purchasePrice === 0 && allTimeGainLoss !== 0 ? "N/A" : "0.00")}%)
                </span>
              </div>
               {asset.purchasePrice !== undefined && (
                 <p className="text-xs text-muted-foreground">
                   Purchase Price: {formatCurrency(asset.purchasePrice, asset.currency)}/unit
                 </p>
               )}
            </>
          )}
           {asset.priceHistory && asset.priceHistory.length > 0 && isTrackableAsset && (
            <div className="h-[100px] mt-2">
              <ChartContainer config={chartConfigBase} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={asset.priceHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickMargin={5} />
                    <YAxis tickFormatter={(value) => `${asset.currency === 'USD' ? '$' : asset.currency === 'EUR' ? '€' : asset.currency === 'INR' ? '₹' : asset.currency}${value.toFixed(0)}`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickMargin={5} domain={['dataMin - (dataMax-dataMin)*0.1', 'dataMax + (dataMax-dataMin)*0.1']}/>
                    <ChartTooltip
                      cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground))' }}
                      content={<ChartTooltipContent indicator="dot" nameKey="price" />}
                    />
                    <Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            {clientFormattedLastPriceUpdate !== null
              ? clientFormattedLastPriceUpdate
              : (isTrackableAsset && asset.lastPriceUpdate === undefined ? "Loading price date..." : "")
            }
            {(clientFormattedLastPriceUpdate && clientFormattedLastPriceUpdate.trim() !== "" && clientFormattedLastUpdated && clientFormattedLastUpdated.trim() !== "") && <br />}
            {clientFormattedLastUpdated !== null
              ? clientFormattedLastUpdated
              : (asset.lastUpdated ? "Loading save date..." : "")
            }
          </p>
          {asset.priceFetchError && (
            <p className="text-xs text-destructive mt-1 flex items-center">
              <AlertTriangle className="inline h-3 w-3 mr-1 shrink-0" />
              <span className="break-words">{asset.priceFetchError}</span>
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-2">
            {isTrackableAsset && (
            <Button variant="outline" size="sm" onClick={() => handleRefreshPrice(asset)} disabled={isFetchingPrice[asset.id]}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingPrice[asset.id] ? 'animate-spin' : ''}`} /> Refresh
            </Button>
           )}
           <div className={`flex justify-end gap-1 ${!isTrackableAsset ? 'w-full' : ''}`}>
              <Button variant="ghost" size="icon" onClick={() => openForm(asset)} aria-label="Edit asset">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id)} aria-label="Delete asset">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
           </div>
        </CardFooter>
      </Card>
    );
  };

  const assetLabelMap: Record<AssetCategory, { name: string, quantity: string, purchasePrice: string }> = {
    stock: { name: "Company Name", quantity: "Number of Shares", purchasePrice: "Purchase Price per Share" },
    crypto: { name: "Cryptocurrency Name", quantity: "Quantity Owned", purchasePrice: "Purchase Price per Unit" },
    mutualfund: { name: "Fund Name", quantity: "Units Held", purchasePrice: "Purchase Price per Unit" },
    bank: { name: "Account Nickname", quantity: "N/A", purchasePrice: "N/A" }, // Not used directly in form for these, but good for consistency
    property: { name: "Property Name", quantity: "N/A", purchasePrice: "N/A" },
  };

  const currentAssetLabels = assetLabelMap[currentAsset?.category || 'stock'];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and net worth across different categories.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) {
                setCurrentAsset(initialAssetFormState);
                setCompanyNameSearchQuery('');
                setCompanyNameSuggestions([]);
                setShowCompanyNameSuggestionsPopover(false);
            }
        }}>
        <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
            <DialogTitle>{currentAsset?.id ? 'Edit Asset' : `Add New ${activeTab && activeTab !== 'overview' ? categoryDisplayNames[activeTab as AssetCategory].slice(0,-1) : 'Asset'}`}</DialogTitle>
            <DialogDescription>
                Enter the details for your asset. Click "Save Asset" when done.
                <span className="block text-xs mt-1 text-muted-foreground">Global currency settings and auto-conversion are planned for a future update.</span>
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">{currentAssetLabels.name}</Label>
                 <div className="col-span-3">
                    <Popover open={showCompanyNameSuggestionsPopover && isCurrentAssetTrackable} onOpenChange={setShowCompanyNameSuggestionsPopover}>
                        <PopoverTrigger asChild>
                            <Input
                                id="name"
                                value={companyNameSearchQuery}
                                onChange={handleCompanyNameInputChange}
                                onFocus={() => {
                                    if (companyNameSearchQuery.trim().length > 0 && companyNameSuggestions.length > 0 && isCurrentAssetTrackable) {
                                      setShowCompanyNameSuggestionsPopover(true);
                                    }
                                }}
                                placeholder={isCurrentAssetTrackable ? `Type to search ${currentAsset?.category || 'asset'}...` : `e.g. ${currentAsset?.category === 'bank' ? 'Main Savings' : 'Downtown Condo'}`}
                             />
                        </PopoverTrigger>
                         <PopoverContent
                            className="w-[--radix-popover-trigger-width] p-0"
                            side="bottom"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            {isCompanyNameSearching && (
                                <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                                </div>
                            )}
                            {!isCompanyNameSearching && companyNameSuggestions.length === 0 && companyNameSearchQuery.length > 0 && isCurrentAssetTrackable && (
                                <div className="p-2 text-sm text-muted-foreground text-center">No results found. Try different keywords or check for typos.</div>
                            )}
                            {!isCompanyNameSearching && companyNameSuggestions.length > 0 && isCurrentAssetTrackable && (
                                <div className="max-h-48 overflow-y-auto">
                                    {companyNameSuggestions.map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            className="w-full justify-start p-2 text-left h-auto rounded-none"
                                            onClick={() => handleCompanyNameSuggestionClick(suggestion)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{suggestion.symbol}</span>
                                                <span className="text-xs text-muted-foreground">{suggestion.name}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                     {isCurrentAssetTrackable && currentAsset?.tickerSymbol && (
                        <p className="text-xs text-muted-foreground mt-1">Selected Ticker: <span className="font-semibold">{currentAsset.tickerSymbol}</span></p>
                    )}
                    {isCurrentAssetTrackable && (
                         <p className="text-xs text-muted-foreground mt-1">
                            <Search className="inline h-3 w-3 mr-1" />
                            For Stocks, Crypto, Mutual Funds: Type name to search and auto-fill ticker.
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={currentAsset?.category || 'stock'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select asset category" />
                </SelectTrigger>
                <SelectContent>
                    {assetCategories.map(cat => <SelectItem key={cat} value={cat}>{categoryDisplayNames[cat]}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">Currency</Label>
                <Select value={currentAsset?.currency || 'USD'} onValueChange={(value) => setCurrentAsset({...currentAsset, currency: value })}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                    {supportedCurrencies.map(curr => <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>

            {(currentAsset?.category !== 'bank' && currentAsset?.category !== 'property') && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">{currentAssetLabels.quantity}</Label>
                    <Input id="quantity" type="number" value={currentAsset?.quantity === undefined ? '' : currentAsset.quantity} onChange={(e) => setCurrentAsset({...currentAsset, quantity: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder={currentAsset?.category === 'stock' ? 'e.g. 10' : currentAsset?.category === 'crypto' ? 'e.g. 0.5' : 'e.g. 100'}/>
                </div>
            )}

            {isCurrentAssetTrackable && (
                <>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">{currentAssetLabels.purchasePrice}</Label>
                    <Input id="purchasePrice" type="number" value={currentAsset?.purchasePrice === undefined ? '' : currentAsset.purchasePrice} onChange={(e) => setCurrentAsset({...currentAsset, purchasePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Price per unit at purchase" />
                </div>
                </>
            )}
            {!isCurrentAssetTrackable && (currentAsset?.category === 'bank' || currentAsset?.category === 'property') && (
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentValue" className="text-right">{currentAsset?.category === 'bank' ? 'Current Balance' : 'Current Estimated Value'}</Label>
                <Input id="currentValue" type="number" value={currentAsset?.currentPrice === undefined ? '' : currentAsset.currentPrice} onChange={(e) => setCurrentAsset({...currentAsset, currentPrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Total current value" />
                </div>
            )}
            </div>
            <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
                setIsFormOpen(false);
                setCurrentAsset(initialAssetFormState);
                setCompanyNameSearchQuery('');
                setCompanyNameSuggestions([]);
                setShowCompanyNameSuggestionsPopover(false);
            }}>Cancel</Button>
            <Button type="submit" onClick={handleSaveAsset}>Save Asset</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4">
            <TabsTrigger value="overview">{categoryDisplayNames['overview']}</TabsTrigger>
            {assetCategories.map(cat => (
                <TabsTrigger key={cat} value={cat}>{categoryDisplayNames[cat]}</TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="overview">
            <Card className="rounded-2xl shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Portfolio Snapshot</CardTitle>
                    <Coins className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {Object.keys(portfolioTotalsByCurrency).length === 0 && <p className="text-muted-foreground">No assets to display totals for. Add some assets to get started.</p>}
                    {Object.entries(portfolioTotalsByCurrency).map(([currency, totalData]) => {
                        const allTimeGainLossPercent = totalData.totalPurchaseCost > 0
                            ? (totalData.allTimeGain / totalData.totalPurchaseCost) * 100
                            : (totalData.allTimeGain !== 0 ? Infinity : 0);
                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total Portfolio)</span>
                            </p>
                            {(totalData.dailyGain !== 0) && (
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">Daily Gain/Loss:</span>
                                <span className={totalData.dailyGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {totalData.dailyGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                    {totalData.dailyGain >= 0 ? '+' : ''}{formatCurrency(totalData.dailyGain, currency)}
                                </span>
                                </div>
                            )}
                            {(totalData.allTimeGain !== 0) && (
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">All-Time Gain/Loss:</span>
                                <span className={totalData.allTimeGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {totalData.allTimeGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                    {totalData.allTimeGain >= 0 ? '+' : ''}{formatCurrency(totalData.allTimeGain, currency)}
                                    {(!isNaN(allTimeGainLossPercent) && isFinite(allTimeGainLossPercent))
                                    ? ` (${allTimeGainLossPercent.toFixed(2)}%)`
                                    : (totalData.totalPurchaseCost === 0 && totalData.allTimeGain !== 0 ? ` (N/A %)` : ` (0.00%)`)}
                                </span>
                                </div>
                            )}
                            </div>
                        );
                    })}
                </CardContent>
                 {allAssets.length === 0 && (
                    <CardContent className="pt-0">
                        <div className="text-center text-muted-foreground py-4">
                            <WalletCards className="mx-auto h-12 w-12 mb-4 text-primary" />
                            <p className="text-lg font-semibold">No assets yet!</p>
                            <p>Click "Add Asset" above to start building your portfolio.</p>
                        </div>
                    </CardContent>
                )}
                 {allAssets.length > 0 && Object.keys(portfolioTotalsByCurrency).length === 0 && (
                     <CardContent className="pt-0">
                         <p className="text-muted-foreground">Error calculating portfolio totals. Please check asset data.</p>
                     </CardContent>
                 )}
            </Card>
        </TabsContent>

        {assetCategories.map(category => (
            <TabsContent key={category} value={category}>
                <Card className="rounded-2xl shadow-lg mb-6">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>{categoryDisplayNames[category]} Summary</CardTitle>
                    {assetIcons[category] ? React.cloneElement(assetIcons[category] as React.ReactElement, { className: "h-5 w-5 text-muted-foreground" }) : <Coins className="h-5 w-5 text-muted-foreground" />}
                    </CardHeader>
                    <CardContent>
                    {Object.keys(categorySpecificTotals).length === 0 && allAssets.filter(a => a.category === category).length === 0 && <p className="text-muted-foreground">No assets in this category. Add one using the "Add Asset" button.</p>}
                    {Object.entries(categorySpecificTotals).map(([currency, totalData]) => {
                        const allTimeGainLossPercent = totalData.totalPurchaseCost > 0
                            ? (totalData.allTimeGain / totalData.totalPurchaseCost) * 100
                            : (totalData.allTimeGain !== 0 ? Infinity : 0);
                        const isTrackableCategoryForTab = category === 'stock' || category === 'crypto' || category === 'mutualfund';

                        const assetsInThisCurrencyAndCategory = allAssets.filter(a => a.category === category && a.currency === currency);
                        if (assetsInThisCurrencyAndCategory.length === 0 && totalData.marketValue === 0) {
                            return null;
                        }

                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total {categoryDisplayNames[category].toLowerCase()})</span>
                            </p>
                            {isTrackableCategoryForTab && (
                                <>
                                    {(totalData.dailyGain !== 0) && (
                                        <div className="text-sm flex items-center mt-1">
                                        <span className="text-muted-foreground mr-1">Daily Gain/Loss:</span>
                                        <span className={totalData.dailyGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                            {totalData.dailyGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                            {totalData.dailyGain >= 0 ? '+' : ''}{formatCurrency(totalData.dailyGain, currency)}
                                        </span>
                                        </div>
                                    )}
                                    {(totalData.allTimeGain !== 0) && (
                                        <div className="text-sm flex items-center mt-1">
                                        <span className="text-muted-foreground mr-1">All-Time Gain/Loss:</span>
                                        <span className={totalData.allTimeGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                            {totalData.allTimeGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                            {totalData.allTimeGain >= 0 ? '+' : ''}{formatCurrency(totalData.allTimeGain, currency)}
                                            {(!isNaN(allTimeGainLossPercent) && isFinite(allTimeGainLossPercent))
                                            ? ` (${allTimeGainLossPercent.toFixed(2)}%)`
                                            : (totalData.totalPurchaseCost === 0 && totalData.allTimeGain !== 0 ? ` (N/A %)` : ` (0.00%)`)}
                                        </span>
                                        </div>
                                    )}
                                </>
                            )}
                            </div>
                        );
                    })}
                     {allAssets.filter(a => a.category === category).length === 0 && (
                        <p className="text-muted-foreground">No assets in this category yet. Add one using the button above.</p>
                    )}
                    </CardContent>
                </Card>

                {displayedAssets.length === 0 && activeTab === category && (
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="pt-6 text-center text-muted-foreground">
                             {assetIcons[category] ? React.cloneElement(assetIcons[category] as React.ReactElement, { className: "mx-auto h-12 w-12 mb-4 text-primary" }) : <WalletCards className="mx-auto h-12 w-12 mb-4 text-primary" />}
                            <p className="text-lg font-semibold">No {categoryDisplayNames[category].toLowerCase()} added yet!</p>
                            <p>Use the "Add Asset" button above to track your {categoryDisplayNames[category].toLowerCase()}.</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-1">
                    {displayedAssets.map((asset) => (
                        <AssetCardComponent key={asset.id} asset={asset} />
                    ))}
                </div>
                 {displayedAssets.length > 0 && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    <Info className="inline h-3 w-3 mr-1" />
                    Price history charts show mock data. Real-time price fetching may use mock data if API limits are reached or for unsupported assets.
                    Price fetch errors or status messages are displayed on each asset card.
                  </div>
                )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

