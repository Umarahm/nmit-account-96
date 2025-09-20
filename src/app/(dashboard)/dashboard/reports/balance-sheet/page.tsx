"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageLayout } from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import {
    Calculator,
    Download,
    Calendar,
    Building2,
    Wallet,
    TrendingUp,
    Minus
} from "lucide-react";

interface BalanceSheetData {
    assets: {
        current: Array<{ name: string; amount: number; accounts: any[] }>;
        fixed: Array<{ name: string; amount: number; accounts: any[] }>;
    };
    liabilities: {
        current: Array<{ name: string; amount: number; accounts: any[] }>;
        longTerm: Array<{ name: string; amount: number; accounts: any[] }>;
    };
    equity: Array<{ name: string; amount: number; accounts: any[] }>;
    totals: {
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
        totalLiabilitiesAndEquity: number;
    };
    ratios: {
        debtToAssetRatio: number;
        equityRatio: number;
        currentRatio: number;
        solvencyRatio: number;
    };
    hasRealData: boolean;
}

export default function BalanceSheetPage() {
    const [timeRange, setTimeRange] = useState("current");
    const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalanceSheetData = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/reports/balance-sheet');
                if (response.ok) {
                    const data = await response.json();
                    setBalanceSheetData(data);
                }
            } catch (error) {
                console.error('Error fetching balance sheet data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalanceSheetData();
    }, []);

    if (loading) {
        return (
            <DashboardPageLayout
                title="Balance Sheet"
                description="Assets, liabilities, and equity snapshot"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading balance sheet data...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (!balanceSheetData) {
        return (
            <DashboardPageLayout
                title="Balance Sheet"
                description="Assets, liabilities, and equity snapshot"
            >
                <div className="text-center py-8">
                    <p>Failed to load balance sheet data</p>
                </div>
            </DashboardPageLayout>
        );
    }

    const { assets, liabilities, equity, totals, ratios } = balanceSheetData;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <DashboardPageLayout
            title="Balance Sheet"
            description="Assets, liabilities, and equity snapshot as of current date"
            actions={
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="current">Current Period</SelectItem>
                            <SelectItem value="previous">Previous Period</SelectItem>
                            <SelectItem value="year">Year End</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Assets Section */}
                <div className="xl:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Assets
                            </CardTitle>
                            <CardDescription>
                                Company resources and holdings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Current Assets */}
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                    Current Assets
                                </h4>
                                <div className="space-y-2">
                                    {assets.current.map((asset) => (
                                        <div key={asset.name} className="flex justify-between items-center py-1">
                                            <span className="text-sm">{asset.name}</span>
                                            <span className="text-sm font-medium">{formatCurrency(asset.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between items-center font-semibold">
                                    <span>Total Current Assets</span>
                                    <span>{formatCurrency(assets.current.reduce((sum, asset) => sum + asset.amount, 0))}</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Fixed Assets */}
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                    Fixed Assets
                                </h4>
                                <div className="space-y-2">
                                    {assets.fixed.map((asset) => (
                                        <div key={asset.name} className={`flex justify-between items-center py-1 ${asset.amount < 0 ? 'text-red-600' : ''}`}>
                                            <span className="text-sm">{asset.name}</span>
                                            <span className="text-sm font-medium">
                                                {asset.amount < 0 ? `(${formatCurrency(Math.abs(asset.amount))})` : formatCurrency(asset.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between items-center font-semibold">
                                    <span>Total Fixed Assets</span>
                                    <span>{formatCurrency(assets.fixed.reduce((sum, asset) => sum + asset.amount, 0))}</span>
                                </div>
                            </div>

                            <Separator className="border-2" />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Assets</span>
                                <span>{formatCurrency(totals.totalAssets)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Liabilities Section */}
                <div className="xl:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Liabilities
                            </CardTitle>
                            <CardDescription>
                                Company obligations and debts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Current Liabilities */}
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                    Current Liabilities
                                </h4>
                                <div className="space-y-2">
                                    {liabilities.current.map((liability) => (
                                        <div key={liability.name} className="flex justify-between items-center py-1">
                                            <span className="text-sm">{liability.name}</span>
                                            <span className="text-sm font-medium">{formatCurrency(liability.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between items-center font-semibold">
                                    <span>Total Current Liabilities</span>
                                    <span>{formatCurrency(liabilities.current.reduce((sum, liab) => sum + liab.amount, 0))}</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Long-term Liabilities */}
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                    Long-term Liabilities
                                </h4>
                                <div className="space-y-2">
                                    {liabilities.longTerm.map((liability) => (
                                        <div key={liability.name} className="flex justify-between items-center py-1">
                                            <span className="text-sm">{liability.name}</span>
                                            <span className="text-sm font-medium">{formatCurrency(liability.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between items-center font-semibold">
                                    <span>Total Long-term Liabilities</span>
                                    <span>{formatCurrency(liabilities.longTerm.reduce((sum, liab) => sum + liab.amount, 0))}</span>
                                </div>
                            </div>

                            <Separator className="border-2" />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Liabilities</span>
                                <span>{formatCurrency(totals.totalLiabilities)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Equity Section */}
                <div className="xl:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Equity
                            </CardTitle>
                            <CardDescription>
                                Owner's stake in the business
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {equity.map((item) => (
                                    <div key={item.name} className="flex justify-between items-center py-1">
                                        <span className="text-sm">{item.name}</span>
                                        <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            <Separator className="border-2" />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Equity</span>
                                <span>{formatCurrency(totals.totalEquity)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Balance Check */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Balance Verification
                    </CardTitle>
                    <CardDescription>
                        Ensuring the balance sheet balances (Assets = Liabilities + Equity)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{formatCurrency(totals.totalAssets)}</div>
                            <div className="text-sm text-muted-foreground">Total Assets</div>
                        </div>
                        <div className="flex items-center justify-center">
                            <Minus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{formatCurrency(totals.totalLiabilitiesAndEquity)}</div>
                            <div className="text-sm text-muted-foreground">Liabilities + Equity</div>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        {Math.abs(totals.totalAssets - totals.totalLiabilitiesAndEquity) < 1000 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                ✓ Balance Sheet Balances
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                ✗ Balance Sheet Does Not Balance
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Key Ratios */}
            <Card>
                <CardHeader>
                    <CardTitle>Key Financial Ratios</CardTitle>
                    <CardDescription>
                        Important ratios derived from the balance sheet
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                                {totals.totalAssets > 0 ? (totals.totalLiabilities / totals.totalAssets).toFixed(2) : '0.00'}
                            </div>
                            <div className="text-sm text-muted-foreground">Debt-to-Asset Ratio</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-green-600">
                                {totals.totalAssets > 0 ? (totals.totalEquity / totals.totalAssets * 100).toFixed(1) : '0.0'}%
                            </div>
                            <div className="text-sm text-muted-foreground">Equity Ratio</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-purple-600">
                                {ratios.currentRatio.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Current Ratio</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-orange-600">
                                {totals.totalLiabilities > 0 ? (totals.totalEquity / totals.totalLiabilities * 100).toFixed(1) : '0.0'}%
                            </div>
                            <div className="text-sm text-muted-foreground">Solvency Ratio</div>
                        </div>
                    </div>
                    {!balanceSheetData.hasRealData && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Showing sample data. Real ratios will be calculated from actual transactions.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}
