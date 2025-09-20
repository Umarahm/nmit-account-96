'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Contact {
    id: number;
    name: string;
    email?: string;
    mobile?: string;
    type: 'CUSTOMER' | 'VENDOR' | 'BOTH';
}

interface Product {
    id: number;
    name: string;
    sku?: string;
    salesPrice?: string;
    purchasePrice?: string;
    taxPercentage?: string;
    hsnCode?: string;
}

interface InvoiceItem {
    id: string;
    productId: number;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
}

export default function NewInvoicePage() {
    const [type, setType] = useState<'PURCHASE' | 'SALES'>('SALES');
    const [contactId, setContactId] = useState<string>('');
    const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState<string>('');
    const [terms, setTerms] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContacts();
        fetchProducts();
    }, [type]);

    const fetchContacts = async () => {
        try {
            const contactType = type === 'PURCHASE' ? 'VENDOR' : 'CUSTOMER';
            const response = await fetch(`/api/contacts?type=${contactType}`);
            const data = await response.json();

            if (response.ok) {
                setContacts(data.contacts || []);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();

            if (response.ok) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const addItem = () => {
        const newItem: InvoiceItem = {
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

    const updateItem = (id: string, field: keyof InvoiceItem, value: number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Recalculate totals
                if (field === 'quantity' || field === 'unitPrice' || field === 'taxAmount' || field === 'discountAmount') {
                    updatedItem.totalAmount = (updatedItem.quantity * updatedItem.unitPrice) + updatedItem.taxAmount - updatedItem.discountAmount;
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const getProductPrice = (productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return 0;

        return type === 'PURCHASE'
            ? parseFloat(product.purchasePrice || '0')
            : parseFloat(product.salesPrice || '0');
    };

    const calculateTotals = () => {
        const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const discountAmount = items.reduce((sum, item) => sum + item.discountAmount, 0);
        const totalAmount = subTotal + taxAmount - discountAmount;

        return { subTotal, taxAmount, discountAmount, totalAmount };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contactId || items.length === 0) {
            alert('Please select a contact and add at least one item');
            return;
        }

        setLoading(true);

        try {
            const totals = calculateTotals();
            const invoiceData = {
                type,
                contactId: parseInt(contactId),
                invoiceDate,
                dueDate: dueDate || null,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxAmount: item.taxAmount,
                    discountAmount: item.discountAmount,
                })),
                subTotal: totals.subTotal,
                taxAmount: totals.taxAmount,
                discountAmount: totals.discountAmount,
                totalAmount: totals.totalAmount,
                terms: terms || null,
                notes: notes || null,
            };

            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`${type === 'PURCHASE' ? 'Vendor bill' : 'Customer invoice'} created successfully!`);
                // Redirect to invoice detail page
                window.location.href = `/dashboard/invoices/${data.invoice.id}`;
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Error creating invoice');
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/invoices">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New {type === 'PURCHASE' ? 'Vendor Bill' : 'Customer Invoice'}</h1>
                    <p className="text-muted-foreground">
                        Create a new {type === 'PURCHASE' ? 'vendor bill' : 'customer invoice'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>
                                    Enter the basic details for this {type === 'PURCHASE' ? 'bill' : 'invoice'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select value={type} onValueChange={(value: 'PURCHASE' | 'SALES') => setType(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SALES">Customer Invoice</SelectItem>
                                                <SelectItem value="PURCHASE">Vendor Bill</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactId">{type === 'PURCHASE' ? 'Vendor' : 'Customer'}</Label>
                                        <Select value={contactId} onValueChange={setContactId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Select ${type === 'PURCHASE' ? 'vendor' : 'customer'}`} />
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
                                        <Label htmlFor="invoiceDate">Invoice Date</Label>
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
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Items</CardTitle>
                                        <CardDescription>
                                            Add products or services to this {type === 'PURCHASE' ? 'bill' : 'invoice'}
                                        </CardDescription>
                                    </div>
                                    <Button type="button" onClick={addItem}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No items added yet. Click "Add Item" to get started.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-semibold">Item {index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label>Product</Label>
                                                        <Select
                                                            value={item.productId.toString()}
                                                            onValueChange={(value) => {
                                                                const productId = parseInt(value);
                                                                updateItem(item.id, 'productId', productId);
                                                                updateItem(item.id, 'unitPrice', getProductPrice(productId));
                                                            }}
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
                                                        <Label>Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Unit Price</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Tax Amount</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.taxAmount}
                                                            onChange={(e) => updateItem(item.id, 'taxAmount', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Discount</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.discountAmount}
                                                            onChange={(e) => updateItem(item.id, 'discountAmount', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-4 text-right">
                                                    <span className="text-sm text-muted-foreground">Total: </span>
                                                    <span className="font-semibold">
                                                        ₹{item.totalAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                                <CardDescription>
                                    Add terms, conditions, and notes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="terms">Terms & Conditions</Label>
                                    <Textarea
                                        id="terms"
                                        placeholder="Enter terms and conditions..."
                                        value={terms}
                                        onChange={(e) => setTerms(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Enter any additional notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sub Total:</span>
                                    <span>₹{totals.subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax Amount:</span>
                                    <span>₹{totals.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discount:</span>
                                    <span>-₹{totals.discountAmount.toFixed(2)}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total Amount:</span>
                                    <span>₹{totals.totalAmount.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading || items.length === 0}>
                                {loading ? 'Creating...' : `Create ${type === 'PURCHASE' ? 'Bill' : 'Invoice'}`}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/invoices">Cancel</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
