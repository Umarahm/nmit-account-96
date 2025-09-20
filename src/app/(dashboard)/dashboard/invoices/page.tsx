'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, Eye, Edit, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
    id: number;
    invoiceNumber: string;
    type: 'PURCHASE' | 'SALES';
    contactName: string;
    invoiceDate: string;
    dueDate?: string;
    status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
    totalAmount: string;
    balanceAmount: string;
    currency: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        type: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, [filter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter.type) params.append('type', filter.type);
            if (filter.status) params.append('status', filter.status);

            const response = await fetch(`/api/invoices?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                let filteredInvoices = data.invoices;

                if (filter.search) {
                    filteredInvoices = filteredInvoices.filter((invoice: Invoice) =>
                        invoice.invoiceNumber.toLowerCase().includes(filter.search.toLowerCase()) ||
                        invoice.contactName.toLowerCase().includes(filter.search.toLowerCase())
                    );
                }

                setInvoices(filteredInvoices);
            } else {
                console.error('Error fetching invoices:', data.error);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
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

    const handleDownloadPDF = async (invoiceId: number) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-${invoiceId}.pdf`;
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

    const purchaseInvoices = invoices.filter(invoice => invoice.type === 'PURCHASE');
    const salesInvoices = invoices.filter(invoice => invoice.type === 'SALES');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Invoices & Bills</h1>
                    <p className="text-muted-foreground">
                        Manage customer invoices and vendor bills
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/dashboard/invoices/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Invoice
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/invoices/new-bill">
                            <Plus className="w-4 h-4 mr-2" />
                            New Bill
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoices..."
                                    value={filter.search}
                                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={filter.type}
                                onValueChange={(value) => setFilter({ ...filter, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Types</SelectItem>
                                    <SelectItem value="SALES">Sales Invoices</SelectItem>
                                    <SelectItem value="PURCHASE">Purchase Bills</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={filter.status}
                                onValueChange={(value) => setFilter({ ...filter, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="PARTIAL">Partial</SelectItem>
                                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Actions</label>
                            <Button
                                variant="outline"
                                onClick={fetchInvoices}
                                className="w-full"
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices List */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Invoices ({invoices.length})</TabsTrigger>
                    <TabsTrigger value="sales">Sales Invoices ({salesInvoices.length})</TabsTrigger>
                    <TabsTrigger value="purchase">Purchase Bills ({purchaseInvoices.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <InvoiceList
                        invoices={invoices}
                        loading={loading}
                        onDownloadPDF={handleDownloadPDF}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                    />
                </TabsContent>

                <TabsContent value="sales" className="space-y-4">
                    <InvoiceList
                        invoices={salesInvoices}
                        loading={loading}
                        onDownloadPDF={handleDownloadPDF}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                    />
                </TabsContent>

                <TabsContent value="purchase" className="space-y-4">
                    <InvoiceList
                        invoices={purchaseInvoices}
                        loading={loading}
                        onDownloadPDF={handleDownloadPDF}
                        getStatusColor={getStatusColor}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface InvoiceListProps {
    invoices: Invoice[];
    loading: boolean;
    onDownloadPDF: (id: number) => void;
    getStatusColor: (status: string) => string;
    formatCurrency: (amount: string, currency?: string) => string;
    formatDate: (dateString: string) => string;
}

function InvoiceList({
    invoices,
    loading,
    onDownloadPDF,
    getStatusColor,
    formatCurrency,
    formatDate
}: InvoiceListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No invoices found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {invoices.map((invoice) => (
                <Card key={invoice.id}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                                    <Badge className={getStatusColor(invoice.status)}>
                                        {invoice.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {invoice.type === 'PURCHASE' ? 'Vendor' : 'Customer'}: {invoice.contactName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Date: {formatDate(invoice.invoiceDate)}
                                    {invoice.dueDate && ` • Due: ${formatDate(invoice.dueDate)}`}
                                </p>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-lg font-semibold">
                                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                                </p>
                                {parseFloat(invoice.balanceAmount) > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Balance: {formatCurrency(invoice.balanceAmount, invoice.currency)}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDownloadPDF(invoice.id)}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
