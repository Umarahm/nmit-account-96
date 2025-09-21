"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface Contact {
    id: number;
    name: string;
    email?: string;
    mobile?: string;
    type: "CUSTOMER" | "VENDOR" | "BOTH";
}

interface Product {
    id: number;
    name: string;
    sku?: string;
    purchasePrice?: string;
    taxPercentage?: string;
    hsnCode?: string;
}

interface VendorBillItem {
    id: string;
    productId: number;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
}

export default function NewVendorBillPage() {
    const [contactId, setContactId] = useState<string>("");
    const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState<string>("");
    const [terms, setTerms] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [items, setItems] = useState<VendorBillItem[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContacts();
        fetchProducts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await fetch("/api/contacts?type=VENDOR");
            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts || []);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/products");
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const addItem = () => {
        const newItem: VendorBillItem = {
            id: Date.now().toString(),
            productId: 0,
            quantity: 1,
            unitPrice: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof VendorBillItem, value: any) => {
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };

                    // Recalculate totals based on current product's tax rate
                    if (field === "quantity" || field === "unitPrice" || field === "discountAmount") {
                        const product = products.find(p => p.id === item.productId);
                        const taxPercentage = product ? parseFloat(product.taxPercentage || "0") : 0;
                        
                        const subtotal = updatedItem.quantity * updatedItem.unitPrice;
                        const taxAmount = (subtotal * taxPercentage) / 100;
                        const discountAmount = updatedItem.discountAmount;
                        updatedItem.taxAmount = taxAmount;
                        updatedItem.totalAmount = subtotal + taxAmount - discountAmount;
                    }

                    return updatedItem;
                }
                return item;
            })
        );
    };

    const handleProductChange = (itemId: string, productId: number) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
            const unitPrice = parseFloat(product.purchasePrice || "0");
            const taxPercentage = parseFloat(product.taxPercentage || "0");
            
            setItems(items.map((item) => {
                if (item.id === itemId) {
                    const quantity = item.quantity;
                    const subtotal = quantity * unitPrice;
                    const taxAmount = (subtotal * taxPercentage) / 100;
                    const discountAmount = item.discountAmount;
                    const totalAmount = subtotal + taxAmount - discountAmount;
                    
                    return {
                        ...item,
                        productId,
                        unitPrice,
                        taxAmount,
                        totalAmount
                    };
                }
                return item;
            }));
        }
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => total + item.totalAmount, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!contactId) {
            alert("Please select a vendor");
            return;
        }
        
        if (items.length === 0) {
            alert("Please add at least one item");
            return;
        }
        
        // Validate that all items have products selected
        const invalidItems = items.filter(item => item.productId === 0);
        if (invalidItems.length > 0) {
            alert("Please select a product for all items");
            return;
        }
        
        setLoading(true);

        try {
            const invoiceData = {
                type: "PURCHASE",
                contactId: parseInt(contactId),
                invoiceDate,
                dueDate,
                terms,
                notes,
                items: items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxAmount: item.taxAmount,
                    discountAmount: item.discountAmount,
                })),
            };

            const response = await fetch("/api/invoices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(invoiceData),
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = `/dashboard/transactions/vendor-bills/${data.invoice.id}`;
            } else {
                const errorData = await response.json();
                alert(`Error creating vendor bill: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while creating the vendor bill");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                    <Link href="/dashboard/transactions/vendor-bills">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Vendor Bills
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New Vendor Bill</h1>
                    <p className="text-muted-foreground">Create a new bill from a vendor</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Bill Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor *</Label>
                                <Select value={contactId} onValueChange={setContactId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contacts.map((contact) => (
                                            <SelectItem key={contact.id} value={contact.id.toString()}>
                                                {contact.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceDate">Bill Date *</Label>
                                <Input
                                    id="invoiceDate"
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="terms">Payment Terms</Label>
                                <Input
                                    id="terms"
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    placeholder="e.g., Net 30"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Bill Items</CardTitle>
                                <CardDescription>Add products to this vendor bill</CardDescription>
                            </div>
                            <Button type="button" onClick={addItem} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
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
                                {items.map((item) => (
                                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Item {items.indexOf(item) + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Product *</Label>
                                                <Select
                                                    value={item.productId === 0 ? "" : item.productId.toString()}
                                                    onValueChange={(value) => handleProductChange(item.id, parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                {product.name}
                                                            </SelectItem>
                                                        ))}
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
                                                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Unit Price *</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Discount</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.discountAmount}
                                                    onChange={(e) => updateItem(item.id, "discountAmount", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                Subtotal: {formatCurrency(item.quantity * item.unitPrice)} |
                                                Tax: {formatCurrency(item.taxAmount)} |
                                                <span className="font-medium">Total: {formatCurrency(item.totalAmount)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Bill Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center text-lg font-medium">
                                <span>Total Amount:</span>
                                <span>{formatCurrency(calculateTotal())}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/transactions/vendor-bills">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Vendor Bill"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

