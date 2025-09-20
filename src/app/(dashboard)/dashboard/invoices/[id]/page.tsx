'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Download, Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

interface InvoiceItem {
    id: number;
    productId: number;
    productName: string;
    productSku?: string;
    productHsnCode?: string;
    quantity: string;
    unitPrice: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
}

interface Payment {
    id: number;
    paymentNumber?: string;
    paymentDate: string;
    amount: string;
    paymentMethod: string;
    reference?: string;
    status: string;
    notes?: string;
    createdAt: string;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    type: 'PURCHASE' | 'SALES';
    contactId: number;
    contactName: string;
    contactEmail?: string;
    contactMobile?: string;
    contactAddress?: any;
    orderId?: number;
    invoiceDate: string;
    dueDate?: string;
    status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
    subTotal: string;
    totalAmount: string;
    taxAmount: string;
    discountAmount: string;
    paidAmount: string;
    balanceAmount: string;
    currency: string;
    terms?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    items: InvoiceItem[];
    payments: Payment[];
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'CASH',
        reference: '',
        notes: '',
    });
    const [creatingPayment, setCreatingPayment] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchInvoice();
        }
    }, [params.id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/invoices/${params.id}`);
            const data = await response.json();

            if (response.ok) {
                setInvoice(data.invoice);
            } else {
                console.error('Error fetching invoice:', data.error);
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;

        try {
            const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${invoice.invoiceNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Error downloading PDF');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    };

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!invoice) return;

        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        const currentBalance = parseFloat(invoice.balanceAmount);
        const paymentAmount = parseFloat(paymentForm.amount);

        if (paymentAmount > currentBalance) {
            alert(`Payment amount cannot exceed the balance due of ₹${currentBalance.toFixed(2)}`);
            return;
        }

        setCreatingPayment(true);

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    paymentDate: paymentForm.paymentDate,
                    amount: paymentForm.amount,
                    paymentMethod: paymentForm.paymentMethod,
                    reference: paymentForm.reference || undefined,
                    notes: paymentForm.notes || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Payment created successfully!');
                setIsPaymentModalOpen(false);
                setPaymentForm({
                    paymentDate: new Date().toISOString().split('T')[0],
                    amount: '',
                    paymentMethod: 'CASH',
                    reference: '',
                    notes: '',
                });
                // Refresh invoice data to show updated payments and balance
                fetchInvoice();
            } else {
                alert(`Error creating payment: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Error creating payment');
        } finally {
            setCreatingPayment(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800';
            case 'UNPAID':
                return 'bg-yellow-100 text-yellow-800';
            case 'PARTIAL':
                return 'bg-blue-100 text-blue-800';
            case 'OVERDUE':
                return 'bg-red-100 text-red-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: string, currency: string = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-muted rounded"></div>
                        <div className="h-32 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Invoice not found</h1>
                    <p className="text-muted-foreground">The invoice you're looking for doesn't exist.</p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard/invoices">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invoices
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const isPurchase = invoice.type === 'PURCHASE';
    const documentTitle = isPurchase ? 'Vendor Bill' : 'Customer Invoice';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/invoices">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">{documentTitle}</h1>
                        <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {invoice.invoiceNumber} • {formatDate(invoice.invoiceDate)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {isPurchase ? 'Vendor' : 'Customer'} Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="font-semibold">{invoice.contactName}</p>
                                {invoice.contactEmail && <p className="text-sm text-muted-foreground">{invoice.contactEmail}</p>}
                                {invoice.contactMobile && <p className="text-sm text-muted-foreground">{invoice.contactMobile}</p>}
                                {invoice.contactAddress && (
                                    <p className="text-sm text-muted-foreground">
                                        {typeof invoice.contactAddress === 'string'
                                            ? invoice.contactAddress
                                            : JSON.stringify(invoice.contactAddress)
                                        }
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {invoice.items.map((item, index) => (
                                    <div key={item.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold">{item.productName}</h4>
                                                {item.productSku && (
                                                    <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                                                )}
                                                {item.productHsnCode && (
                                                    <p className="text-sm text-muted-foreground">HSN: {item.productHsnCode}</p>
                                                )}
                                            </div>
                                            <p className="font-semibold">
                                                {formatCurrency(item.totalAmount, invoice.currency)}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                                            <div>
                                                <span className="font-medium">Qty:</span> {item.quantity}
                                            </div>
                                            <div>
                                                <span className="font-medium">Rate:</span> {formatCurrency(item.unitPrice, invoice.currency)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Tax:</span> {formatCurrency(item.taxAmount, invoice.currency)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Discount:</span> {formatCurrency(item.discountAmount, invoice.currency)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Terms and Notes */}
                    {(invoice.terms || invoice.notes) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {invoice.terms && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                                        <p className="text-sm text-muted-foreground">{invoice.terms}</p>
                                    </div>
                                )}
                                {invoice.notes && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Notes</h4>
                                        <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sub Total:</span>
                                <span>{formatCurrency(invoice.subTotal, invoice.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax Amount:</span>
                                <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount:</span>
                                <span>-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total Amount:</span>
                                <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                            </div>
                            {parseFloat(invoice.paidAmount) > 0 && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Paid Amount:</span>
                                        <span>{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <span>Balance Due:</span>
                                        <span>{formatCurrency(invoice.balanceAmount, invoice.currency)}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Payments</CardTitle>
                                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Payment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Add Payment</DialogTitle>
                                            <DialogDescription>
                                                Record a payment for this invoice. Current balance: ₹{invoice.balanceAmount}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreatePayment}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="paymentDate" className="text-right">
                                                        Date
                                                    </Label>
                                                    <Input
                                                        id="paymentDate"
                                                        type="date"
                                                        value={paymentForm.paymentDate}
                                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                                                        className="col-span-3"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="amount" className="text-right">
                                                        Amount
                                                    </Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={paymentForm.amount}
                                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                                        className="col-span-3"
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="paymentMethod" className="text-right">
                                                        Method
                                                    </Label>
                                                    <Select
                                                        value={paymentForm.paymentMethod}
                                                        onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                                                    >
                                                        <SelectTrigger className="col-span-3">
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
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="reference" className="text-right">
                                                        Reference
                                                    </Label>
                                                    <Input
                                                        id="reference"
                                                        value={paymentForm.reference}
                                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                                                        className="col-span-3"
                                                        placeholder="Transaction ID, Cheque number, etc."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="notes" className="text-right">
                                                        Notes
                                                    </Label>
                                                    <Textarea
                                                        id="notes"
                                                        value={paymentForm.notes}
                                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                                        className="col-span-3"
                                                        placeholder="Additional notes..."
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={creatingPayment}>
                                                    {creatingPayment ? 'Creating...' : 'Create Payment'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {invoice.payments.length > 0 ? (
                                <div className="space-y-3">
                                    {invoice.payments.map((payment) => (
                                        <div key={payment.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold">
                                                        {payment.paymentNumber || `Payment #${payment.id}`}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(payment.paymentDate)}
                                                    </p>
                                                </div>
                                                <p className="font-semibold">
                                                    {formatCurrency(payment.amount, invoice.currency)}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">
                                                    {payment.paymentMethod}
                                                    {payment.reference && ` • ${payment.reference}`}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {payment.status}
                                                </Badge>
                                            </div>
                                            {payment.notes && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {payment.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No payments recorded
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
