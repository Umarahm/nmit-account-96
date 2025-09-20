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
import { Search, Eye, Download, CreditCard, Calendar, DollarSign, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface VendorBill {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'DRAFT' | 'UNPAID' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  description?: string;
  currency: string;
  vendorName?: string;
  paymentTerms?: string;
}

interface BillStats {
  total: number;
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  totalDraft: number;
  counts: {
    unpaid: number;
    paid: number;
    overdue: number;
    draft: number;
    partial: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'UNPAID':
      return 'bg-blue-100 text-blue-800';
    case 'PARTIAL':
      return 'bg-yellow-100 text-yellow-800';
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
      return <Receipt className="h-4 w-4" />;
  }
};

export default function MyBillsPage() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<BillStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch bills from API
  useEffect(() => {
    const fetchBills = async () => {
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

        const response = await fetch(`/api/vendor-bills/customer?${searchParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }

        const data = await response.json();
        setBills(data.bills);
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching bills:', error);
        setError('Failed to load bills. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [statusFilter, searchTerm, currentPage]);

  // Filter bills based on search and status (now handled by API)
  const filteredBills = bills;

  // Pagination (handled by API)
  const totalPages = 1; // This will be updated when we implement proper pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBills = filteredBills;

  const handleViewBill = (billId: string) => {
    console.log('View bill:', billId);
  };

  const handleDownloadBill = (billId: string) => {
    console.log('Download bill:', billId);
  };

  const handlePayBill = (billId: string) => {
    console.log('Pay bill:', billId);
  };

  const getTotalAmountByStatus = (status: string) => {
    if (!stats) return 0;
    switch (status) {
      case 'UNPAID':
      case 'OVERDUE':
      case 'PARTIAL':
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
      case 'UNPAID':
        return stats.counts.unpaid;
      case 'PAID':
        return stats.counts.paid;
      case 'OVERDUE':
        return stats.counts.overdue;
      case 'DRAFT':
        return stats.counts.draft;
      case 'PARTIAL':
        return stats.counts.partial;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute permissions={['transactions:vendor_bills:view_own']}>
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
      <ProtectedRoute permissions={['transactions:vendor_bills:view_own']}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Error Loading Bills</h3>
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
    <ProtectedRoute permissions={['transactions:vendor_bills:view_own']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Bills</h1>
            <p className="text-muted-foreground">
              View and manage your vendor bills
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
                ₹{getTotalAmountByStatus('UNPAID').toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCountByStatus('UNPAID')} bills
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
                {getCountByStatus('PAID')} bills
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{getTotalAmountByStatus('OVERDUE').toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCountByStatus('OVERDUE')} bills
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partial Payments</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCountByStatus('PARTIAL')}
              </div>
              <p className="text-xs text-muted-foreground">
                bills with partial payment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bill History</CardTitle>
            <CardDescription>
              {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedBills.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No bills found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You do not have any bills yet.'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">
                          {bill.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {bill.date ? format(new Date(bill.date), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {bill.dueDate ? format(new Date(bill.dueDate), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>{bill.vendorName || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {bill.description || 'No description'}
                        </TableCell>
                        <TableCell>
                          {bill.currency} {bill.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(bill.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(bill.status)}
                              {bill.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBill(bill.id)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadBill(bill.id)}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            {['UNPAID', 'PARTIAL', 'OVERDUE'].includes(bill.status) && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handlePayBill(bill.id)}
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
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBills.length)} of {filteredBills.length} results
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