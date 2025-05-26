
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
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2, TrendingUp, RefreshCcw, WalletCards, TrendingDown, Coins, Info, ExternalLink, AlertTriangle, Search } from 'lucide-react';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useAssets, type Asset as ContextAsset, type AssetCategory } from '@/contexts/AssetContext';
import { fetchAssetPrice } from '@/services/marketService';
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
  const [currentAssetForForm, setCurrentAssetForForm] = useState<Partial<ContextAsset>>(initialAssetFormState);
  const [isFetchingPrice, setIsFetchingPrice] = useState<Record<string, boolean>>({});
  const [initialRefreshPerformedForTab, setInitialRefreshPerformedForTab] = useState<Record<string, boolean>>({});

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
    if (newTabValue !== 'overview' && !initialRefreshPerformedForTab[newTabValue]) {
      setInitialRefreshPerformedForTab(prev => ({ ...prev, [newTabValue]: false }));
    }
  };

  const displayedAssets = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      return allAssets.filter(asset => asset.category === activeTab);
    }
    return []; // No assets displayed directly under "Overview" tab for individual cards
  }, [allAssets, activeTab]);

  const handleRefreshPrice = useCallback(async (assetToRefresh: ContextAsset) => {
    if (!assetToRefresh || !assetToRefresh.id) {
      console.error("[AssetsPage] handleRefreshPrice called with invalid asset:", assetToRefresh);
      return;
    }
    console.log(`[AssetsPage] Calling fetchAssetPrice for: ID=${assetToRefresh.id}, Category=${assetToRefresh.category}, Ticker=${assetToRefresh.tickerSymbol}, Currency=${assetToRefresh.currency}`);

    if (assetToRefresh.category === 'bank' || assetToRefresh.category === 'property') {
        updateAssetPrice(assetToRefresh.id, {
            currentPrice: assetToRefresh.currentPrice || 0,
            previousClosePrice: assetToRefresh.previousClosePrice || assetToRefresh.currentPrice || 0,
            priceHistory: assetToRefresh.priceHistory || [{ date: new Date().toISOString().split('T')[0], price: assetToRefresh.currentPrice || 0 }],
            priceFetchError: "Manual value."
        });
        // toast({ title: "Manual Asset", description: `${assetToRefresh.name} is a manually valued asset.`, variant: "default" });
      return;
    }

    if (!assetToRefresh.tickerSymbol && (assetToRefresh.category === 'stock' || assetToRefresh.category === 'crypto' || assetToRefresh.category === 'mutualfund')) {
        const missingTickerError = `Ticker missing for ${assetToRefresh.name}. Cannot refresh price. Please edit the asset and add a valid ticker.`;
        updateAssetPrice(assetToRefresh.id, {
            currentPrice: assetToRefresh.currentPrice || 0,
            previousClosePrice: assetToRefresh.previousClosePrice || assetToRefresh.currentPrice || 0,
            priceHistory: assetToRefresh.priceHistory,
            priceFetchError: missingTickerError
        });
        toast({ title: "Ticker Missing", description: missingTickerError, variant: "destructive" });
        return;
    }

    setIsFetchingPrice(prev => ({ ...prev, [assetToRefresh.id!]: true }));
    let priceData;
    try {
      priceData = await fetchAssetPrice(assetToRefresh.category, assetToRefresh.tickerSymbol, assetToRefresh.currency);
      updateAssetPrice(assetToRefresh.id!, priceData);
      // if (priceData.priceFetchError) {
      //   toast({ title: "Price Info", description: `${assetToRefresh.name}: ${priceData.priceFetchError}`, variant: "default" });
      // } else {
      //   toast({ title: "Price Updated", description: `Price for ${assetToRefresh.name} refreshed.`, variant: "default" });
      // }
    } catch (error) {
      let detailedError = "Could not refresh price due to an unknown error.";
      if (error instanceof Error) {
          detailedError = `Could not refresh price for ${assetToRefresh.name}. Error: ${error.message}.`;
      }
      console.error("[AssetsPage] Failed to fetch price in handleRefreshPrice:", error);
      updateAssetPrice(assetToRefresh.id!, {
        currentPrice: assetToRefresh.currentPrice || 0,
        previousClosePrice: assetToRefresh.previousClosePrice || assetToRefresh.currentPrice || 0,
        priceHistory: assetToRefresh.priceHistory,
        priceFetchError: detailedError
      });
      // toast({ title: "Refresh Error", description: detailedError, variant: "destructive" });
    } finally {
      setIsFetchingPrice(prev => ({ ...prev, [assetToRefresh.id!]: false }));
    }
  }, [updateAssetPrice, toast]);


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
            console.log(`[AssetsPage] Refreshing ${assetsInTabToRefresh.length} assets in tab ${activeTab}`);
            let refreshedCount = 0;
            for (const asset of assetsInTabToRefresh) {
                if (!isFetchingPrice[asset.id!]) { // Ensure asset.id is not undefined
                    await handleRefreshPrice(asset);
                    refreshedCount++;
                    if (refreshedCount < assetsInTabToRefresh.length) {
                      await new Promise(resolve => setTimeout(resolve, 500)); // Stagger API calls
                    }
                }
            }
        }
        setInitialRefreshPerformedForTab(prev => ({ ...prev, [activeTab]: true }));
    };
    
    performTabRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allAssets, handleRefreshPrice, initialRefreshPerformedForTab]); // isFetchingPrice deliberately omitted to avoid loops

  const openForm = (asset?: ContextAsset) => {
    if (asset) {
      setCurrentAssetForForm({ ...asset });
    } else {
      const prefilledCategory = (activeTab && activeTab !== 'overview') ? activeTab : 'stock';
      const newInitialState: Partial<ContextAsset> = {
        ...initialAssetFormState,
        category: prefilledCategory as AssetCategory,
        currency: 'USD', // Default currency
      };
       if (prefilledCategory === 'bank' || prefilledCategory === 'property') {
        newInitialState.quantity = 1;
        delete newInitialState.purchasePrice; // Not applicable
        delete newInitialState.tickerSymbol; // Not applicable
      } else {
        newInitialState.quantity = 1;
        newInitialState.purchasePrice = 0;
        newInitialState.tickerSymbol = '';
      }
      setCurrentAssetForForm(newInitialState);
    }
    setIsFormOpen(true);
  };

  const handleSaveAsset = () => {
    if (!currentAssetForForm || !currentAssetForForm.name || !currentAssetForForm.category || !currentAssetForForm.currency) {
      toast({ title: "Error", description: "Please fill name, category, and currency.", variant: "destructive" });
      return;
    }

    const isTrackableCategory = currentAssetForForm.category === 'stock' || currentAssetForForm.category === 'crypto' || currentAssetForForm.category === 'mutualfund';

    const finalName = currentAssetForForm.name;
    const quantityToSave = (currentAssetForForm.category === 'bank' || currentAssetForForm.category === 'property') ? 1 : (Number(currentAssetForForm.quantity) || 0);
    const finalTickerSymbol = isTrackableCategory ? currentAssetForForm.tickerSymbol?.toUpperCase() : undefined;

    if (isTrackableCategory) {
        if (!finalTickerSymbol) {
            toast({ title: "Error", description: "Ticker symbol is required for stocks, crypto, and mutual funds.", variant: "destructive" });
            return;
        }
         if (currentAssetForForm.quantity === undefined || currentAssetForForm.quantity <= 0) {
            toast({ title: "Error", description: "Quantity must be greater than zero for trackable assets.", variant: "destructive" });
            return;
        }
        if (currentAssetForForm.purchasePrice === undefined || currentAssetForForm.purchasePrice < 0) {
            toast({ title: "Error", description: "Purchase price must be zero or positive for trackable assets.", variant: "destructive" });
            return;
        }
    } else { // Bank or Property
        if (currentAssetForForm.currentPrice === undefined || currentAssetForForm.currentPrice < 0) {
            toast({ title: "Error", description: "Current value must be zero or positive for bank accounts and property.", variant: "destructive" });
            return;
        }
    }

    let addedAssetWithId: ContextAsset | undefined = undefined;
    let existingAssetId: string | undefined = currentAssetForForm.id;
    let categoryOfSavedAsset = currentAssetForForm.category;


    if (currentAssetForForm.id) { // Editing existing asset
      const payloadForUpdate: Partial<ContextAsset> & { id: string } = {
        id: currentAssetForForm.id,
        name: finalName,
        category: currentAssetForForm.category!,
        currency: currentAssetForForm.currency!,
        quantity: quantityToSave,
      };
      if (isTrackableCategory) {
        payloadForUpdate.tickerSymbol = finalTickerSymbol;
        payloadForUpdate.purchasePrice = Number(currentAssetForForm.purchasePrice) || 0;
      } else {
        payloadForUpdate.currentPrice = Number(currentAssetForForm.currentPrice) || 0;
      }
      updateAsset(payloadForUpdate);
      toast({ title: "Asset Updated", description: `${payloadForUpdate.name} has been updated.` });
    } else { // Adding new asset
      const newAssetPayload: Omit<ContextAsset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory' | 'priceFetchError' | 'currentPrice' | 'previousClosePrice'> & { purchasePrice?: number; currentPrice?: number; tickerSymbol?: string; } = {
        name: finalName,
        category: currentAssetForForm.category!,
        currency: currentAssetForForm.currency!,
        quantity: quantityToSave,
      };
      if (isTrackableCategory) {
        newAssetPayload.purchasePrice = Number(currentAssetForForm.purchasePrice) || 0;
        newAssetPayload.tickerSymbol = finalTickerSymbol;
      } else {
        newAssetPayload.currentPrice = Number(currentAssetForForm.currentPrice) || 0;
      }
      addedAssetWithId = addAsset(newAssetPayload);
      existingAssetId = addedAssetWithId.id;
      categoryOfSavedAsset = newAssetPayload.category;
      toast({ title: "Asset Added", description: `${newAssetPayload.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentAssetForForm(initialAssetFormState);

    if (isTrackableCategory && existingAssetId) {
        const assetToRefresh = addedAssetWithId ? addedAssetWithId : allAssets.find(a => a.id === existingAssetId);
        if (assetToRefresh) {
             // Ensure the asset being refreshed has the latest ticker/name from the form
             const effectiveAssetToRefresh = addedAssetWithId ? addedAssetWithId : {...assetToRefresh, name: finalName, tickerSymbol: finalTickerSymbol, currency: currentAssetForForm.currency!};
             handleRefreshPrice(effectiveAssetToRefresh);
        }
        // When a new asset is added or an existing one's category/ticker is changed, mark its tab for re-fetch on next view
        if (categoryOfSavedAsset) {
           setInitialRefreshPerformedForTab(prev => ({ ...prev, [categoryOfSavedAsset as string]: false }));
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

  const portfolioTotalsByCurrency = useMemo(() => calculateTotals(allAssets.filter(a => a.category !== 'bank' && a.category !== 'property' || a.currentPrice !== undefined)), [allAssets, calculateTotals]);

  const categorySpecificTotals = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      const filteredAssetsForTab = allAssets.filter(asset => asset.category === activeTab && (asset.category !== 'bank' && asset.category !== 'property' || asset.currentPrice !== undefined));
      return calculateTotals(filteredAssetsForTab);
    }
    return {};
  }, [allAssets, activeTab, calculateTotals]);


  const handleCategoryChangeInForm = (value: AssetCategory) => {
    const newState: Partial<ContextAsset> = { ...currentAssetForForm, category: value };
    const isNewCategoryTrackable = value === 'stock' || value === 'crypto' || value === 'mutualfund';

    if (isNewCategoryTrackable) {
        // If switching to trackable, initialize purchasePrice and ticker if they don't exist or come from a non-trackable type
        newState.purchasePrice = currentAssetForForm?.purchasePrice === undefined ? 0 : currentAssetForForm.purchasePrice;
        // If quantity was 1 (default for bank/property), keep it as 1, otherwise use existing quantity
        newState.quantity = (currentAssetForForm?.quantity === undefined || (currentAssetForForm.quantity === 1 && (currentAssetForForm.category === 'bank' || currentAssetForForm.category === 'property'))) ? 1 : currentAssetForForm.quantity;
        newState.tickerSymbol = currentAssetForForm?.tickerSymbol || '';
        delete newState.currentPrice; // currentPrice is for non-trackable, fetched for trackable
    } else { // Switching to Bank or Property
        newState.currentPrice = currentAssetForForm?.currentPrice === undefined ? 0 : currentAssetForForm.currentPrice;
        newState.quantity = 1; // Bank/Property always have quantity 1
        delete newState.tickerSymbol;
        delete newState.purchasePrice;
    }
    setCurrentAssetForForm(newState);
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
      } else if (isTrackableAsset && asset.currentPrice === undefined) {
        // Only show "not yet updated" if it's trackable and has no price yet
        priceUpdateText = 'Price not yet updated';
      }
      setClientFormattedLastPriceUpdate(priceUpdateText);

      let detailsSavedText: string | null = null;
      if (asset.lastUpdated) {
        detailsSavedText = `Details last saved: ${new Date(asset.lastUpdated).toLocaleDateString()}`;
      }
      setClientFormattedLastUpdated(detailsSavedText);

    }, [asset.lastPriceUpdate, asset.lastUpdated, isTrackableAsset, asset.currentPrice]);


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
       } else if (allTimeGainLoss !== 0) { // Gained from 0 cost
         allTimeGainLossPercent = allTimeGainLoss > 0 ? Infinity : -Infinity; // Or some other indicator for infinite gain
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
             {!isTrackableAsset && ( // For bank/property
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
               {asset.purchasePrice !== undefined && ( // Show purchase price for trackable assets
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
              : (isTrackableAsset && asset.currentPrice === undefined ? "Loading price date..." : "") // Show loading only if trackable and no price date
            }
            {(clientFormattedLastPriceUpdate && clientFormattedLastPriceUpdate.trim() !== "" && clientFormattedLastUpdated && clientFormattedLastUpdated.trim() !== "") && <br />}
            {clientFormattedLastUpdated !== null
              ? clientFormattedLastUpdated
              : (asset.lastUpdated ? "Loading save date..." : "") // Show loading only if lastUpdated exists
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
            {isTrackableAsset && ( // Refresh button only for trackable assets
            <Button variant="outline" size="sm" onClick={() => handleRefreshPrice(asset)} disabled={!!isFetchingPrice[asset.id!]}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingPrice[asset.id!] ? 'animate-spin' : ''}`} /> Refresh
            </Button>
           )}
           <div className={`flex justify-end gap-1 ${!isTrackableAsset ? 'w-full' : ''}`}> {/* Ensure edit/delete are at the end for non-trackable too */}
              <Button variant="ghost" size="icon" onClick={() => openForm(asset)} aria-label="Edit asset">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id!)} aria-label="Delete asset">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
           </div>
        </CardFooter>
      </Card>
    );
  };

  const assetLabelMap: Record<AssetCategory, { name: string, quantity: string, purchasePrice: string, tickerSymbol: string, currentPrice?: string }> = {
    stock: { name: "Company Name", quantity: "Number of Shares", purchasePrice: "Purchase Price per Share", tickerSymbol: "Stock Ticker (e.g., AAPL)" },
    crypto: { name: "Cryptocurrency Name", quantity: "Quantity Owned", purchasePrice: "Purchase Price per Unit", tickerSymbol: "Crypto Symbol (e.g., BTCUSD or ADAETH)" },
    mutualfund: { name: "Fund Name", quantity: "Units Held", purchasePrice: "Purchase Price per Unit", tickerSymbol: "Fund Symbol (e.g., VOO or AMFI Code)" },
    bank: { name: "Account Nickname", quantity: "N/A", purchasePrice: "N/A", tickerSymbol: "N/A", currentPrice: "Current Balance"},
    property: { name: "Property Name", quantity: "N/A", purchasePrice: "N/A", tickerSymbol: "N/A", currentPrice: "Current Estimated Value" },
  };

  const currentAssetLabels = assetLabelMap[currentAssetForForm?.category || 'stock'];
  const isTrackableCategoryInForm = currentAssetForForm?.category === 'stock' || currentAssetForForm?.category === 'crypto' || currentAssetForForm?.category === 'mutualfund';


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
                setCurrentAssetForForm(initialAssetFormState);
            }
        }}>
        <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
            <DialogTitle>{currentAssetForForm?.id ? 'Edit Asset' : `Add New ${activeTab && activeTab !== 'overview' ? categoryDisplayNames[activeTab as AssetCategory].slice(0,-1) : 'Asset'}`}</DialogTitle>
            <DialogDescription>
                Enter the details for your asset. Click "Save Asset" when done.
                <span className="block text-xs mt-1 text-muted-foreground">Global currency settings and auto-conversion are planned for a future update.</span>
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">{currentAssetLabels.name}</Label>
                 <div className="col-span-3">
                    <Input
                        id="name"
                        value={currentAssetForForm?.name || ''}
                        onChange={(e) => setCurrentAssetForForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={
                            currentAssetForForm?.category === 'stock' ? 'e.g., Apple Inc.' :
                            currentAssetForForm?.category === 'crypto' ? 'e.g., Bitcoin' :
                            currentAssetForForm?.category === 'mutualfund' ? 'e.g., Vanguard S&P 500 ETF' :
                            currentAssetForForm?.category === 'bank' ? 'e.g., Main Savings Account' :
                            'e.g., Downtown Condo'
                        }
                     />
                </div>
            </div>

            {isTrackableCategoryInForm && (
                <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="tickerSymbol" className="text-right">{currentAssetLabels.tickerSymbol}</Label>
                    <Input
                        id="tickerSymbol"
                        value={currentAssetForForm?.tickerSymbol || ''}
                        onChange={(e) => setCurrentAssetForForm(prev => ({ ...prev, tickerSymbol: e.target.value.toUpperCase() }))}
                        className="col-span-3"
                        placeholder={
                            currentAssetForForm?.category === 'stock' ? 'e.g., AAPL' :
                            currentAssetForForm?.category === 'crypto' ? 'e.g., BTCUSD or ADAETH' :
                            currentAssetForForm?.category === 'mutualfund' ? 'e.g., VOO or INDEX_FUND_CODE' :
                            ''
                        }
                    />
                    <div className="col-span-4 text-xs text-muted-foreground text-center px-4">
                        <Search className="inline h-3 w-3 mr-1" />
                         Enter the correct ticker/symbol. AlphaVantage for US stocks (e.g., AAPL). For crypto, use SYMBOL+CURRENCY (e.g., BTCUSD, ETHINR). For Indian mutual funds, use AMFI codes if supported by your data source. Search online for exact symbols.
                    </div>
                </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={currentAssetForForm?.category || 'stock'} onValueChange={handleCategoryChangeInForm}>
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
                <Select value={currentAssetForForm?.currency || 'USD'} onValueChange={(value) => setCurrentAssetForForm({...currentAssetForForm, currency: value })}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                    {supportedCurrencies.map(curr => <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>

            {(currentAssetForForm?.category !== 'bank' && currentAssetForForm?.category !== 'property') && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">{currentAssetLabels.quantity}</Label>
                    <Input id="quantity" type="number" value={currentAssetForForm?.quantity === undefined ? '' : currentAssetForForm.quantity} onChange={(e) => setCurrentAssetForForm({...currentAssetForForm, quantity: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder={currentAssetForForm?.category === 'stock' ? 'e.g. 10' : currentAssetForForm?.category === 'crypto' ? 'e.g. 0.5' : 'e.g. 100'}/>
                </div>
            )}

            {isTrackableCategoryInForm && (
                <>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">{currentAssetLabels.purchasePrice}</Label>
                    <Input id="purchasePrice" type="number" value={currentAssetForForm?.purchasePrice === undefined ? '' : currentAssetForForm.purchasePrice} onChange={(e) => setCurrentAssetForForm({...currentAssetForForm, purchasePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Price per unit at purchase" />
                </div>
                </>
            )}
            {!isTrackableCategoryInForm && (currentAssetForForm?.category === 'bank' || currentAssetForForm?.category === 'property') && (
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentValue" className="text-right">{currentAssetLabels.currentPrice}</Label>
                <Input id="currentValue" type="number" value={currentAssetForForm?.currentPrice === undefined ? '' : currentAssetForForm.currentPrice} onChange={(e) => setCurrentAssetForForm({...currentAssetForForm, currentPrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Total current value" />
                </div>
            )}
            </div>
            <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
                setIsFormOpen(false);
                setCurrentAssetForForm(initialAssetFormState);
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
                            : (totalData.allTimeGain !== 0 ? Infinity : 0); // Handle gain from 0 cost
                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total Portfolio)</span>
                            </p>
                            {(totalData.dailyGain !== 0) && ( // Only show if non-zero
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">Daily Gain/Loss:</span>
                                <span className={totalData.dailyGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {totalData.dailyGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                    {totalData.dailyGain >= 0 ? '+' : ''}{formatCurrency(totalData.dailyGain, currency)}
                                </span>
                                </div>
                            )}
                            {(totalData.allTimeGain !== 0) && ( // Only show if non-zero
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
                 {allAssets.length > 0 && Object.keys(portfolioTotalsByCurrency).length === 0 && ( // Assets exist but totals are zero (could be data issue)
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

                        // Only render if there's a market value for this currency in this category
                        const assetsInThisCurrencyAndCategory = allAssets.filter(a => a.category === category && a.currency === currency);
                        if (assetsInThisCurrencyAndCategory.length === 0 && totalData.marketValue === 0) { // Don't render if no assets AND no value
                            return null;
                        }
                        
                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total {categoryDisplayNames[category].toLowerCase()})</span>
                            </p>
                            {isTrackableCategoryForTab && ( // Only show gain/loss for trackable categories
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
                     {allAssets.filter(a => a.category === category).length === 0 && ( // If totals calculated but no assets (e.g. after deletion)
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

                <div className="grid gap-6 md:grid-cols-1"> {/* Single column for filtered list */}
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
