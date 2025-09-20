'use client';
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Search, Eye, Download, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  description?: string;
  currency: string;
  customerName?: string;
  vendorName?: string;
}

interface InvoiceStats {
  total: number;
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  totalDraft: number;
  counts: {
    sent: number;
    paid: number;
    overdue: number;
    draft: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'SENT':
      return 'bg-blue-100 text-blue-800';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PAID':
      return <CreditCard className="h-4 w-4" />;
    case 'OVERDUE':
      return <Calendar className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

export default function MyInvoicesPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const searchParams = new URLSearchParams();
        if (statusFilter !== 'ALL') {
          searchParams.append('status', statusFilter);
        }
        if (searchTerm) {
          searchParams.append('search', searchTerm);
        }
        searchParams.append('page', currentPage.toString());
        searchParams.append('limit', itemsPerPage.toString());

        const response = await fetch(`/api/invoices/customer?${searchParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }

        const data = await response.json();
        setInvoices(data.invoices);
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [statusFilter, searchTerm, currentPage]);

  // Filter invoices based on search and status (now handled by API)
  const filteredInvoices = invoices;

  // Pagination (handled by API)
  const totalPages = 1; // This will be updated when we implement proper pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices;

  const handleViewInvoice = (invoiceId: string) => {
    console.log('View invoice:', invoiceId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log('Download invoice:', invoiceId);
  };

  const handlePayInvoice = (invoiceId: string) => {
    console.log('Pay invoice:', invoiceId);
  };

  const getTotalAmountByStatus = (status: string) => {
    if (!stats) return 0;
    switch (status) {
      case 'SENT':
      case 'OVERDUE':
        return stats.totalOutstanding;
      case 'PAID':
        return stats.totalPaid;
      case 'OVERDUE':
        return stats.totalOverdue;
      case 'DRAFT':
        return stats.totalDraft;
      default:
        return 0;
    }
  };

  const getCountByStatus = (status: string) => {
    if (!stats) return 0;
    switch (status) {
      case 'SENT':
        return stats.counts.sent;
      case 'PAID':
        return stats.counts.paid;
      case 'OVERDUE':
        return stats.counts.overdue;
      case 'DRAFT':
        return stats.counts.draft;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute permissions={['transactions:customer_invoices:view_own']}>
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute permissions={['transactions:customer_invoices:view_own']}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Error Loading Invoices</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute permissions={['transactions:customer_invoices:view_own']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
            <p className="text-muted-foreground">
              View and manage your invoices
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{getTotalAmountByStatus('SENT').toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCountByStatus('SENT')} invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{getTotalAmountByStatus('PAID').toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCountByStatus('PAID')} invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{getTotalAmountByStatus('OVERDUE').toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCountByStatus('OVERDUE')} invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{getTotalAmountByStatus('DRAFT').toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCountByStatus('DRAFT')} invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedInvoices.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No invoices found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You do not have any invoices yet.'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {invoice.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            ₹{invoice.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(invoice.status)}
                              {invoice.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(invoice.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {['SENT', 'OVERDUE'].includes(invoice.status) && (
                              <Button
                                size="sm"
                                onClick={() => handlePayInvoice(invoice.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}