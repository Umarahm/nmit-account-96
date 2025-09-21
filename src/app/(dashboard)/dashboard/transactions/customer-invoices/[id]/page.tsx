"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, Plus, Eye } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
    id: number;
    productId: number;
    productName: string;
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
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    type: "SALES";
    contactId: number;
    contactName: string;
    contactEmail?: string;
    contactMobile?: string;
    contactAddress?: any;
    invoiceDate: string;
    dueDate?: string;
    status: "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
    totalAmount: string;
    taxAmount: string;
    discountAmount: string;
    balanceAmount: string;
    notes?: string;
    items: InvoiceItem[];
    payments: Payment[];
}

export default function CustomerInvoiceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchInvoice();
        }
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/invoices/${id}`);
            const data = await response.json();

            if (response.ok) {
                setInvoice(data);
            } else {
                console.error("Error fetching invoice:", data.error);
            }
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID":
                return "bg-green-100 text-green-800";
            case "UNPAID":
                return "bg-yellow-100 text-yellow-800";
            case "PARTIAL":
                return "bg-blue-100 text-blue-800";
            case "OVERDUE":
                return "bg-red-100 text-red-800";
            case "CANCELLED":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await fetch(`/api/invoices/${id}/pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `invoice-${id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Error downloading PDF");
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Invoice Details</h1>
                        <p className="text-muted-foreground">Loading invoice...</p>
                    </div>
                </div>
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Invoice Not Found</h1>
                        <p className="text-muted-foreground">The invoice you're looking for doesn't exist.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/dashboard/transactions/customer-invoices">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Invoices
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/transactions/customer-invoices">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invoices
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
                        <p className="text-muted-foreground">Invoice for {invoice.contactName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/transactions/customer-invoices/${invoice.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Invoice Status */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                            </Badge>
                            <span className="text-lg font-semibold">
                                {formatCurrency(invoice.totalAmount)}
                            </span>
                            {parseFloat(invoice.balanceAmount) > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    Balance: {formatCurrency(invoice.balanceAmount)}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-medium">
                                {invoice.dueDate ? formatDate(invoice.dueDate) : "N/A"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{invoice.contactName}</p>
                        </div>
                        {invoice.contactEmail && (
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{invoice.contactEmail}</p>
                            </div>
                        )}
                        {invoice.contactMobile && (
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{invoice.contactMobile}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Invoice Date</p>
                            <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
                        </div>
                        {invoice.dueDate && (
                            <div>
                                <p className="text-sm text-muted-foreground">Due Date</p>
                                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {invoice.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-medium">{item.productName}</h4>
                                    {item.productHsnCode && (
                                        <p className="text-sm text-muted-foreground">
                                            HSN: {item.productHsnCode}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} × {formatCurrency(item.unitPrice)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(item.totalAmount)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-lg font-semibold">{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payments */}
            {invoice.payments && invoice.payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invoice.payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">
                                                {payment.paymentNumber || `Payment #${payment.id}`}
                                            </h4>
                                            <Badge className={getStatusColor(payment.status)} variant="outline">
                                                {payment.status}
                                            </Badge>
                                            <Badge variant="outline">{payment.paymentMethod}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(payment.paymentDate)}
                                            {payment.reference && ` • ${payment.reference}`}
                                        </p>
                                        {payment.notes && (
                                            <p className="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-green-600">
                                            +{formatCurrency(payment.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Payment Button */}
            {parseFloat(invoice.balanceAmount) > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Outstanding Balance</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatCurrency(invoice.balanceAmount)} remaining to be paid
                                </p>
                            </div>
                            <Button asChild>
                                <Link href={`/dashboard/transactions/payments/new?invoice=${invoice.id}`}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Record Payment
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

