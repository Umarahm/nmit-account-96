"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageLayout } from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import {
    BarChart3,
    Download,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Minus
} from "lucide-react";

interface PNLData {
    period: {
        startDate: string;
        endDate: string;
        period: string;
    };
    revenue: {
        sales: number;
        services: number;
        other: number;
        total: number;
    };
    costOfGoodsSold: {
        materials: number;
        labor: number;
        overhead: number;
        adjustments: number;
        total: number;
    };
    grossProfit: number;
    operatingExpenses: {
        salaries: number;
        rent: number;
        marketing: number;
        supplies: number;
        insurance: number;
        depreciation: number;
        miscellaneous: number;
        total: number;
    };
    operatingProfit: number;
    otherIncomeExpense: {
        interestIncome: number;
        interestExpense: number;
        otherIncome: number;
        otherExpense: number;
        total: number;
    };
    profitBeforeTax: number;
    taxes: {
        incomeTax: number;
        gst: number;
        total: number;
    };
    netProfit: number;
    margins: {
        grossMargin: number;
        operatingMargin: number;
        netMargin: number;
        taxRate: number;
    };
    hasRealData: boolean;
}

export default function ProfitLossPage() {
    const [timeRange, setTimeRange] = useState("current");
    const [pnlData, setPnlData] = useState<PNLData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPNLData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/reports/profit-loss?period=${timeRange}`);
                if (response.ok) {
                    const data = await response.json();
                    setPnlData(data);
                }
            } catch (error) {
                console.error('Error fetching P&L data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPNLData();
    }, [timeRange]);

    if (loading) {
        return (
            <DashboardPageLayout
                title="Profit & Loss Statement"
                description="Revenue, expenses, and profitability analysis"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading P&L statement data...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (!pnlData) {
        return (
            <DashboardPageLayout
                title="Profit & Loss Statement"
                description="Revenue, expenses, and profitability analysis"
            >
                <div className="text-center py-8">
                    <p>Failed to load P&L statement data</p>
                </div>
            </DashboardPageLayout>
        );
    }

    const { revenue, costOfGoodsSold, grossProfit, operatingExpenses, operatingProfit, otherIncomeExpense, profitBeforeTax, taxes, netProfit, margins } = pnlData;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const renderPLSection = (title: string, items: any[], showTotal = true, totalValue?: number) => (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {title}
            </h4>
            {items.map((item) => (
                <div key={item.name} className={`flex justify-between items-center py-1 ${item.amount < 0 ? 'text-red-600' : ''}`}>
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">
                        {item.amount < 0 ? `(${formatCurrency(Math.abs(item.amount))})` : formatCurrency(item.amount)}
                    </span>
                </div>
            ))}
            {showTotal && (
                <>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center font-semibold">
                        <span>Total {title}</span>
                        <span>{totalValue !== undefined ? formatCurrency(totalValue) : formatCurrency(items.reduce((sum, item) => sum + item.amount, 0))}</span>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <DashboardPageLayout
            title="Profit & Loss Statement"
            description="Revenue, expenses, and profitability analysis"
            actions={
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="current">Current Month</SelectItem>
                            <SelectItem value="quarter">Current Quarter</SelectItem>
                            <SelectItem value="year">Current Year</SelectItem>
                            <SelectItem value="previous">Previous Period</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit & Loss Statement */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Profit & Loss Statement
                        </CardTitle>
                        <CardDescription>
                            For the period ending {new Date().toLocaleDateString('en-IN')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Revenue */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                Revenue
                            </h4>
                            <div className="space-y-2">
                                {revenue.sales > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm">Product Sales</span>
                                        <span className="text-sm font-medium">{formatCurrency(revenue.sales)}</span>
                                    </div>
                                )}
                                {revenue.services > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm">Service Revenue</span>
                                        <span className="text-sm font-medium">{formatCurrency(revenue.services)}</span>
                                    </div>
                                )}
                                {revenue.other > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm">Other Income</span>
                                        <span className="text-sm font-medium">{formatCurrency(revenue.other)}</span>
                                    </div>
                                )}
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Revenue</span>
                                <span>{formatCurrency(revenue.total)}</span>
                            </div>
                        </div>

                        <Separator className="border-2" />

                        {/* Cost of Goods Sold */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                Cost of Goods Sold
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(costOfGoodsSold).filter(([key]) => key !== 'total').map(([key, value]) => (
                                    <div key={key} className={`flex justify-between items-center py-1 ${value < 0 ? 'text-red-600' : ''}`}>
                                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="text-sm font-medium">
                                            {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Cost of Goods Sold</span>
                                <span>{formatCurrency(costOfGoodsSold.total)}</span>
                            </div>
                        </div>

                        <Separator className="border-2" />

                        {/* Gross Profit */}
                        <div className="flex justify-between items-center font-bold text-lg bg-muted p-3 rounded-lg">
                            <span>Gross Profit</span>
                            <span className={grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(grossProfit)}
                            </span>
                        </div>

                        <Separator />

                        {/* Operating Expenses */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                Operating Expenses
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(operatingExpenses).filter(([key]) => key !== 'total').map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center py-1">
                                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="text-sm font-medium">{formatCurrency(value)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Operating Expenses</span>
                                <span>{formatCurrency(operatingExpenses.total)}</span>
                            </div>
                        </div>

                        <Separator className="border-2" />

                        {/* Operating Profit */}
                        <div className="flex justify-between items-center font-bold text-lg bg-muted p-3 rounded-lg">
                            <span>Operating Profit (EBIT)</span>
                            <span className={operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(operatingProfit)}
                            </span>
                        </div>

                        <Separator />

                        {/* Other Income/Expense */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                Other Income & Expenses
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(otherIncomeExpense).filter(([key]) => key !== 'total').map(([key, value]) => (
                                    <div key={key} className={`flex justify-between items-center py-1 ${value < 0 ? 'text-red-600' : ''}`}>
                                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="text-sm font-medium">
                                            {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center font-semibold">
                                <span>Net Other Income/Expense</span>
                                <span className={otherIncomeExpense.total >= 0 ? '' : 'text-red-600'}>
                                    {otherIncomeExpense.total >= 0 ? formatCurrency(otherIncomeExpense.total) : `(${formatCurrency(Math.abs(otherIncomeExpense.total))})`}
                                </span>
                            </div>
                        </div>

                        <Separator className="border-2" />

                        {/* Profit Before Tax */}
                        <div className="flex justify-between items-center font-bold text-lg bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span>Profit Before Tax</span>
                            <span className={profitBeforeTax >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(profitBeforeTax)}
                            </span>
                        </div>

                        <Separator />

                        {/* Taxes */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                Taxes
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(taxes).filter(([key]) => key !== 'total').map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center py-1">
                                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="text-sm font-medium">{formatCurrency(value)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-3" />
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Taxes</span>
                                <span>{formatCurrency(taxes.total)}</span>
                            </div>
                        </div>

                        <Separator className="border-4 border-primary" />

                        {/* Net Profit */}
                        <div className="flex justify-between items-center font-bold text-xl bg-green-50 p-4 rounded-lg border border-green-200">
                            <span>Net Profit</span>
                            <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(netProfit)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Gross Margin</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {margins.grossMargin.toFixed(1)}%
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Operating Margin</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {margins.operatingMargin.toFixed(1)}%
                                </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Net Margin</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {margins.netMargin.toFixed(1)}%
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {margins.taxRate.toFixed(1)}%
                                </p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue vs Expenses Chart Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue vs Expenses Trend</CardTitle>
                    <CardDescription>
                        Monthly comparison of revenue and expenses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Revenue vs Expenses chart will be displayed here</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Integration with charting library needed
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profitability Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Profitability Insights</CardTitle>
                    <CardDescription>
                        Key observations from the P&L statement
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-800">Strong Gross Margins</h4>
                                <p className="text-sm text-green-700">
                                    Gross margin of {((grossProfit / totalRevenue) * 100).toFixed(1)}% indicates efficient cost management in production.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-800">Healthy Operating Profit</h4>
                                <p className="text-sm text-blue-700">
                                    Operating margin of {((operatingProfit / totalRevenue) * 100).toFixed(1)}% shows good control over operating expenses.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <DollarSign className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-orange-800">Tax Efficiency</h4>
                                <p className="text-sm text-orange-700">
                                    Effective tax rate of {((totalTaxes / profitBeforeTax) * 100).toFixed(1)}% is within reasonable limits.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-purple-800">Net Profit Growth</h4>
                                <p className="text-sm text-purple-700">
                                    Net profit represents {((netProfit / totalRevenue) * 100).toFixed(1)}% of revenue, showing sustainable profitability.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}
