
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit3, Trash2, Landmark, BarChartBig, Bitcoin, Building2 } from 'lucide-react';
import Image from 'next/image';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useAssets } from '@/contexts/AssetContext'; // Import useAssets
import type { Asset as ContextAsset } from '@/contexts/AssetContext'; // Import Asset type

const assetIcons = {
  bank: <Landmark className="h-8 w-8 text-blue-500" />,
  stock: <BarChartBig className="h-8 w-8 text-green-500" />,
  crypto: <Bitcoin className="h-8 w-8 text-orange-500" />,
  property: <Building2 className="h-8 w-8 text-purple-500" />,
  mutualfund: <Image src="https://placehold.co/32x32.png" alt="Mutual Fund" width={32} height={32} data-ai-hint="investment chart" className="rounded-full"/>,
};

const assetHistoryData = [
  { date: 'Jan 23', value: 10000 },
  { date: 'Jul 23', value: 12000 },
  { date: 'Jan 24', value: 11500 },
  { date: 'Jul 24', value: 13500 },
  { date: 'Present', value: 14200 },
];

const chartConfig = {
  value: { label: "Value", color: "hsl(var(--primary))" },
};

export default function AssetsPage() {
  const { toast } = useToast();
  // Use assets and functions from context
  const { assets, addAsset, updateAsset, deleteAsset: deleteAssetFromContext } = useAssets();
  const [isFormOpen, setIsFormOpen] = useState(false);
  // currentAsset state now uses Partial<ContextAsset>
  const [currentAsset, setCurrentAsset] = useState<Partial<ContextAsset> | null>(null);

  const openForm = (asset?: ContextAsset) => {
    setCurrentAsset(asset || { name: '', type: 'bank', value: 0 });
    setIsFormOpen(true);
  };

  const handleSaveAsset = () => {
    if (!currentAsset || !currentAsset.name || !currentAsset.type || currentAsset.value == null || currentAsset.value < 0) {
      toast({ title: "Error", description: "Please fill all asset details. Value must be zero or positive.", variant: "destructive"});
      return;
    }

    if (currentAsset.id) {
      // For updating, ensure all required fields of ContextAsset are present
      updateAsset(currentAsset as ContextAsset); // id is present, lastUpdated will be handled by context
      toast({ title: "Asset Updated", description: `${currentAsset.name} has been updated.`});
    } else {
      // For adding, provide Omit<ContextAsset, 'id' | 'lastUpdated'>
      const newAssetData: Omit<ContextAsset, 'id' | 'lastUpdated'> = {
        name: currentAsset.name!, // Assert non-null due to prior validation
        type: currentAsset.type!,
        value: currentAsset.value!,
      };
      addAsset(newAssetData);
      toast({ title: "Asset Added", description: `${newAssetData.name} has been added.`});
    }
    setIsFormOpen(false);
    setCurrentAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    deleteAssetFromContext(id);
    toast({ title: "Asset Deleted", description: `Asset has been removed.`, variant: "destructive"});
  };

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Dashboard</h1>
          <p className="text-muted-foreground">
            Manually track your diverse assets.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentAsset?.id ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
              <DialogDescription>
                Enter the details for your asset. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={currentAsset?.name || ''} onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <Select value={currentAsset?.type || 'bank'} onValueChange={(value: ContextAsset['type']) => setCurrentAsset({...currentAsset, type: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select asset type" />
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
                <Label htmlFor="value" className="text-right">Value</Label>
                <Input id="value" type="number" value={currentAsset?.value === undefined ? '' : currentAsset.value} onChange={(e) => setCurrentAsset({...currentAsset, value: parseFloat(e.target.value) || 0 })} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSaveAsset}>Save Asset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Total Asset Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">${totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => (
          <Card key={asset.id} className="rounded-2xl shadow-lg flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{asset.name}</CardTitle>
                <CardDescription className="capitalize">{asset.type}</CardDescription>
              </div>
              {assetIcons[asset.type]}
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-2xl font-semibold">${asset.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Last updated: {asset.lastUpdated}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => openForm(asset)} aria-label="Edit asset">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteAsset(asset.id)} aria-label="Delete asset">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Historical Asset Value</CardTitle>
          <CardDescription>Overall trend of your asset portfolio.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[350px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assetHistoryData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value/1000}k`} />
                <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="dot" />} />
                <Area type="monotone" dataKey="value" stroke="var(--color-value)" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
