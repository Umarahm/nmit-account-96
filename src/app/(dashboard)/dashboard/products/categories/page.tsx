"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Package,
    Plus,
    Search,
    RefreshCw,
    Edit,
    Trash2
} from "lucide-react";
import Link from "next/link";

interface Category {
    name: string;
    count: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();
            setCategories(data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase())
    );

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
                        <h1 className="text-3xl font-bold">Product Categories</h1>
                        <p className="text-muted-foreground">
                            Manage product categories and organization
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchCategories}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/products/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Categories Overview
                    </CardTitle>
                    <CardDescription>
                        View and manage your product categories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search categories..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading categories...</span>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">
                                {search ? 'No categories found' : 'No categories available'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {search
                                    ? 'Try adjusting your search terms'
                                    : 'Categories will appear here when you add products with categories'
                                }
                            </p>
                            {!search && (
                                <Button asChild>
                                    <Link href="/dashboard/products/new">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Product
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCategories.map((category) => (
                                <div
                                    key={category.name}
                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium text-lg">{category.name}</h3>
                                        <Badge variant="secondary">{category.count}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {category.count} product{category.count !== 1 ? 's' : ''}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/products?category=${encodeURIComponent(category.name)}`}>
                                                View Products
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Statistics */}
            {categories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                                    <p className="text-2xl font-bold">{categories.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                                    <p className="text-2xl font-bold">
                                        {categories.reduce((sum, cat) => sum + cat.count, 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Average per Category</p>
                                    <p className="text-2xl font-bold">
                                        {Math.round(categories.reduce((sum, cat) => sum + cat.count, 0) / categories.length)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
