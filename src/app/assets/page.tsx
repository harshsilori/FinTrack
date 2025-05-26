
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2, TrendingUp, RefreshCcw, WalletCards, TrendingDown, Coins, Info, ExternalLink, AlertTriangle, Search, Loader2 } from 'lucide-react';
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

  const [tickerSearchQuery, setTickerSearchQuery] = useState('');
  const [tickerSuggestions, setTickerSuggestions] = useState<TickerSuggestion[]>([]);
  const [isTickerSearching, setIsTickerSearching] = useState(false);
  const [showTickerSuggestionsPopover, setShowTickerSuggestionsPopover] = useState(false);

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
  };

  const displayedAssets = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      return allAssets.filter(asset => asset.category === activeTab);
    }
    return []; // No assets displayed directly in "Overview" tab, only the summary
  }, [allAssets, activeTab]);

  const isCurrentAssetTrackable = useMemo(() => {
    if (!currentAsset || !currentAsset.category) return false;
    return currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';
  }, [currentAsset]);

  const openForm = (asset?: ContextAsset) => {
    if (asset) {
      setCurrentAsset({ ...asset });
      setTickerSearchQuery(asset.tickerSymbol || '');
    } else {
      const prefilledCategory = (activeTab && activeTab !== 'overview') ? activeTab : 'stock';
      const newInitialState = {
        ...initialAssetFormState,
        category: prefilledCategory as AssetCategory,
        quantity: (prefilledCategory === 'bank' || prefilledCategory === 'property') ? 1 : 1,
        purchasePrice: (prefilledCategory === 'bank' || prefilledCategory === 'property') ? undefined : 0,
        tickerSymbol: (prefilledCategory === 'bank' || prefilledCategory === 'property') ? undefined : '',
      }
      setCurrentAsset(newInitialState);
      setTickerSearchQuery(newInitialState.tickerSymbol || '');
    }
    setTickerSuggestions([]);
    setShowTickerSuggestionsPopover(false);
    setIsFormOpen(true);
  };

  const handleRefreshPrice = useCallback(async (asset: ContextAsset) => {
    if (asset.category === 'bank' || asset.category === 'property') {
      toast({ title: "Manual Update", description: `${asset.name} value is updated manually or via statements.`, variant: "default" });
      updateAssetPrice(asset.id, {
        currentPrice: asset.currentPrice || 0,
        previousClosePrice: asset.previousClosePrice || asset.currentPrice || 0,
        priceHistory: asset.priceHistory || [{ date: new Date().toISOString().split('T')[0], price: asset.currentPrice || 0 }],
        priceFetchError: "Manual value."
      });
      return;
    }

    if (!asset.tickerSymbol && (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund')) {
        const missingTickerError = `Ticker missing for ${asset.name}. Cannot refresh price.`;
        toast({title: "Ticker Missing", description: missingTickerError, variant: "destructive"});
        updateAssetPrice(asset.id, {
            currentPrice: asset.currentPrice || 0,
            previousClosePrice: asset.previousClosePrice || asset.currentPrice || 0,
            priceHistory: asset.priceHistory,
            priceFetchError: missingTickerError
        });
        return;
    }

    setIsFetchingPrice(prev => ({ ...prev, [asset.id]: true }));
    let priceData;
    try {
      priceData = await fetchAssetPrice(asset.category, asset.tickerSymbol, asset.currency);
      updateAssetPrice(asset.id, priceData);
      // Only toast if there's no significant error from the fetch itself
      // Minor notes like "Using mock data" are fine to show without a toast here, they appear on card
      if (!priceData.priceFetchError?.toLowerCase().includes("error") && !priceData.priceFetchError?.toLowerCase().includes("failed")) {
        // Avoid toast for "Using mock data" or "Manual value" during auto-refresh
        if (!(priceData.priceFetchError?.includes("mock data") || priceData.priceFetchError?.includes("Manual value"))) {
             toast({ title: "Price Updated", description: `Price for ${asset.name} refreshed.` });
        }
      } else if (priceData.priceFetchError) {
        toast({ title: "Info", description: `Price for ${asset.name}: ${priceData.priceFetchError}`, variant: "default" });
      }
    } catch (error) {
      let detailedError = "Could not refresh price due to an unknown error.";
      if (error instanceof Error) {
          detailedError = `Could not refresh price for ${asset.name}. Error: ${error.message}.`;
      }
      console.error("Failed to fetch price:", error);
      toast({ title: "Fetch Error", description: detailedError, variant: "destructive" });
      updateAssetPrice(asset.id, {
        currentPrice: asset.currentPrice || 0,
        previousClosePrice: asset.previousClosePrice || asset.currentPrice || 0,
        priceHistory: asset.priceHistory,
        priceFetchError: detailedError
      });
    } finally {
      setIsFetchingPrice(prev => ({ ...prev, [asset.id]: false }));
    }
  }, [toast, updateAssetPrice]); // updateAssetPrice is from context, toast from hook, both stable


  useEffect(() => {
    const performTabRefresh = async () => {
        if (activeTab === 'overview' || !activeTab || initialRefreshPerformedForTab[activeTab]) {
            return;
        }

        const assetsInTabToRefresh = allAssets.filter(asset =>
            asset.category === activeTab &&
            (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund') &&
            asset.tickerSymbol &&
            (!asset.lastPriceUpdate || (new Date().getTime() - new Date(asset.lastPriceUpdate).getTime() > STALE_PRICE_THRESHOLD_MS))
        );

        if (assetsInTabToRefresh.length > 0) {
            for (const asset of assetsInTabToRefresh) {
                if (!isFetchingPrice[asset.id]) { // Check if this specific asset is already fetching
                    await handleRefreshPrice(asset);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Stagger API calls
                }
            }
        }
        setInitialRefreshPerformedForTab(prev => ({ ...prev, [activeTab]: true }));
    };

    if (allAssets.length > 0 && activeTab !== 'overview') {
        performTabRefresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allAssets, handleRefreshPrice, initialRefreshPerformedForTab]); // isFetchingPrice removed, handleRefreshPrice memoized


  const handleSaveAsset = () => {
    if (!currentAsset || !currentAsset.name || !currentAsset.category || !currentAsset.currency) {
      toast({ title: "Error", description: "Please fill name, category, and currency.", variant: "destructive" });
      return;
    }

    const isTrackableCategory = currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';

    if (currentAsset.quantity === undefined || currentAsset.quantity <= 0) {
        if (currentAsset.category !== 'bank' && currentAsset.category !== 'property') {
            toast({ title: "Error", description: "Quantity must be greater than zero for trackable assets.", variant: "destructive" });
            return;
        }
    }

    const quantityToSave = (currentAsset.category === 'bank' || currentAsset.category === 'property') ? 1 : (Number(currentAsset.quantity) || 0);
    // Use tickerSearchQuery as the source of truth for the ticker symbol when saving
    const finalTickerSymbol = isTrackableCategory ? tickerSearchQuery.toUpperCase() : undefined;


    if (isTrackableCategory) {
        if (!finalTickerSymbol) {
            toast({ title: "Error", description: "Ticker symbol is required for stocks, crypto, and mutual funds.", variant: "destructive" });
            return;
        }
        if (currentAsset.purchasePrice === undefined || currentAsset.purchasePrice < 0) {
            toast({ title: "Error", description: "Purchase price must be zero or positive for trackable assets.", variant: "destructive" });
            return;
        }
    } else {
        if (currentAsset.currentPrice === undefined || currentAsset.currentPrice < 0) {
            toast({ title: "Error", description: "Current value must be zero or positive for bank accounts and property.", variant: "destructive" });
            return;
        }
    }

    let addedAssetWithId: ContextAsset | undefined = undefined;

    if (currentAsset.id) {
      const payloadForUpdate: Partial<ContextAsset> & { id: string } = {
        id: currentAsset.id,
        name: currentAsset.name!,
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
        name: currentAsset.name!,
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
      addedAssetWithId = addAsset(newAssetPayload); // addAsset now returns the asset
      toast({ title: "Asset Added", description: `${newAssetPayload.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentAsset(initialAssetFormState);
    setTickerSearchQuery('');
    setTickerSuggestions([]);

    if (addedAssetWithId && isTrackableCategory && addedAssetWithId.tickerSymbol) {
        // Trigger initial refresh for the new asset
        handleRefreshPrice(addedAssetWithId);
        // Mark its tab as needing a fresh check if user navigates there
        if (addedAssetWithId.category) {
           setInitialRefreshPerformedForTab(prev => ({ ...prev, [addedAssetWithId!.category as string]: false }));
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
        newState.tickerSymbol = currentAsset?.tickerSymbol || '';
        setTickerSearchQuery(currentAsset?.tickerSymbol || ''); // Keep ticker search query consistent
        newState.purchasePrice = currentAsset?.purchasePrice === undefined ? 0 : currentAsset.purchasePrice;
        newState.quantity = currentAsset?.quantity === undefined || currentAsset.quantity === 1 ? 1 : currentAsset.quantity; // Default quantity if undefined
        // Remove currentPrice if switching from non-trackable to trackable
        if (currentAsset?.category === 'bank' || currentAsset?.category === 'property') {
          delete newState.currentPrice;
        }
    } else { // Bank or Property
        newState.currentPrice = currentAsset?.currentPrice === undefined ? 0 : currentAsset.currentPrice;
        newState.quantity = 1; // Quantity is always 1 for bank/property
        delete newState.tickerSymbol;
        setTickerSearchQuery(''); // Clear ticker search query
        delete newState.purchasePrice;
    }
    setCurrentAsset(newState);
    setTickerSuggestions([]); // Clear suggestions when category changes
    setShowTickerSuggestionsPopover(false);
  };

  // Debounce function
  const debounce = <F extends (...args: any[]) => void>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const performTickerSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 1) {
      setTickerSuggestions([]);
      setShowTickerSuggestionsPopover(false);
      return;
    }
    setIsTickerSearching(true);
    try {
      const results = await searchTickerSymbols(query);
      setTickerSuggestions(results);
    } catch (error) {
      console.error("Ticker search failed:", error);
      setTickerSuggestions([]);
      toast({ title: "Search Error", description: "Could not fetch ticker suggestions.", variant: "destructive" });
    } finally {
      setIsTickerSearching(false);
      setShowTickerSuggestionsPopover(true);
    }
  }, [toast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedTickerSearch = useCallback(debounce(performTickerSearch, 500), [performTickerSearch]);

  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTickerSearchQuery(query);
    // Removed: setCurrentAsset(prev => ({ ...prev, tickerSymbol: query.toUpperCase() }));
    // This direct update to currentAsset.tickerSymbol was likely causing input issues.
    // tickerSearchQuery is now the source of truth for the input, and used on save.
    // currentAsset.tickerSymbol is updated when a suggestion is clicked or on form initialization.
    if (query.trim().length > 0) {
      debouncedTickerSearch(query);
    } else {
      setTickerSuggestions([]);
      setShowTickerSuggestionsPopover(false);
    }
  };

  const handleSuggestionClick = (suggestion: TickerSuggestion) => {
    setCurrentAsset(prev => ({
      ...prev,
      tickerSymbol: suggestion.symbol, // Set the ticker in currentAsset
      name: prev?.name || suggestion.name, // Optionally prefill name
    }));
    setTickerSearchQuery(suggestion.symbol); // Update the input field display
    setTickerSuggestions([]);
    setShowTickerSuggestionsPopover(false);
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
    if (isTrackableAsset && asset.currentPrice !== undefined && asset.purchasePrice !== undefined && asset.purchasePrice !== 0) {
      allTimeGainLoss = (asset.currentPrice - asset.purchasePrice) * asset.quantity;
      const totalPurchaseCostForAsset = asset.purchasePrice * asset.quantity;
       if (totalPurchaseCostForAsset !== 0) {
         allTimeGainLossPercent = (allTimeGainLoss / totalPurchaseCostForAsset) * 100;
       } else if (allTimeGainLoss !== 0) { // Gain exists but purchase cost was 0
         allTimeGainLossPercent = allTimeGainLoss > 0 ? Infinity : -Infinity; // Or handle as N/A
       }
    }

    return (
      <Card className="rounded-2xl shadow-lg flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            <CardDescription className="capitalize">
              {asset.category} {asset.tickerSymbol && `(${asset.tickerSymbol})`} - {asset.currency}
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
            <p className="text-xs text-destructive mt-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              {asset.priceFetchError}
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

  const assetLabelMap: Record<AssetCategory, { name: string, quantity: string, purchasePrice: string, ticker: string }> = {
    stock: { name: "Company Name", quantity: "Number of Shares", purchasePrice: "Purchase Price per Share", ticker: "Ticker Symbol (e.g. AAPL, GOOG)" },
    crypto: { name: "Cryptocurrency Name", quantity: "Quantity Owned", purchasePrice: "Purchase Price per Unit", ticker: "Symbol (e.g. BTC, ETH)" },
    mutualfund: { name: "Fund Name", quantity: "Units Held", purchasePrice: "Purchase Price per Unit", ticker: "Symbol (e.g. VTSAX)" },
    bank: { name: "Account Nickname", quantity: "N/A", purchasePrice: "N/A", ticker: "N/A" },
    property: { name: "Property Name", quantity: "N/A", purchasePrice: "N/A", ticker: "N/A" },
  };

  const currentAssetLabels = assetLabelMap[currentAsset?.category || 'stock'];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Assets</h1>
          <p className="text-muted-foreground">
            Track your investments and net worth across different categories.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) {
                setCurrentAsset(initialAssetFormState);
                setTickerSearchQuery('');
                setTickerSuggestions([]);
                setShowTickerSuggestionsPopover(false);
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
                <Input id="name" value={currentAsset?.name || ''} onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value })} placeholder={`e.g. ${currentAsset?.category === 'bank' ? 'Main Savings' : currentAsset?.category === 'property' ? 'Downtown Condo' : currentAsset?.category === 'stock' ? 'Apple Inc.' : currentAsset?.category === 'crypto' ? 'Bitcoin' : 'Vanguard S&P 500 ETF'}`} />
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
                    <Label htmlFor="tickerSymbol" className="text-right">{currentAssetLabels.ticker}</Label>
                    <div className="col-span-3">
                    <Popover open={showTickerSuggestionsPopover && tickerSearchQuery.length > 0} onOpenChange={(isOpen) => {
                        // Prevent closing when clicking on the input itself or suggestions
                        if (!isOpen) {
                           // Delay hiding to allow click on suggestions
                           setTimeout(() => setShowTickerSuggestionsPopover(false), 100);
                        }
                    }}>
                        <PopoverTrigger asChild>
                            <Input
                                id="tickerSymbol"
                                value={tickerSearchQuery}
                                onChange={handleTickerInputChange}
                                onFocus={() => {
                                    if(tickerSearchQuery.trim().length > 0 && tickerSuggestions.length > 0) {
                                        setShowTickerSuggestionsPopover(true);
                                    }
                                }}
                                placeholder={currentAsset?.category === 'stock' ? 'e.g. AAPL' : currentAsset?.category === 'crypto' ? 'e.g. BTCUSD' : 'e.g. VOO'}
                             />
                        </PopoverTrigger>
                         <PopoverContent className="w-[--radix-popover-trigger-width] p-0" side="bottom" align="start">
                            {isTickerSearching && (
                                <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                                </div>
                            )}
                            {!isTickerSearching && tickerSuggestions.length === 0 && tickerSearchQuery.length > 0 && (
                                <div className="p-2 text-sm text-muted-foreground text-center">No results found.</div>
                            )}
                            {!isTickerSearching && tickerSuggestions.length > 0 && (
                                <div className="max-h-48 overflow-y-auto">
                                    {tickerSuggestions.map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="ghost"
                                            className="w-full justify-start p-2 text-left h-auto rounded-none"
                                            onClick={() => handleSuggestionClick(suggestion)}
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
                    <p className="text-xs text-muted-foreground mt-1">
                        For stocks, use the official ticker (e.g., GOOGL, MSFT). For crypto, use symbol with 'USD' (e.g., BTCUSD, ETHUSD) if prices are USD-based. For Indian mutual funds, use the scheme code if known.
                        <br/>
                        <Search className="inline h-3 w-3 mr-1" />Tip: Search online for "[Company/Crypto Name] ticker symbol" or "[Fund Name] scheme code". Type to search for tickers.
                    </p>
                    </div>
                </div>
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
                setTickerSearchQuery('');
                setTickerSuggestions([]);
                setShowTickerSuggestionsPopover(false);
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
                            : (totalData.allTimeGain !== 0 ? Infinity : 0); // Avoid NaN if totalPurchaseCost is 0 but gain exists
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

                        // Ensure we only render if there are assets for this currency in this category OR if there's a market value
                        const assetsInThisCurrencyAndCategory = allAssets.filter(a => a.category === category && a.currency === currency);
                        if (assetsInThisCurrencyAndCategory.length === 0 && totalData.marketValue === 0) {
                            return null; // Don't render empty currency sections if no assets for it in this category
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
                  </div>
                )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

