"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageLayout } from "@/components/layout";
import { Plus, Minus, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Contact {
    id: number;
    name: string;
    email?: string;
    mobile?: string;
}

interface Product {
    id: number;
    name: string;
    purchasePrice: string | null;
    taxPercentage: string | null;
    hsnCode?: string | null;
}

interface OrderItem {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
}

export default function NewPurchaseOrderPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [vendorId, setVendorId] = useState("");
    const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState("");

    // Data for dropdowns
    const [vendors, setVendors] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Order items
    const [items, setItems] = useState<OrderItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    // Fetch vendors and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                // Fetch vendors
                const vendorsResponse = await fetch('/api/contacts?type=VENDOR');
                if (vendorsResponse.ok) {
                    const vendorsData = await vendorsResponse.json();
                    setVendors(vendorsData.contacts || []);
                }

                // Fetch products
                const productsResponse = await fetch('/api/products');
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    console.log('Fetched products:', productsData.products);
                    setProducts(productsData.products || []);
                } else {
                    console.error('Failed to fetch products:', productsResponse.status);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoadingData(false);
            }
        };

        if (session) {
            fetchData();
        }
    }, [session]);

    // Calculate total when items change
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.totalAmount, 0);
        setTotalAmount(total);
    }, [items]);

    const addItem = () => {
        setItems([...items, {
            productId: 0,
            productName: '',
            quantity: 1,
            unitPrice: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0
        }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate item total
        const item = newItems[index];
        const subtotal = item.quantity * item.unitPrice;
        const taxAmount = (subtotal * parseFloat(item.taxAmount.toString())) / 100;
        const discountAmount = parseFloat(item.discountAmount.toString());
        item.totalAmount = subtotal + taxAmount - discountAmount;

        setItems(newItems);
    };

    const handleProductChange = (index: number, productId: number) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            updateItem(index, 'productId', productId);
            updateItem(index, 'productName', product.name);
            updateItem(index, 'unitPrice', parseFloat(product.purchasePrice || '0'));
            updateItem(index, 'taxAmount', parseFloat(product.taxPercentage || '0'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!vendorId || items.length === 0) {
            setError('Please select a vendor and add at least one item');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vendorId: parseInt(vendorId),
                    orderDate,
                    notes,
                    items: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxAmount: item.taxAmount,
                        discountAmount: item.discountAmount
                    }))
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create purchase order');
            }

            const data = await response.json();
            router.push(`/dashboard/purchase-orders/${data.order.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <DashboardPageLayout
                title="New Purchase Order"
                description="Create a new purchase order"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (!session) {
        return (
            <DashboardPageLayout
                title="New Purchase Order"
                description="Create a new purchase order"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p>Please sign in to create purchase orders.</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title="New Purchase Order"
            description="Create a new purchase order"
            actions={
                <Button variant="outline" asChild>
                    <Link href="/dashboard/purchase-orders">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Link>
                </Button>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                        <CardDescription>
                            Basic information for the purchase order
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor *</Label>
                                <Select value={vendorId} onValueChange={setVendorId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="orderDate">Order Date *</Label>
                                <Input
                                    id="orderDate"
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes for this order..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Order Items</CardTitle>
                                <CardDescription>
                                    Add products to this purchase order
                                </CardDescription>
                            </div>
                            <Button type="button" onClick={addItem} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No items added yet</p>
                                <p className="text-sm">Click "Add Item" to start adding products</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Item {index + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Product *</Label>
                                                <Select
                                                    value={item.productId > 0 ? item.productId.toString() : ""}
                                                    onValueChange={(value) => {
                                                        console.log('Product selected:', value);
                                                        handleProductChange(index, parseInt(value));
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {loadingData ? (
                                                            <SelectItem value="" disabled>
                                                                Loading products...
                                                            </SelectItem>
                                                        ) : products.length === 0 ? (
                                                            <SelectItem value="" disabled>
                                                                No products available
                                                            </SelectItem>
                                                        ) : (
                                                            products.map((product) => (
                                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                                    {product.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Quantity *</Label>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Unit Price *</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Discount Amount</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.discountAmount}
                                                    onChange={(e) => updateItem(index, 'discountAmount', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                Subtotal: ₹{(item.quantity * item.unitPrice).toFixed(2)} |
                                                Tax: ₹{item.taxAmount.toFixed(2)} |
                                                <span className="font-medium"> Total: ₹{item.totalAmount.toFixed(2)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Summary */}
                {items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center text-lg font-medium">
                                <span>Total Amount:</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/purchase-orders">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={loading || items.length === 0}>
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Create Order
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </DashboardPageLayout>
    );
}
