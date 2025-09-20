"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageLayout, StatCard, StatsGrid } from "@/components/layout";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    PieChart
} from "lucide-react";

interface FinancialData {
    metrics: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
        outstandingReceivables: number;
        outstandingPayables: number;
        paymentsReceived: number;
        paymentsMade: number;
    };
    trends: {
        revenueChange: number;
        expenseChange: number;
        profitChange: number;
    };
    breakdowns: {
        revenue: Array<{
            category: string;
            amount: number;
            percentage: number;
        }>;
    };
}

export default function FinancialReportsPage() {
    const [timeRange, setTimeRange] = useState("30d");
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    useEffect(() => {
        const fetchFinancialData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/reports/financial?period=${timeRange}`);
                if (response.ok) {
                    const data = await response.json();
                    setFinancialData(data);
                }
            } catch (error) {
                console.error('Error fetching financial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancialData();
    }, [timeRange]);

    if (loading) {
        return (
            <DashboardPageLayout
                title="Financial Reports"
                description="Comprehensive financial overview and analytics"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading financial data...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    const financialMetrics = financialData ? [
        {
            title: "Total Revenue",
            value: formatCurrency(financialData.metrics.totalRevenue),
            change: `${financialData.trends.revenueChange >= 0 ? '+' : ''}${financialData.trends.revenueChange.toFixed(1)}%`,
            trend: financialData.trends.revenueChange >= 0 ? "up" : "down",
            period: "vs previous period",
            icon: <DollarSign className="h-4 w-4" />
        },
        {
            title: "Total Expenses",
            value: formatCurrency(financialData.metrics.totalExpenses),
            change: `${financialData.trends.expenseChange >= 0 ? '+' : ''}${financialData.trends.expenseChange.toFixed(1)}%`,
            trend: financialData.trends.expenseChange >= 0 ? "up" : "down",
            period: "vs previous period",
            icon: <BarChart3 className="h-4 w-4" />
        },
        {
            title: "Net Profit",
            value: formatCurrency(financialData.metrics.netProfit),
            change: `${financialData.trends.profitChange >= 0 ? '+' : ''}${financialData.trends.profitChange.toFixed(1)}%`,
            trend: financialData.trends.profitChange >= 0 ? "up" : "down",
            period: "vs previous period",
            icon: <TrendingUp className="h-4 w-4" />
        },
        {
            title: "Profit Margin",
            value: `${financialData.metrics.profitMargin.toFixed(1)}%`,
            change: "0.0%",
            trend: "neutral",
            period: "current period",
            icon: <Activity className="h-4 w-4" />
        }
    ] : [];

    const revenueBreakdown = financialData?.breakdowns.revenue.map(item => ({
        category: item.category,
        amount: formatCurrency(item.amount),
        percentage: item.percentage,
        color: item.category.toLowerCase().includes('sales') ? "bg-blue-500" :
            item.category.toLowerCase().includes('service') ? "bg-green-500" : "bg-orange-500"
    })) || [];

    // Sample expense breakdown (would need real expense categorization)
    const expenseBreakdown = [
        { category: "Cost of Goods", amount: formatCurrency(financialData?.metrics.totalExpenses * 0.51 || 0), percentage: 51, color: "bg-red-500" },
        { category: "Operating Expenses", amount: formatCurrency(financialData?.metrics.totalExpenses * 0.30 || 0), percentage: 30, color: "bg-purple-500" },
        { category: "Taxes", amount: formatCurrency(financialData?.metrics.totalExpenses * 0.12 || 0), percentage: 12, color: "bg-yellow-500" },
        { category: "Other", amount: formatCurrency(financialData?.metrics.totalExpenses * 0.07 || 0), percentage: 7, color: "bg-gray-500" }
    ];

    return (
        <DashboardPageLayout
            title="Financial Reports"
            description="Comprehensive financial overview and analytics"
            actions={
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 3 months</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            }
        >
            {/* Key Financial Metrics */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 4 }}>
                {financialMetrics.map((metric) => (
                    <StatCard
                        key={metric.title}
                        title={metric.title}
                        value={metric.value}
                        icon={metric.icon}
                        description={metric.period}
                        trend={{
                            value: parseFloat(metric.change),
                            label: metric.change,
                            direction: metric.trend as "up" | "down" | "neutral"
                        }}
                    />
                ))}
            </StatsGrid>

            {/* Revenue & Expense Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Revenue Breakdown
                        </CardTitle>
                        <CardDescription>
                            Revenue sources and their contributions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {revenueBreakdown.map((item) => (
                            <div key={item.category} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{item.category}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{item.amount}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {item.percentage}%
                                        </Badge>
                                    </div>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${item.color}`}
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Expense Breakdown
                        </CardTitle>
                        <CardDescription>
                            Expense categories and their proportions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {expenseBreakdown.map((item) => (
                            <div key={item.category} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{item.category}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{item.amount}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {item.percentage}%
                                        </Badge>
                                    </div>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${item.color}`}
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Financial Trends & Charts Placeholder */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>
                            Monthly revenue over the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                            <div className="text-center">
                                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Integration with charting library needed
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profit Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profit Trend</CardTitle>
                        <CardDescription>
                            Net profit over the selected period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                            <div className="text-center">
                                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Profit chart will be displayed here</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Integration with charting library needed
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Key Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Key Financial Insights</CardTitle>
                    <CardDescription>
                        Important observations from your financial data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <ArrowUpRight className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-800">Strong Growth</h4>
                                <p className="text-sm text-green-700">
                                    Revenue increased by 12.5% compared to last month, indicating healthy business growth.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-800">Healthy Margins</h4>
                                <p className="text-sm text-blue-700">
                                    Profit margin of 32.9% is above industry average, showing good operational efficiency.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-orange-800">Cost Management</h4>
                                <p className="text-sm text-orange-700">
                                    Operating expenses are well-controlled at 30% of total expenses.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <PieChart className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-purple-800">Diversified Revenue</h4>
                                <p className="text-sm text-purple-700">
                                    Multiple revenue streams provide stability and reduce business risk.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}
