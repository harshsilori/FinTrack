
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2, TrendingUp, RefreshCcw, WalletCards, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useAssets, type Asset as ContextAsset, type AssetCategory } from '@/contexts/AssetContext';
import { fetchAssetPrice } from '@/services/marketService'; // Mock service

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
  quantity: 1,
  purchasePrice: 0,
  currentPrice: 0,
  tickerSymbol: '',
};

const chartConfigBase = {
  price: { label: "Price", color: "hsl(var(--primary))" },
};

export default function AssetsPage() {
  const { toast } = useToast();
  const { assets, addAsset, updateAsset, deleteAsset: deleteAssetFromContext, updateAssetPrice, getAssetMarketValue } = useAssets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Partial<ContextAsset> | null>(initialAssetFormState);
  const [isFetchingPrice, setIsFetchingPrice] = useState<Record<string, boolean>>({});


  const openForm = (asset?: ContextAsset) => {
    if (asset) {
      setCurrentAsset({ ...asset });
    } else {
      setCurrentAsset(initialAssetFormState);
    }
    setIsFormOpen(true);
  };

  const handleRefreshPrice = async (asset: ContextAsset) => {
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
      // SIMULATED FETCH
      const priceData = await fetchAssetPrice(asset.category, asset.tickerSymbol);
      updateAssetPrice(asset.id, priceData);
      toast({ title: "Price Updated", description: `Price for ${asset.name} refreshed.` });
    } catch (error) {
      console.error("Failed to fetch price:", error);
      toast({ title: "Fetch Error", description: `Could not refresh price for ${asset.name}.`, variant: "destructive" });
    } finally {
      setIsFetchingPrice(prev => ({ ...prev, [asset.id]: false }));
    }
  };

  const handleSaveAsset = () => {
    if (!currentAsset || !currentAsset.name || !currentAsset.category) {
      toast({ title: "Error", description: "Please fill name and category.", variant: "destructive" });
      return;
    }
    
    const isTrackable = currentAsset.category === 'stock' || currentAsset.category === 'crypto' || currentAsset.category === 'mutualfund';
    if (isTrackable && !currentAsset.tickerSymbol) {
      toast({ title: "Error", description: "Ticker symbol is required for stocks, crypto, and mutual funds.", variant: "destructive" });
      return;
    }
    if (currentAsset.quantity === undefined || currentAsset.quantity <= 0) {
        toast({ title: "Error", description: "Quantity must be greater than zero.", variant: "destructive" });
        return;
    }
     if (isTrackable && (currentAsset.purchasePrice === undefined || currentAsset.purchasePrice < 0)) {
        toast({ title: "Error", description: "Purchase price must be zero or positive for trackable assets.", variant: "destructive" });
        return;
    }
     if (currentAsset.currentPrice === undefined || currentAsset.currentPrice < 0) {
        toast({ title: "Error", description: "Current value/price must be zero or positive.", variant: "destructive" });
        return;
    }


    const assetData = {
        name: currentAsset.name!,
        category: currentAsset.category!,
        quantity: Number(currentAsset.quantity) || 0,
        purchasePrice: isTrackable ? (Number(currentAsset.purchasePrice) || 0) : undefined,
        currentPrice: Number(currentAsset.currentPrice) || 0,
        tickerSymbol: isTrackable ? currentAsset.tickerSymbol : undefined,
        previousClosePrice: isTrackable ? (Number(currentAsset.previousClosePrice) || currentAsset.currentPrice) : undefined,
    };

    if (currentAsset.id) {
      updateAsset({ id: currentAsset.id, ...assetData });
      toast({ title: "Asset Updated", description: `${assetData.name} has been updated.` });
    } else {
      // For add, ensure all required fields are present and others are appropriately undefined
      const newAssetPayload: Omit<ContextAsset, 'id' | 'lastUpdated' | 'lastPriceUpdate' | 'priceHistory'> = {
        name: assetData.name,
        category: assetData.category,
        quantity: assetData.quantity,
        purchasePrice: assetData.purchasePrice,
        currentPrice: assetData.currentPrice,
        tickerSymbol: assetData.tickerSymbol,
        previousClosePrice: assetData.previousClosePrice,
      };
      addAsset(newAssetPayload);
      toast({ title: "Asset Added", description: `${assetData.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentAsset(initialAssetFormState);
  };

  const handleDeleteAsset = (id: string) => {
    deleteAssetFromContext(id);
    toast({ title: "Asset Deleted", description: `Asset has been removed.`, variant: "destructive" });
  };

  const totalPortfolioValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + getAssetMarketValue(asset), 0);
  }, [assets, getAssetMarketValue]);

  const totalDailyGainLoss = useMemo(() => {
    return assets.reduce((sum, asset) => {
      if (asset.category === 'bank' || asset.category === 'property' || asset.currentPrice === undefined || asset.previousClosePrice === undefined) {
        return sum;
      }
      const dailyGain = (asset.currentPrice - asset.previousClosePrice) * asset.quantity;
      return sum + dailyGain;
    }, 0);
  }, [assets]);

  const AssetCard = ({ asset }: { asset: ContextAsset }) => {
    const marketValue = getAssetMarketValue(asset);
    let dailyGainLoss = 0;
    let dailyGainLossPercent = 0;
    if (asset.category !== 'bank' && asset.category !== 'property' && asset.currentPrice !== undefined && asset.previousClosePrice !== undefined && asset.previousClosePrice !== 0) {
      dailyGainLoss = (asset.currentPrice - asset.previousClosePrice) * asset.quantity;
      dailyGainLossPercent = ((asset.currentPrice - asset.previousClosePrice) / asset.previousClosePrice) * 100;
    }

    let allTimeGainLoss = 0;
    let allTimeGainLossPercent = 0;
    if (asset.category !== 'bank' && asset.category !== 'property' && asset.currentPrice !== undefined && asset.purchasePrice !== undefined && asset.purchasePrice !== 0) {
      allTimeGainLoss = (asset.currentPrice - asset.purchasePrice) * asset.quantity;
      allTimeGainLossPercent = ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100;
    }
    
    const isTrackable = asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund';

    return (
      <Card className="rounded-2xl shadow-lg flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{asset.name}</CardTitle>
            <CardDescription className="capitalize">
              {asset.category} {asset.tickerSymbol && `(${asset.tickerSymbol})`}
            </CardDescription>
          </div>
          {assetIcons[asset.category]}
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="space-y-1">
            <p className="text-2xl font-semibold">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            {isTrackable && asset.currentPrice !== undefined && (
              <p className="text-xs text-muted-foreground">
                {asset.quantity.toLocaleString()} units @ ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/unit
              </p>
            )}
          </div>

          {isTrackable && (
            <>
              <div className="text-sm">
                <span className="font-medium">Daily: </span>
                <span className={dailyGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {dailyGainLoss >= 0 ? '+' : ''}${dailyGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({dailyGainLossPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">All-Time: </span>
                <span className={allTimeGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {allTimeGainLoss >= 0 ? '+' : ''}${allTimeGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({allTimeGainLossPercent.toFixed(2)}%)
                </span>
              </div>
            </>
          )}
           {asset.priceHistory && asset.priceHistory.length > 0 && isTrackable && (
            <div className="h-[100px] mt-2">
              <ChartContainer config={chartConfigBase} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={asset.priceHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickMargin={5} />
                    <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickMargin={5} domain={['dataMin - 5', 'dataMax + 5']}/>
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
            {asset.lastPriceUpdate ? `Price as of: ${new Date(asset.lastPriceUpdate).toLocaleDateString()}` : 'Price not yet updated'} <br/>
            Details last saved: {new Date(asset.lastUpdated).toLocaleDateString()}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-2">
            {isTrackable && (
            <Button variant="outline" size="sm" onClick={() => handleRefreshPrice(asset)} disabled={isFetchingPrice[asset.id]}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingPrice[asset.id] ? 'animate-spin' : ''}`} /> Refresh
            </Button>
           )}
           <div className="flex justify-end gap-1">
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
  
  const isBankOrProperty = currentAsset?.category === 'bank' || currentAsset?.category === 'property';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and net worth. Price refresh is simulated.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{currentAsset?.id ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
              <DialogDescription>
                Enter the details for your asset. Market data is mocked.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={currentAsset?.name || ''} onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value })} className="col-span-3" placeholder="e.g. My Savings, Bitcoin" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={currentAsset?.category || 'stock'} onValueChange={(value: AssetCategory) => setCurrentAsset({...currentAsset, category: value, tickerSymbol: '', purchasePrice: 0, quantity: 1})}>
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
              {!isBankOrProperty && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tickerSymbol" className="text-right">Ticker</Label>
                    <Input id="tickerSymbol" value={currentAsset?.tickerSymbol || ''} onChange={(e) => setCurrentAsset({...currentAsset, tickerSymbol: e.target.value.toUpperCase() })} className="col-span-3" placeholder="e.g. AAPL, BTCUSD" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">Quantity</Label>
                    <Input id="quantity" type="number" value={currentAsset?.quantity === undefined ? '' : currentAsset.quantity} onChange={(e) => setCurrentAsset({...currentAsset, quantity: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="e.g. 10" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
                    <Input id="purchasePrice" type="number" value={currentAsset?.purchasePrice === undefined ? '' : currentAsset.purchasePrice} onChange={(e) => setCurrentAsset({...currentAsset, purchasePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Price per unit at purchase" />
                  </div>
                </>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentPrice" className="text-right">{isBankOrProperty ? 'Current Value' : 'Current Price'}</Label>
                <Input id="currentPrice" type="number" value={currentAsset?.currentPrice === undefined ? '' : currentAsset.currentPrice} onChange={(e) => setCurrentAsset({...currentAsset, currentPrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder={isBankOrProperty ? "Total current value" : "Price per unit now"} />
              </div>
               {!isBankOrProperty && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="previousClosePrice" className="text-right">Prev. Close</Label>
                    <Input id="previousClosePrice" type="number" value={currentAsset?.previousClosePrice === undefined ? '' : currentAsset.previousClosePrice} onChange={(e) => setCurrentAsset({...currentAsset, previousClosePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Previous day's closing price" />
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
      
      <Card className="rounded-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Portfolio Snapshot</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="text-sm flex items-center mt-1">
            <span className="text-muted-foreground mr-1">Daily:</span>
            <span className={totalDailyGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
              {totalDailyGainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
              {totalDailyGainLoss >= 0 ? '+' : ''}${totalDailyGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      {assets.length === 0 && (
        <Card className="rounded-2xl shadow-lg">
            <CardContent className="pt-6 text-center text-muted-foreground">
                <WalletCards className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">No assets yet!</p>
                <p>Click "Add Asset" to start building your portfolio.</p>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2"> {/* Adjusted for potentially wider cards */}
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
}
