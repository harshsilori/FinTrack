
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
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2, TrendingUp, WalletCards, Coins, Info, AlertTriangle, Search } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { useAssets, type Asset as ContextAsset, type AssetCategory } from '@/contexts/AssetContext';

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
  currentPrice: 0,
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

const categoryDisplayNames: Record<AssetCategory | 'overview', string> = {
  overview: "Overview",
  bank: "Bank Accounts",
  stock: "Stocks",
  crypto: "Cryptocurrencies",
  property: "Properties",
  mutualfund: "Mutual Funds",
};

const assetCategories: AssetCategory[] = ['bank', 'stock', 'crypto', 'property', 'mutualfund'];

const AssetCardComponent = React.memo(function AssetCardComponent({ asset, onEdit, onDelete }: { asset: ContextAsset, onEdit: (asset: ContextAsset) => void, onDelete: (id: string) => void }) {
  const marketValue = (asset.category === 'bank' || asset.category === 'property')
    ? asset.currentPrice
    : asset.currentPrice * asset.quantity;

  const isTrackableAsset = asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund';
  
  const [clientFormattedLastUpdated, setClientFormattedLastUpdated] = useState<string | null>(null);
  
  useEffect(() => {
    if (asset.lastUpdated) {
      setClientFormattedLastUpdated(new Date(asset.lastUpdated).toLocaleDateString());
    } else {
      setClientFormattedLastUpdated(null);
    }
  }, [asset.lastUpdated]);

  let allTimeGainLoss = 0;
  let allTimeGainLossPercent = 0;
  if (isTrackableAsset && asset.purchasePrice !== undefined && asset.currentPrice !== undefined) {
    allTimeGainLoss = (asset.currentPrice - asset.purchasePrice) * asset.quantity;
    const totalPurchaseCostForAsset = asset.purchasePrice * asset.quantity;
     if (totalPurchaseCostForAsset !== 0) {
       allTimeGainLossPercent = (allTimeGainLoss / totalPurchaseCostForAsset) * 100;
     } else if (allTimeGainLoss !== 0) { 
       allTimeGainLossPercent = allTimeGainLoss > 0 ? Infinity : -Infinity; 
     }
  }

  const formatCurrency = (value: number | undefined, currencyCode: string) => {
    if (value === undefined) return 'N/A';
    return value.toLocaleString(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
          <p className="text-xs text-muted-foreground">
              {asset.category === 'bank' || asset.category === 'property'
              ? 'Current Value'
              : `${asset.quantity.toLocaleString()} units @ ${formatCurrency(asset.currentPrice, asset.currency)}/unit (Manual Entry)`
              }
          </p>
        </div>

        {isTrackableAsset && asset.purchasePrice !== undefined && (
          <>
            <div className="text-sm">
              <span className="font-medium">All-Time Gain/Loss: </span>
              <span className={allTimeGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {allTimeGainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <AlertTriangle className="inline h-4 w-4 mr-1"/>}
                {allTimeGainLoss >= 0 ? '+' : ''}{formatCurrency(allTimeGainLoss, asset.currency)} ({!isNaN(allTimeGainLossPercent) && isFinite(allTimeGainLossPercent) ? allTimeGainLossPercent.toFixed(2) : (asset.purchasePrice === 0 && allTimeGainLoss !== 0 ? "N/A" : "0.00")}%)
              </span>
            </div>
             <p className="text-xs text-muted-foreground">
               Purchase Price: {formatCurrency(asset.purchasePrice, asset.currency)}/unit
             </p>
          </>
        )}
         <p className="text-xs text-muted-foreground pt-2">
          {clientFormattedLastUpdated !== null
            ? `Details last saved: ${clientFormattedLastUpdated}`
            : (asset.lastUpdated ? "Loading save date..." : "")
          }
        </p>
      </CardContent>
      <CardFooter className="flex justify-end items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(asset)} aria-label="Edit asset">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(asset.id!)} aria-label="Delete asset">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
      </CardFooter>
    </Card>
  );
});
AssetCardComponent.displayName = 'AssetCardComponent';


export default function AssetsPage() {
  const { toast } = useToast();
  const { assets: allAssets, addAsset, updateAsset, deleteAsset: deleteAssetFromContext } = useAssets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAssetForForm, setCurrentAssetForForm] = useState<Partial<ContextAsset>>(initialAssetFormState);
  
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
    return []; 
  }, [allAssets, activeTab]);

  const openForm = (asset?: ContextAsset) => {
    if (asset) {
      setCurrentAssetForForm({ ...asset });
    } else {
      const prefilledCategory = (activeTab && activeTab !== 'overview') ? activeTab : 'stock';
      const newInitialState: Partial<ContextAsset> = {
        ...initialAssetFormState,
        category: prefilledCategory as AssetCategory,
        currency: 'USD', 
        currentPrice: 0, 
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
      setCurrentAssetForForm(newInitialState);
    }
    setIsFormOpen(true);
  };

  const handleSaveAsset = () => {
    if (!currentAssetForForm || !currentAssetForForm.name || !currentAssetForForm.category || !currentAssetForForm.currency || currentAssetForForm.currentPrice === undefined || currentAssetForForm.currentPrice < 0) {
      toast({ title: "Error", description: "Please fill name, category, currency, and a valid current price (>=0).", variant: "destructive" });
      return;
    }

    const isTrackableCategory = currentAssetForForm.category === 'stock' || currentAssetForForm.category === 'crypto' || currentAssetForForm.category === 'mutualfund';

    const finalName = currentAssetForForm.name;
    const quantityToSave = (currentAssetForForm.category === 'bank' || currentAssetForForm.category === 'property') ? 1 : (Number(currentAssetForForm.quantity) || 0);
    const finalTickerSymbol = isTrackableCategory ? currentAssetForForm.tickerSymbol?.toUpperCase() : undefined;

    if (isTrackableCategory) {
         if (currentAssetForForm.quantity === undefined || currentAssetForForm.quantity <= 0) {
            toast({ title: "Error", description: "Quantity must be greater than zero for trackable assets.", variant: "destructive" });
            return;
        }
        if (currentAssetForForm.purchasePrice === undefined || currentAssetForForm.purchasePrice < 0) {
            toast({ title: "Error", description: "Purchase price must be zero or positive for trackable assets.", variant: "destructive" });
            return;
        }
    }

    if (currentAssetForForm.id) { 
      const payloadForUpdate: Partial<ContextAsset> & { id: string } = {
        id: currentAssetForForm.id,
        name: finalName,
        category: currentAssetForForm.category!,
        currency: currentAssetForForm.currency!,
        quantity: quantityToSave,
        currentPrice: Number(currentAssetForForm.currentPrice) || 0,
      };
      if (isTrackableCategory) {
        payloadForUpdate.tickerSymbol = finalTickerSymbol;
        payloadForUpdate.purchasePrice = Number(currentAssetForForm.purchasePrice) || 0;
      }
      updateAsset(payloadForUpdate);
      toast({ title: "Asset Updated", description: `${payloadForUpdate.name} has been updated.` });
    } else { 
      const newAssetPayload: Omit<ContextAsset, 'id' | 'lastUpdated'> & { purchasePrice?: number; tickerSymbol?: string; } = {
        name: finalName,
        category: currentAssetForForm.category!,
        currency: currentAssetForForm.currency!,
        quantity: quantityToSave,
        currentPrice: Number(currentAssetForForm.currentPrice) || 0,
      };
      if (isTrackableCategory) {
        newAssetPayload.purchasePrice = Number(currentAssetForForm.purchasePrice) || 0;
        newAssetPayload.tickerSymbol = finalTickerSymbol;
      }
      addAsset(newAssetPayload);
      toast({ title: "Asset Added", description: `${newAssetPayload.name} has been added.` });
    }
    setIsFormOpen(false);
    setCurrentAssetForForm(initialAssetFormState);
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
    const totals: Record<string, {marketValue: number, allTimeGain: number, totalPurchaseCost: number }> = {};
    assetsToSummarize.forEach(asset => {
      if (!totals[asset.currency]) {
        totals[asset.currency] = { marketValue: 0, allTimeGain: 0, totalPurchaseCost: 0 };
      }
      const marketValue = (asset.category === 'bank' || asset.category === 'property')
        ? asset.currentPrice
        : asset.currentPrice * asset.quantity;
      totals[asset.currency].marketValue += marketValue;

      const isTrackableAsset = asset.category === 'stock' || asset.category === 'crypto' || asset.category === 'mutualfund';
      if (isTrackableAsset && asset.purchasePrice !== undefined) {
          const purchaseCostForAsset = asset.purchasePrice * asset.quantity;
          totals[asset.currency].allTimeGain += (marketValue - purchaseCostForAsset);
          totals[asset.currency].totalPurchaseCost += purchaseCostForAsset;
      }
    });
    return totals;
  }, []);

  const portfolioTotalsByCurrency = useMemo(() => calculateTotals(allAssets), [allAssets, calculateTotals]);

  const categorySpecificTotals = useMemo(() => {
    if (activeTab && activeTab !== 'overview') {
      const filteredAssetsForTab = allAssets.filter(asset => asset.category === activeTab);
      return calculateTotals(filteredAssetsForTab);
    }
    return {};
  }, [allAssets, activeTab, calculateTotals]);


  const handleCategoryChangeInForm = (value: AssetCategory) => {
    const newState: Partial<ContextAsset> = { ...currentAssetForForm, category: value, currentPrice: currentAssetForForm.currentPrice || 0 };
    const isNewCategoryTrackable = value === 'stock' || value === 'crypto' || value === 'mutualfund';

    if (isNewCategoryTrackable) {
        newState.purchasePrice = currentAssetForForm?.purchasePrice === undefined ? 0 : currentAssetForForm.purchasePrice;
        newState.quantity = (currentAssetForForm?.quantity === undefined || (currentAssetForForm.quantity === 1 && (currentAssetForForm.category === 'bank' || currentAssetForForm.category === 'property'))) ? 1 : currentAssetForForm.quantity;
        newState.tickerSymbol = currentAssetForForm?.tickerSymbol || '';
    } else { 
        newState.quantity = 1; 
        delete newState.tickerSymbol;
        delete newState.purchasePrice;
    }
    setCurrentAssetForForm(newState);
  };

  const assetLabelMap: Record<AssetCategory, { name: string, quantity: string, purchasePrice: string, tickerSymbol: string, currentPrice: string }> = {
    stock: { name: "Company Name", quantity: "Number of Shares", purchasePrice: "Purchase Price per Share", tickerSymbol: "Stock Ticker (Optional)", currentPrice: "Current Price per Share (Manual Entry)" },
    crypto: { name: "Cryptocurrency Name", quantity: "Quantity Owned", purchasePrice: "Purchase Price per Unit", tickerSymbol: "Crypto Symbol (Optional)", currentPrice: "Current Price per Unit (Manual Entry)" },
    mutualfund: { name: "Fund Name", quantity: "Units Held", purchasePrice: "Purchase Price per Unit", tickerSymbol: "Fund Symbol (Optional)", currentPrice: "Current Price per Unit (NAV - Manual Entry)" },
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
            Manually track your investments and net worth. All prices are user-entered.
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
                            currentAssetForForm?.category === 'crypto' ? 'e.g., BTC' :
                            currentAssetForForm?.category === 'mutualfund' ? 'e.g., VOO' :
                            ''
                        }
                    />
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
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">{currentAssetLabels.purchasePrice}</Label>
                    <Input id="purchasePrice" type="number" value={currentAssetForForm?.purchasePrice === undefined ? '' : currentAssetForForm.purchasePrice} onChange={(e) => setCurrentAssetForForm({...currentAssetForForm, purchasePrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Price per unit at purchase" />
                </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentPrice" className="text-right">{currentAssetLabels.currentPrice}</Label>
                <Input id="currentPrice" type="number" value={currentAssetForForm?.currentPrice === undefined ? '' : currentAssetForForm.currentPrice} onChange={(e) => setCurrentAssetForForm({...currentAssetForForm, currentPrice: parseFloat(e.target.value) || 0 })} className="col-span-3" placeholder="Manually enter current price/value" />
            </div>

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
                            : (totalData.allTimeGain !== 0 ? Infinity : 0); 
                        return (
                            <div key={currency} className="mb-3">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalData.marketValue, currency)}
                                <span className="text-sm text-muted-foreground ml-1">({currency} Total Portfolio)</span>
                            </p>
                            {(totalData.allTimeGain !== 0) && (
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">All-Time Gain/Loss:</span>
                                <span className={totalData.allTimeGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {totalData.allTimeGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <AlertTriangle className="inline h-4 w-4 mr-1" />}
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
                            {isTrackableCategoryForTab && (totalData.allTimeGain !== 0) && (
                                <div className="text-sm flex items-center mt-1">
                                <span className="text-muted-foreground mr-1">All-Time Gain/Loss:</span>
                                <span className={totalData.allTimeGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {totalData.allTimeGain >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <AlertTriangle className="inline h-4 w-4 mr-1" />}
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
                        <AssetCardComponent key={asset.id} asset={asset} onEdit={openForm} onDelete={handleDeleteAsset} />
                    ))}
                </div>
                 {displayedAssets.length > 0 && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    <Info className="inline h-3 w-3 mr-1" />
                    All prices are manually entered by the user. All-time gain/loss is calculated based on purchase price and current price.
                  </div>
                )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

