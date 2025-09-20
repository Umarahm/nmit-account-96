"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Package,
    DollarSign,
    Percent,
    Hash,
    Tag
} from "lucide-react";
import Link from "next/link";

interface Product {
    id: number;
    name: string;
    type: string;
    salesPrice: string | null;
    purchasePrice: string | null;
    taxPercentage: string | null;
    hsnCode: string | null;
    category: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${params.id}`);
                if (!response.ok) throw new Error('Failed to fetch product');

                const data = await response.json();
                setProduct(data.product);
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProduct();
        }
    }, [params.id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/products/${params.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete product');

            router.push('/dashboard/products');
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const formatCurrency = (amount: string | null) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Product not found</h3>
                <p className="text-muted-foreground mb-4">
                    The product you're looking for doesn't exist or has been deleted.
                </p>
                <Button asChild>
                    <Link href="/dashboard/products">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Link>
                </Button>
            </div>
        );
    }

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
                        <h1 className="text-3xl font-bold">{product.name}</h1>
                        <p className="text-muted-foreground">
                            Product Details
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Information */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                                    <p className="text-lg font-medium">{product.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                                    <div className="mt-1">
                                        <Badge variant="secondary">{product.type}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                                    <p className="text-lg">{product.category || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">HSN Code</label>
                                    <p className="text-lg">{product.hsnCode || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Pricing Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Sales Price</label>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(product.salesPrice)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(product.purchasePrice)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tax Percentage</label>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {product.taxPercentage ? `${product.taxPercentage}%` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <Badge variant={product.isActive ? "default" : "secondary"}>
                                        {product.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Created</span>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(product.createdAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Last Updated</span>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(product.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" asChild>
                                <Link href={`/dashboard/products/${product.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Product
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/sales-orders/new">
                                    <Package className="h-4 w-4 mr-2" />
                                    Create Sales Order
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/dashboard/purchase-orders/new">
                                    <Package className="h-4 w-4 mr-2" />
                                    Create Purchase Order
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
