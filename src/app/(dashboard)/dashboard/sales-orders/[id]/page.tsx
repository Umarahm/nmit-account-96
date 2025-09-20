"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardPageLayout } from "@/components/layout";
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Clock, Package } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface SalesOrder {
    id: number;
    soNumber: string;
    customerId: number;
    customerName: string;
    customerEmail?: string;
    customerMobile?: string;
    customerAddress?: any;
    orderDate: string;
    status: string;
    totalAmount: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

interface OrderItem {
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

export default function SalesOrderDetailPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const orderId = params.id as string;

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/sales-orders/${orderId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch sales order');
            }
            const data = await response.json();
            setOrder(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session && orderId) {
            fetchOrder();
        }
    }, [session, orderId]);

    const updateStatus = async (newStatus: string) => {
        try {
            setUpdatingStatus(true);
            const response = await fetch(`/api/orders/sales/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            await fetchOrder(); // Refresh the order data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setUpdatingStatus(false);
        }
    };

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <Package className="h-4 w-4" />;
            case 'CONFIRMED':
                return <CheckCircle className="h-4 w-4" />;
            case 'IN_PROGRESS':
                return <Clock className="h-4 w-4" />;
            case 'COMPLETED':
                return <CheckCircle className="h-4 w-4" />;
            case 'CANCELLED':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(parseFloat(amount));
    };

    const getNextStatus = (currentStatus: string) => {
        switch (currentStatus) {
            case 'DRAFT':
                return 'CONFIRMED';
            case 'CONFIRMED':
                return 'IN_PROGRESS';
            case 'IN_PROGRESS':
                return 'COMPLETED';
            default:
                return null;
        }
    };

    if (status === "loading" || loading) {
        return (
            <DashboardPageLayout
                title="Sales Order"
                description="Loading order details..."
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (!session) {
        return (
            <DashboardPageLayout
                title="Sales Order"
                description="Please sign in to view order details"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p>Please sign in to view order details.</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    if (error || !order) {
        return (
            <DashboardPageLayout
                title="Sales Order"
                description="Error loading order"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
                        <Button asChild>
                            <Link href="/dashboard/sales-orders">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Orders
                            </Link>
                        </Button>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title={`Sales Order ${order.soNumber}`}
            description={`Order for ${order.customerName}`}
            actions={
                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/sales-orders">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Link>
                    </Button>
                    {order.status === 'DRAFT' && (
                        <Button asChild>
                            <Link href={`/dashboard/sales-orders/${order.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Order
                            </Link>
                        </Button>
                    )}
                </div>
            }
        >
            {/* Order Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {getStatusIcon(order.status)}
                                Order #{order.soNumber}
                            </CardTitle>
                            <CardDescription>
                                Created on {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                            </Badge>
                            <p className="text-2xl font-bold mt-2">
                                {formatCurrency(order.totalAmount)}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium mb-2">Customer Details</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>{order.customerName}</strong>
                            </p>
                            {order.customerEmail && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {order.customerEmail}
                                </p>
                            )}
                            {order.customerMobile && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {order.customerMobile}
                                </p>
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Order Details</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Order Date:</strong> {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Last Updated:</strong> {format(new Date(order.updatedAt), 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                    {order.notes && (
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Notes</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.notes}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Order Items ({order.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{item.productName}</h4>
                                        {item.productHsnCode && (
                                            <p className="text-sm text-gray-500">
                                                HSN: {item.productHsnCode}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">
                                            {formatCurrency(item.totalAmount)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantity} × {formatCurrency(item.unitPrice)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Status Actions */}
            {getNextStatus(order.status) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Order Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => updateStatus(getNextStatus(order.status)!)}
                            disabled={updatingStatus}
                            className="w-full sm:w-auto"
                        >
                            {updatingStatus ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as {getNextStatus(order.status)?.replace('_', ' ')}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                </div>
            )}
        </DashboardPageLayout>
    );
}
