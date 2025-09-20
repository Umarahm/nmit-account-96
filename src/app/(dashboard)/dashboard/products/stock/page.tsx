"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ArrowLeft,
    Package,
    Search,
    RefreshCw,
    Download,
    AlertTriangle,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import Link from "next/link";

interface StockItem {
    id: number;
    name: string;
    type: string;
    category: string | null;
    hsnCode: string | null;
    salesPrice: string | null;
    purchasePrice: string | null;
    totalPurchased: number;
    totalSold: number;
    currentStock: number;
    stockValue: number;
}

interface StockSummary {
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: number;
}

interface StockReport {
    stockReport: StockItem[];
    summary: StockSummary;
}

export default function StockReportPage() {
    const [stockData, setStockData] = useState<StockReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [categories, setCategories] = useState<{ name: string, count: number }[]>([]);

    const fetchStockReport = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ...(search && { search }),
                ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
            });

            const response = await fetch(`/api/products/stock?${params}`);
            if (!response.ok) throw new Error('Failed to fetch stock report');

            const data: StockReport = await response.json();
            setStockData(data);
        } catch (error) {
            console.error('Error fetching stock report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/products/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();
            setCategories(data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchStockReport();
        fetchCategories();
    }, [search, categoryFilter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const getStockStatus = (stock: number) => {
        if (stock <= 0) return { status: 'Out of Stock', variant: 'destructive' as const };
        if (stock <= 5) return { status: 'Low Stock', variant: 'secondary' as const };
        return { status: 'In Stock', variant: 'default' as const };
    };

    const filteredItems = stockData?.stockReport.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/products">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Stock Report</h1>
                        <p className="text-muted-foreground">
                            View current stock levels and inventory valuation
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchStockReport}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {stockData?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                                    <p className="text-2xl font-bold">{stockData.summary.totalProducts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(stockData.summary.totalStockValue)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <AlertTriangle className="h-8 w-8 text-orange-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {stockData.summary.lowStockItems}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <TrendingDown className="h-8 w-8 text-red-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {filteredItems.filter(item => item.currentStock <= 0).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.name} value={cat.name}>
                                            {cat.name} ({cat.count})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" onClick={() => {
                                setSearch("");
                                setCategoryFilter("ALL");
                            }}>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stock Report Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Report</CardTitle>
                    <CardDescription>
                        Current stock levels and inventory valuation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading stock report...</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No stock data found</h3>
                            <p className="text-muted-foreground mb-4">
                                {search || categoryFilter !== 'ALL'
                                    ? 'Try adjusting your search filters'
                                    : 'No products available for stock report'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredItems.map((item) => {
                                const stockStatus = getStockStatus(item.currentStock);
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <h3 className="font-medium">{item.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant="secondary">{item.type}</Badge>
                                                        {item.category && (
                                                            <Badge variant="outline">{item.category}</Badge>
                                                        )}
                                                        {item.hsnCode && (
                                                            <span>HSN: {item.hsnCode}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground">Current Stock</div>
                                                <div className="text-lg font-bold">{item.currentStock}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground">Purchased</div>
                                                <div className="text-lg font-bold text-blue-600">{item.totalPurchased}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground">Sold</div>
                                                <div className="text-lg font-bold text-green-600">{item.totalSold}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground">Stock Value</div>
                                                <div className="text-lg font-bold">{formatCurrency(item.stockValue)}</div>
                                            </div>
                                            <div className="text-center">
                                                <Badge variant={stockStatus.variant}>
                                                    {stockStatus.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
