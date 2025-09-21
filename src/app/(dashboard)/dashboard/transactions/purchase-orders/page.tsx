"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageLayout } from "@/components/layout";
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface PurchaseOrder {
    id: number;
    poNumber: string;
    vendorId: number;
    vendorName: string;
    orderDate: string;
    status: string;
    totalAmount: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface PurchaseOrdersResponse {
    orders: PurchaseOrder[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function PurchaseOrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10"
            });

            if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(`/api/purchase-orders?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch purchase orders');
            }

            const data: PurchaseOrdersResponse = await response.json();
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchOrders();
        }
    }, [session, currentPage, statusFilter, searchTerm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(parseFloat(amount));
    };

    if (status === "loading" || loading) {
        return (
            <DashboardPageLayout
                title="Purchase Orders"
                description="Manage your purchase orders and vendor relationships"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading purchase orders...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (!session) {
        return (
            <DashboardPageLayout
                title="Purchase Orders"
                description="Manage your purchase orders and vendor relationships"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p>Please sign in to access purchase orders.</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title="Purchase Orders"
            description="Manage your purchase orders and vendor relationships"
            actions={
                <Button asChild>
                    <Link href="/dashboard/transactions/purchase-orders/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Purchase Order
                    </Link>
                </Button>
            }
        >
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by PO number or vendor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Orders List */}
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Orders ({pagination.total})</CardTitle>
                    <CardDescription>
                        {pagination.total === 0 ? 'No purchase orders found' : `Showing ${orders.length} of ${pagination.total} orders`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {orders.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-muted-foreground mb-4">
                                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No purchase orders found</p>
                                <p className="text-sm">Create your first purchase order to get started</p>
                            </div>
                            <Button asChild>
                                <Link href="/dashboard/transactions/purchase-orders/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Purchase Order
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {order.poNumber}
                                            </h3>
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {order.vendorName}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(order.totalAmount)}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/transactions/purchase-orders/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/transactions/purchase-orders/${order.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Showing page {pagination.page} of {pagination.pages}
                            </p>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                                    disabled={currentPage === pagination.pages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}

