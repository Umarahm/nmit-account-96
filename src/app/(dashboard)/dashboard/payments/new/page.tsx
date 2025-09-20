'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Invoice {
    id: number;
    invoiceNumber: string;
    contactName: string;
    totalAmount: string;
    balanceAmount: string;
    status: string;
}

export default function NewPaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const [formData, setFormData] = useState({
        invoiceId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'CASH',
        reference: '',
        notes: '',
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/invoices');
            const data = await response.json();

            if (response.ok) {
                // Filter only unpaid or partial invoices
                const payableInvoices = data.invoices.filter((invoice: Invoice) =>
                    ['UNPAID', 'PARTIAL'].includes(invoice.status)
                );
                setInvoices(payableInvoices || []);
            } else {
                console.error('Error fetching invoices:', data.error);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const handleInvoiceChange = (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id.toString() === invoiceId);
        setSelectedInvoice(invoice || null);
        setFormData(prev => ({
            ...prev,
            invoiceId,
            amount: invoice ? invoice.balanceAmount : '',
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.invoiceId || !formData.paymentDate || !formData.amount) {
            alert('Please fill in all required fields');
            return;
        }

        if (!selectedInvoice) {
            alert('Please select a valid invoice');
            return;
        }

        const paymentAmount = parseFloat(formData.amount);
        const balanceAmount = parseFloat(selectedInvoice.balanceAmount);

        if (paymentAmount <= 0) {
            alert('Payment amount must be greater than 0');
            return;
        }

        if (paymentAmount > balanceAmount) {
            alert(`Payment amount cannot exceed the balance due of ₹${balanceAmount.toFixed(2)}`);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoiceId: parseInt(formData.invoiceId),
                    paymentDate: formData.paymentDate,
                    amount: formData.amount,
                    paymentMethod: formData.paymentMethod,
                    reference: formData.reference || undefined,
                    notes: formData.notes || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Payment created successfully!');
                router.push('/dashboard/payments');
            } else {
                alert(`Error creating payment: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Error creating payment');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: string) => {
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Payments
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New Payment</h1>
                    <p className="text-muted-foreground">
                        Record a new payment for an invoice
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Invoice Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Details</CardTitle>
                                <CardDescription>
                                    Select the invoice you want to record payment for
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceId">Invoice *</Label>
                                    <Select value={formData.invoiceId} onValueChange={handleInvoiceChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an invoice" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {invoices.map((invoice) => (
                                                <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                                    {invoice.invoiceNumber} - {invoice.contactName} (Balance: {formatCurrency(invoice.balanceAmount)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedInvoice && (
                                    <div className="bg-muted p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">Invoice Summary</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Invoice:</span>
                                                <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Customer:</span>
                                                <span className="ml-2 font-medium">{selectedInvoice.contactName}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Total Amount:</span>
                                                <span className="ml-2 font-medium">{formatCurrency(selectedInvoice.totalAmount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Balance Due:</span>
                                                <span className="ml-2 font-medium text-orange-600">{formatCurrency(selectedInvoice.balanceAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                                <CardDescription>
                                    Enter the payment information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentDate">Payment Date *</Label>
                                        <Input
                                            id="paymentDate"
                                            type="date"
                                            value={formData.paymentDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Payment Amount *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentMethod">Payment Method *</Label>
                                        <Select
                                            value={formData.paymentMethod}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                                <SelectItem value="CARD">Card</SelectItem>
                                                <SelectItem value="DIGITAL">Digital Wallet</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reference">Reference</Label>
                                        <Input
                                            id="reference"
                                            value={formData.reference}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                                            placeholder="Transaction ID, Cheque number, etc."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Additional payment notes..."
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
                                <CardTitle>Payment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {selectedInvoice ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Invoice Total:</span>
                                            <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Previous Payments:</span>
                                            <span>{formatCurrency((parseFloat(selectedInvoice.totalAmount) - parseFloat(selectedInvoice.balanceAmount)).toString())}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Balance Due:</span>
                                            <span>{formatCurrency(selectedInvoice.balanceAmount)}</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between font-semibold">
                                            <span>Payment Amount:</span>
                                            <span>{formatCurrency(formData.amount || '0')}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-green-600">
                                            <span>Remaining Balance:</span>
                                            <span>
                                                {formatCurrency(
                                                    Math.max(0, parseFloat(selectedInvoice.balanceAmount) - parseFloat(formData.amount || '0')).toString()
                                                )}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        Select an invoice to see payment summary
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading || !selectedInvoice} className="flex-1">
                                {loading ? 'Creating Payment...' : 'Create Payment'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/payments">Cancel</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
