"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface VendorBill {
    id: number;
    invoiceNumber: string;
    vendorName: string;
    invoiceDate: string;
    dueDate?: string;
    status: "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
    totalAmount: string;
    balanceAmount: string;
    currency: string;
}

interface VendorBillsResponse {
    invoices: VendorBill[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function VendorBillsPage() {
    const { data: session, status } = useSession();
    const [bills, setBills] = useState<VendorBill[]>([]);
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

    const fetchBills = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "10"
            });

            if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
            if (searchTerm) params.append("search", searchTerm);

            const response = await fetch(`/api/invoices?${params}&type=PURCHASE`);
            if (!response.ok) {
                throw new Error("Failed to fetch vendor bills");
            }

            const data: VendorBillsResponse = await response.json();
            setBills(data.invoices);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchBills();
        }
    }, [session, currentPage, statusFilter, searchTerm]);

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
            currency: "INR"
        }).format(parseFloat(amount));
    };

    if (status === "loading" || loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Vendor Bills</h1>
                        <p className="text-muted-foreground">Loading vendor bills...</p>
                    </div>
                </div>
                <div className="grid gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Vendor Bills</h1>
                        <p className="text-muted-foreground">Please sign in to access vendor bills.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Vendor Bills</h1>
                    <p className="text-muted-foreground">Manage all vendor bills and payments</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/transactions/vendor-bills/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Vendor Bill
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by bill number or vendor..."
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

            {/* Bills List */}
            <Card>
                <CardHeader>
                    <CardTitle>Vendor Bills ({pagination.total})</CardTitle>
                    <CardDescription>
                        {pagination.total === 0 ? "No vendor bills found" : `Showing ${bills.length} of ${pagination.total} bills`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {bills.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-muted-foreground mb-4">
                                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No vendor bills found</p>
                                <p className="text-sm">Create your first vendor bill to get started</p>
                            </div>
                            <Button asChild>
                                <Link href="/dashboard/transactions/vendor-bills/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Vendor Bill
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bills.map((bill) => (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {bill.invoiceNumber}
                                            </h3>
                                            <Badge className={getStatusColor(bill.status)}>
                                                {bill.status.replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {bill.vendorName}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {format(new Date(bill.invoiceDate), "MMM dd, yyyy")}
                                            {bill.dueDate && ` • Due: ${format(new Date(bill.dueDate), "MMM dd, yyyy")}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(bill.totalAmount)}
                                            </p>
                                            {parseFloat(bill.balanceAmount) > 0 && (
                                                <p className="text-xs text-gray-500">
                                                    Balance: {formatCurrency(bill.balanceAmount)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/transactions/vendor-bills/${bill.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/transactions/vendor-bills/${bill.id}/edit`}>
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
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
                                    disabled={currentPage === pagination.pages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

