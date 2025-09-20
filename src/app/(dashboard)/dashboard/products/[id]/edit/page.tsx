"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Package } from "lucide-react";
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

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "GOODS",
        salesPrice: "",
        purchasePrice: "",
        taxPercentage: "",
        hsnCode: "",
        category: ""
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${params.id}`);
                if (!response.ok) throw new Error('Failed to fetch product');

                const data = await response.json();
                setProduct(data.product);
                setFormData({
                    name: data.product.name,
                    type: data.product.type,
                    salesPrice: data.product.salesPrice || "",
                    purchasePrice: data.product.purchasePrice || "",
                    taxPercentage: data.product.taxPercentage || "",
                    hsnCode: data.product.hsnCode || "",
                    category: data.product.category || ""
                });
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        if (params.id) {
            fetchProduct();
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/products/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update product');
            }

            router.push(`/dashboard/products/${params.id}`);
        } catch (error) {
            console.error('Error updating product:', error);
            alert(error instanceof Error ? error.message : 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!product) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading product details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/products/${params.id}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Product
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Edit Product</h1>
                    <p className="text-muted-foreground">
                        Update product information
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Information
                    </CardTitle>
                    <CardDescription>
                        Update the details for this product
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Basic Information</h3>

                                <div>
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="type">Product Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => handleChange('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GOODS">Goods</SelectItem>
                                            <SelectItem value="SERVICE">Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        placeholder="Enter category"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="hsnCode">HSN Code</Label>
                                    <Input
                                        id="hsnCode"
                                        value={formData.hsnCode}
                                        onChange={(e) => handleChange('hsnCode', e.target.value)}
                                        placeholder="Enter HSN code"
                                    />
                                </div>
                            </div>

                            {/* Pricing Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Pricing Information</h3>

                                <div>
                                    <Label htmlFor="salesPrice">Sales Price (₹)</Label>
                                    <Input
                                        id="salesPrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.salesPrice}
                                        onChange={(e) => handleChange('salesPrice', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
                                    <Input
                                        id="purchasePrice"
                                        type="number"
                                        step="0.01"
                                        value={formData.purchasePrice}
                                        onChange={(e) => handleChange('purchasePrice', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                                    <Input
                                        id="taxPercentage"
                                        type="number"
                                        step="0.01"
                                        value={formData.taxPercentage}
                                        onChange={(e) => handleChange('taxPercentage', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-6 border-t">
                            <Button
                                type="submit"
                                disabled={loading || !formData.name}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Updating...' : 'Update Product'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/products/${params.id}`)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
