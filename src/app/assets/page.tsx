
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
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2, TrendingUp, RefreshCcw, WalletCards, TrendingDown, Coins, FilterX } from 'lucide-react';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useAssets, type Asset as ContextAsset, type AssetCategory } from '@/contexts/AssetContext';
import { fetchAssetPrice } from '@/services/marketService';

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

const categoryDisplayNames: Record<AssetCategory, string> = {
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeTab = useMemo(() => {
    const tab = searchParams.get('category') as AssetCategory | 'overview' | null;
    if (tab === 'overview' || !tab) return 'overview'; // Default to overview
    if (assetCategories.includes(tab as AssetCategory)) {
        return tab;
    }
    return 'overview'; // Fallback for unknown category
  }, [searchParams]);


  const handleTabChange = (newTabValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTabValue === 'overview') {
      params.delete('category');
    } else {
      params.set('category', newTabValue);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const displayedAssets = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      return allAssets.filter(asset => asset.category === activeTab);
    }
    // For overview tab, no individual assets are listed directly under it.
    // Individual assets are shown when a specific category tab is selected.
    return []; 
  }, [allAssets, activeTab]);

  const isCurrentAssetTrackable = useMemo(() => {
    if (!currentAsset || !currentAsset.category) return false;
    return currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';
  }, [currentAsset]);

  const openForm = (asset?: ContextAsset) => {
    if (asset) {
      setCurrentAsset({ ...asset });
    } else {
      // If adding new asset from a specific category tab, prefill that category
      const prefilledCategory = (activeTab && activeTab !== 'overview') ? activeTab : 'stock';
      setCurrentAsset({
        name: '',
        category: prefilledCategory as AssetCategory,
        currency: 'USD',
        quantity: 1,
        purchasePrice: 0,
        tickerSymbol: '',
        currentPrice: undefined, 
      });
    }
    setIsFormOpen(true);
  };

  const handleRefreshPrice = useCallback(async (asset: ContextAsset) => {
    if (asset.category === 'bank' || asset.category === 'property') {
      toast({ title: "Manual Update", description: `${asset.name} value is updated manually or via statements.`, variant: "default" });
      return;
    }
    if (!asset.tickerSymbol && (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund')) {
        toast({title: "Ticker Missing", description: `Please set a ticker for ${asset.name} to refresh its price.`, variant: "destructive"});
        return;
    }

    setIsFetchingPrice(prev => ({ ...prev, [asset.id]: true }));
    try {
      const priceData = await fetchAssetPrice(asset.category, asset.tickerSymbol, asset.currency);
      updateAssetPrice(asset.id, priceData);
      toast({ title: "Price Updated", description: `Price for ${asset.name} refreshed.` });
    } catch (error) {
      console.error("Failed to fetch price:", error);
      toast({ title: "Fetch Error", description: `Could not refresh price for ${asset.name}.`, variant: "destructive" });
    } finally {
      setIsFetchingPrice(prev => ({ ...prev, [asset.id]: false }));
    }
  }, [toast, updateAssetPrice]);


  useEffect(() => {
    const autoRefreshStaleAssets = async () => {
      // console.log("Checking for stale assets to auto-refresh...");
      for (const asset of allAssets) {
        if (asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund') {
          if (!asset.tickerSymbol) continue;

          let isStale = true;
          if (asset.lastPriceUpdate) {
            const lastUpdateDate = new Date(asset.lastPriceUpdate);
            if (Date.now() - lastUpdateDate.getTime() < STALE_PRICE_THRESHOLD_MS) {
              isStale = false;
            }
          }
          
          if (isStale && !isFetchingPrice[asset.id]) { // Also check if not already fetching
            // console.log(`Auto-refreshing price for stale asset: ${asset.name}`);
            await handleRefreshPrice(asset);
            // Small delay to avoid overwhelming APIs if many assets are stale
            await new Promise(resolve => setTimeout(resolve, 500)); 
          }
        }
      }
    };

    if (allAssets.length > 0) {
        autoRefreshStaleAssets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAssets, handleRefreshPrice]); // Rerun if assets change or refresh function changes

  const handleSaveAsset = () => {
    if (!currentAsset || !currentAsset.name || !currentAsset.category || !currentAsset.currency) {
      toast({ title: "Error", description: "Please fill name, category, and currency.", variant: "destructive" });
      return;
    }
    
    const isTrackableType = currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';

    if (currentAsset.quantity === undefined || currentAsset.quantity <= 0) {
        if (currentAsset.category !== 'bank' && currentAsset.category !== 'property') { 
            toast({ title: "Error", description: "Quantity must be greater than zero for trackable assets.", variant: "destructive" });
            return;
        }
    }
    
    const quantityToSave = (currentAsset.category === 'bank' || currentAsset.category === 'property') ? 1 : (Number(currentAsset.quantity) || 0);


    if (isTrackableType) {
        if (!currentAsset.tickerSymbol) {
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

    if (currentAsset.id) { 
      const payloadForUpdate: Partial<ContextAsset> & { id: string } = {
        id: currentAsset.id,
        name: currentAsset.name!,
        category: currentAsset.category!,
        currency: currentAsset.currency!,
        quantity: quantityToSave,
      };
      if (isTrackableType) {
        payloadForUpdate.tickerSymbol = currentAsset.tickerSymbol;
        payloadForUpdate.purchasePrice = Number(currentAsset.purchasePrice) || 0;
      } else { 
        payloadForUpdate.currentPrice = Number(currentAsset.currentPrice) || 0;
      }
      updateAsset(payloadForUpdate);
      toast({ title: "Asset Updated", description: `${payloadForUpdate.name} has been updated.` });
    } else { 
      const newAssetPayload: Omit<ContextAsset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'> = {
        name: currentAsset.name!,
        category: currentAsset.category!,
        currency: currentAsset.currency!,
        quantity: quantityToSave,
        purchasePrice: isTrackableType ? (Number(currentAsset.purchasePrice) || 0) : undefined,
        // For new trackable assets, initial current price is set to purchase price. It will be updated on first fetch.
        // For bank/property, currentPrice is user-input.
        currentPrice: isTrackableType ? (Number(currentAsset.purchasePrice) || 0) : (Number(currentAsset.currentPrice) || 0),
        tickerSymbol: isTrackableType ? currentAsset.tickerSymbol : undefined,
        // previousClosePrice will be set by first fetch for trackable assets
        previousClosePrice: isTrackableType ? (Number(currentAsset.purchasePrice) || 0) : undefined, 
      };
      addAsset(newAssetPayload);
      toast({ title: "Asset Added", description: `${newAssetPayload.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentAsset(initialAssetFormState); 
  };

  const handleDeleteAsset = (id: string) => {
    deleteAssetFromContext(id);
    toast({ title: "Asset Deleted", description: `Asset has been removed.`, variant: "destructive" });
  };

  const formatCurrency = (value: number, currencyCode: string) => {
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
    const isTrackableType = value === 'stock' || value === 'crypto' || value === 'mutualfund';

    if (isTrackableType) {
        newState.tickerSymbol = currentAsset?.tickerSymbol || '';
        newState.purchasePrice = currentAsset?.purchasePrice === undefined ? 0 : currentAsset.purchasePrice;
        newState.quantity = currentAsset?.quantity === undefined ? 1 : currentAsset.quantity;
        delete newState.currentPrice; 
    } else { 
        newState.currentPrice = currentAsset?.currentPrice === undefined ? 0 : currentAsset.currentPrice;
        newState.quantity = 1; 
        delete newState.tickerSymbol;
        delete newState.purchasePrice;
    }
    setCurrentAsset(newState);
  };


  const AssetCardComponent = ({ asset }: { asset: ContextAsset }) => {
    const marketValue = getAssetMarketValue(asset);
    const isTrackableAsset = asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund';

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
      allTimeGainLossPercent = ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100;
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
                <span className={dailyGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {dailyGainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                  {dailyGainLoss >= 0 ? '+' : ''}{formatCurrency(dailyGainLoss, asset.currency)} ({dailyGainLossPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">All-Time: </span>
                <span className={allTimeGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {allTimeGainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                  {allTimeGainLoss >= 0 ? '+' : ''}{formatCurrency(allTimeGainLoss, asset.currency)} ({allTimeGainLossPercent.toFixed(2)}%)
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
            {asset.lastPriceUpdate ? `Price as of: ${new Date(asset.lastPriceUpdate).toLocaleTimeString()} ${new Date(asset.lastPriceUpdate).toLocaleDateString()}` : (isTrackableAsset ? 'Price not yet updated' : '')} <br/>
            Details last saved: {new Date(asset.lastUpdated).toLocaleDateString()}
          </p>
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
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setCurrentAsset(initialAssetFormState);}}>
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
                Global currency settings and auto-conversion are planned for a future update.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">{currentAssetLabels.name}</Label>
                <div className="col-span-3">
                <Input id="name" value={currentAsset?.name || ''} onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value })} placeholder={`e.g. ${currentAsset?.category === 'bank' ? 'Main Savings' : currentAsset?.category === 'property' ? 'Downtown Condo' : currentAsset?.category === 'stock' ? 'Apple Inc.' : currentAsset?.category === 'crypto' ? 'Bitcoin' : 'Vanguard S&P 500 ETF'}`} />
                <p className="text-xs text-muted-foreground mt-1">
                    Dynamic name suggestions are planned for a future update.
                </p>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={currentAsset?.category || 'stock'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select asset category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="stock">Stocks</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="mutualfund">Mutual Fund</SelectItem>
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
                    <Input id="tickerSymbol" value={currentAsset?.tickerSymbol || ''} onChange={(e) => setCurrentAsset({...currentAsset, tickerSymbol: e.target.value.toUpperCase() })} placeholder={currentAsset?.category === 'stock' ? 'e.g. AAPL' : currentAsset?.category === 'crypto' ? 'e.g. BTCUSD' : 'e.g. VOO'} />
                    <p className="text-xs text-muted-foreground mt-1">
                        Automatic ticker fetching from name is planned. For now, please provide the ticker for stocks, crypto, and mutual funds.
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
            <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentAsset(initialAssetFormState);}}>Cancel</Button>
            <Button type="submit" onClick={handleSaveAsset}>Save Asset</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
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
                    {Object.keys(portfolioTotalsByCurrency).length === 0 && <p className="text-muted-foreground">No assets to display totals for. Add assets using the button above.</p>}
                    {Object.entries(portfolioTotalsByCurrency).map(([currency, totalData]) => {
                        const allTimeGainLossPercent = totalData.totalPurchaseCost > 0 
                            ? (totalData.allTimeGain / totalData.totalPurchaseCost) * 100 
                            : (totalData.allTimeGain !== 0 ? Infinity : 0);
                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total Portfolio)</span>
                            </p>
                            {(totalData.dailyGain !== 0) && ( // Only show if non-zero
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">Daily Gain/Loss:</span>
                                <span className={totalData.dailyGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {totalData.dailyGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                    {totalData.dailyGain >= 0 ? '+' : ''}{formatCurrency(totalData.dailyGain, currency)}
                                </span>
                                </div>
                            )}
                            {(totalData.allTimeGain !== 0) && ( // Only show if non-zero
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">All-Time Gain/Loss:</span>
                                <span className={totalData.allTimeGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {totalData.allTimeGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                    {totalData.allTimeGain >= 0 ? '+' : ''}{formatCurrency(totalData.allTimeGain, currency)}
                                    {(allTimeGainLossPercent !== Infinity && allTimeGainLossPercent !== -Infinity && totalData.totalPurchaseCost > 0)
                                    ? ` (${allTimeGainLossPercent.toFixed(2)}%)`
                                    : (totalData.totalPurchaseCost === 0 && totalData.allTimeGain !== 0 ? ` (N/A %)` : ` (0.00%)`)}
                                </span>
                                </div>
                            )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
             {allAssets.length === 0 && (
                <Card className="rounded-2xl shadow-lg mt-6">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        <WalletCards className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg font-semibold">No assets yet!</p>
                        <p>Click "Add Asset" to start building your portfolio.</p>
                    </CardContent>
                </Card>
            )}
        </TabsContent>

        {assetCategories.map(category => (
            <TabsContent key={category} value={category}>
                <Card className="rounded-2xl shadow-lg mb-6">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>{categoryDisplayNames[category]} Summary</CardTitle>
                    <Coins className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    {Object.keys(categorySpecificTotals).length === 0 && <p className="text-muted-foreground">No assets in this category. Add one using the button above.</p>}
                    {Object.entries(categorySpecificTotals).map(([currency, totalData]) => {
                        const allTimeGainLossPercent = totalData.totalPurchaseCost > 0 
                            ? (totalData.allTimeGain / totalData.totalPurchaseCost) * 100 
                            : (totalData.allTimeGain !== 0 ? Infinity : 0);
                        const isTrackableCategory = category === 'stock' || category === 'crypto' || category === 'mutualfund';
                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total {categoryDisplayNames[category].toLowerCase()})</span>
                            </p>
                            {isTrackableCategory && (
                                <>
                                    {(totalData.dailyGain !== 0) && ( // Only show if non-zero
                                        <div className="text-sm flex items-center mt-1">
                                        <span className="text-muted-foreground mr-1">Daily Gain/Loss:</span>
                                        <span className={totalData.dailyGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {totalData.dailyGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                            {totalData.dailyGain >= 0 ? '+' : ''}{formatCurrency(totalData.dailyGain, currency)}
                                        </span>
                                        </div>
                                    )}
                                    {(totalData.allTimeGain !== 0) && ( // Only show if non-zero
                                        <div className="text-sm flex items-center mt-1">
                                        <span className="text-muted-foreground mr-1">All-Time Gain/Loss:</span>
                                        <span className={totalData.allTimeGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {totalData.allTimeGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                                            {totalData.allTimeGain >= 0 ? '+' : ''}{formatCurrency(totalData.allTimeGain, currency)}
                                            {(allTimeGainLossPercent !== Infinity && allTimeGainLossPercent !== -Infinity && totalData.totalPurchaseCost > 0)
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
                    </CardContent>
                </Card>

                {displayedAssets.length === 0 && activeTab === category && (
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            <WalletCards className="mx-auto h-12 w-12 mb-4" />
                            <p className="text-lg font-semibold">No assets in {categoryDisplayNames[category].toLowerCase()} yet!</p>
                            <p>Add one using the "Add Asset" button above.</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-1"> {/* Single column for list view in tabs */}
                    {displayedAssets.map((asset) => (
                        <AssetCardComponent key={asset.id} asset={asset} />
                    ))}
                </div>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
