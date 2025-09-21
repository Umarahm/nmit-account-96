"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface Payment {
    id: number;
    paymentNumber?: string;
    invoiceId: number;
    paymentDate: string;
    amount: string;
    paymentMethod: string;
    paymentMethodId?: number;
    reference?: string;
    status: string;
    currency: string;
    notes?: string;
    createdAt: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/payments");
            const data = await response.json();

            if (response.ok) {
                setPayments(data.payments || []);
            } else {
                console.error("Error fetching payments:", data.error);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            payment.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.amount.includes(searchTerm);
        const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
        const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;

        return matchesSearch && matchesStatus && matchesMethod;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "FAILED":
                return "bg-red-100 text-red-800";
            case "BOUNCED":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case "CASH":
                return "bg-blue-100 text-blue-800";
            case "BANK":
                return "bg-purple-100 text-purple-800";
            case "CHEQUE":
                return "bg-indigo-100 text-indigo-800";
            case "CARD":
                return "bg-pink-100 text-pink-800";
            case "DIGITAL":
                return "bg-cyan-100 text-cyan-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatCurrency = (amount: string, currency: string = "INR") => {
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Payments</h1>
                        <p className="text-muted-foreground">Loading payments...</p>
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground">Manage all payment transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/payment-methods">Payment Methods</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/transactions/payments/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Payment
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search payments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="BOUNCED">Bounced</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filter by method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK">Bank Transfer</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="CARD">Card</SelectItem>
                                <SelectItem value="DIGITAL">Digital Wallet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payments List */}
            <div className="grid gap-4">
                {filteredPayments.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="text-muted-foreground">
                                {searchTerm || statusFilter !== "all" || methodFilter !== "all"
                                    ? "No payments match your filters"
                                    : "No payments found"}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredPayments.map((payment) => (
                        <Card key={payment.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg">
                                                {payment.paymentNumber || `Payment #${payment.id}`}
                                            </h3>
                                            <Badge className={getStatusColor(payment.status)}>
                                                {payment.status}
                                            </Badge>
                                            <Badge className={getMethodColor(payment.paymentMethod)} variant="outline">
                                                {payment.paymentMethod}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Invoice #{payment.invoiceId}</span>
                                            <span>{formatDate(payment.paymentDate)}</span>
                                            {payment.reference && <span>Ref: {payment.reference}</span>}
                                        </div>
                                        {payment.notes && (
                                            <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/transactions/customer-invoices/${payment.invoiceId}`}>
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
                            <div className="text-sm text-muted-foreground">Total Payments</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                ₹{payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {payments.filter((p) => p.status === "COMPLETED").length}
                            </div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {payments.filter((p) => p.status === "PENDING").length}
                            </div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

