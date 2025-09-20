"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageLayout, StatCard, StatsGrid } from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import {
    Package,
    Download,
    Calendar,
    Search,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Filter
} from "lucide-react";

interface StockItem {
    id: number;
    name: string;
    category: string;
    sku: string;
    currentStock: number;
    reorderPoint: number;
    unitCost: number;
    sellingPrice: number;
    totalValue: number;
    lastUpdated: string;
    status: string;
}

interface StockData {
    items: StockItem[];
    summary: {
        totalItems: number;
        totalStockValue: number;
        lowStockItemsCount: number;
        averageStockLevel: number;
        categories: string[];
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    alerts: StockItem[];
}

export default function StockReportPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("value");
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    search: searchTerm,
                    category: categoryFilter,
                    sortBy,
                    page: '1',
                    limit: '50'
                });
                const response = await fetch(`/api/reports/stock?${params}`);
                if (response.ok) {
                    const data = await response.json();
                    setStockData(data);
                }
            } catch (error) {
                console.error('Error fetching stock data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
    }, [searchTerm, categoryFilter, sortBy]);

    if (loading) {
        return (
            <DashboardPageLayout
                title="Stock Report"
                description="Inventory levels, values, and stock movement tracking"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading stock data...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (!stockData) {
        return (
            <DashboardPageLayout
                title="Stock Report"
                description="Inventory levels, values, and stock movement tracking"
            >
                <div className="text-center py-8">
                    <p>Failed to load stock data</p>
                </div>
            </DashboardPageLayout>
        );
    }

    const { items: stockItems, summary, alerts } = stockData;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "good":
                return <Badge className="bg-green-100 text-green-800">Good</Badge>;
            case "low":
                return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
            case "critical":
                return <Badge variant="destructive">Critical</Badge>;
            case "out_of_stock":
                return <Badge variant="destructive" className="bg-red-100 text-red-800">Out of Stock</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    return (
        <DashboardPageLayout
            title="Stock Report"
            description="Inventory levels, values, and stock movement tracking"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Advanced Filter
                    </Button>
                </div>
            }
        >
            {/* Stock Overview Stats */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 4 }}>
                <StatCard
                    title="Total Stock Value"
                    value={formatCurrency(summary.totalStockValue)}
                    icon={<DollarSign className="h-4 w-4" />}
                    description="Current inventory value"
                />
                <StatCard
                    title="Total Items"
                    value={summary.totalItems.toString()}
                    icon={<Package className="h-4 w-4" />}
                    description="Different products"
                />
                <StatCard
                    title="Low Stock Items"
                    value={summary.lowStockItemsCount.toString()}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    description="Need reordering"
                    trend={{
                        value: summary.lowStockItemsCount,
                        label: "items",
                        direction: summary.lowStockItemsCount > 0 ? "down" : "neutral"
                    }}
                />
                <StatCard
                    title="Avg Stock Level"
                    value={summary.averageStockLevel.toFixed(1)}
                    icon={<BarChart3 className="h-4 w-4" />}
                    description="Units per item"
                />
            </StatsGrid>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {summary.categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="value">Sort by Value</SelectItem>
                                <SelectItem value="stock">Sort by Stock</SelectItem>
                                <SelectItem value="name">Sort by Name</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Stock Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Items</CardTitle>
                    <CardDescription>
                        Detailed view of all inventory items ({stockItems.length} items)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-semibold">Product</th>
                                    <th className="text-left p-3 font-semibold">SKU</th>
                                    <th className="text-left p-3 font-semibold">Category</th>
                                    <th className="text-right p-3 font-semibold">Current Stock</th>
                                    <th className="text-right p-3 font-semibold">Reorder Point</th>
                                    <th className="text-right p-3 font-semibold">Unit Cost</th>
                                    <th className="text-right p-3 font-semibold">Selling Price</th>
                                    <th className="text-right p-3 font-semibold">Total Value</th>
                                    <th className="text-center p-3 font-semibold">Status</th>
                                    <th className="text-left p-3 font-semibold">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockItems.map((item) => (
                                    <tr key={item.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3">
                                            <div className="font-medium">{item.name}</div>
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">{item.sku}</td>
                                        <td className="p-3">
                                            <Badge variant="outline">{item.category}</Badge>
                                        </td>
                                        <td className="p-3 text-right font-medium">{item.currentStock}</td>
                                        <td className="p-3 text-right text-muted-foreground">{item.reorderPoint}</td>
                                        <td className="p-3 text-right">{formatCurrency(item.unitCost)}</td>
                                        <td className="p-3 text-right">{formatCurrency(item.sellingPrice)}</td>
                                        <td className="p-3 text-right font-semibold">{formatCurrency(item.totalValue)}</td>
                                        <td className="p-3 text-center">{getStatusBadge(item.status)}</td>
                                        <td className="p-3 text-sm text-muted-foreground">
                                            {new Date(item.lastUpdated).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {stockItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No items found matching your criteria</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stock Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Stock Alerts
                    </CardTitle>
                    <CardDescription>
                        Items requiring attention
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {alerts.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${item.status === "out_of_stock" ? "bg-red-100" :
                                            item.status === "critical" ? "bg-red-100" : "bg-yellow-100"
                                        }`}>
                                        <AlertTriangle className={`h-4 w-4 ${item.status === "out_of_stock" ? "text-red-600" :
                                                item.status === "critical" ? "text-red-600" : "text-yellow-600"
                                            }`} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Current: {item.currentStock} units | Reorder at: {item.reorderPoint} units
                                            {item.status === "out_of_stock" && " - OUT OF STOCK"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(item.totalValue)}</div>
                                    <div className="text-sm text-muted-foreground">Stock value</div>
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>All items are well-stocked!</p>
                                <p className="text-sm">No items require immediate attention</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stock Movement Chart Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Movement Trends</CardTitle>
                    <CardDescription>
                        Stock levels and movement over time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Stock movement chart will be displayed here</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Integration with charting library needed
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}
