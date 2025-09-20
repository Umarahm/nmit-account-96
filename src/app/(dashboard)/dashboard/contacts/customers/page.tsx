"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Eye, Edit, Trash2, Mail, Phone, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { Contact, ContactFilters, ContactsResponse } from "@/types/contacts";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ContactFilters>({
        type: 'CUSTOMER',
        search: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const searchParams = new URLSearchParams();

            searchParams.append('type', 'CUSTOMER');
            if (filters.search) {
                searchParams.append('search', filters.search);
            }
            searchParams.append('page', filters.page?.toString() || '1');
            searchParams.append('limit', filters.limit?.toString() || '10');

            const response = await fetch(`/api/contacts?${searchParams}`);
            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }

            const data: ContactsResponse = await response.json();
            setCustomers(data.contacts);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [filters]);

    const handleSearch = (value: string) => {
        setFilters(prev => ({ ...prev, search: value, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Customers</h1>
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
                    <h1 className="text-3xl font-bold">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage your customer relationships
                    </p>
                </div>
                <Link href="/dashboard/contacts/new?type=CUSTOMER">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                                <p className="text-2xl font-bold">{pagination.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Active Customers</p>
                                <p className="text-2xl font-bold">{customers.filter(c => c.isActive).length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                                <p className="text-2xl font-bold">
                                    {customers.filter(c => {
                                        const created = new Date(c.createdAt);
                                        const now = new Date();
                                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            value={filters.search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers List */}
            <div className="grid gap-4">
                {customers.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                            <p className="text-muted-foreground mb-4">
                                {filters.search
                                    ? "Try adjusting your search"
                                    : "Get started by adding your first customer"
                                }
                            </p>
                            <Link href="/dashboard/contacts/new?type=CUSTOMER">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Customer
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    customers.map((customer) => (
                        <Card key={customer.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {customer.displayName || customer.name}
                                                </h3>
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Customer</Badge>
                                            </div>

                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                {customer.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3" />
                                                        {customer.email}
                                                    </div>
                                                )}
                                                {customer.mobile && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3" />
                                                        {customer.mobile}
                                                    </div>
                                                )}
                                                {customer.address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" />
                                                        {customer.address.city}, {customer.address.state}
                                                    </div>
                                                )}
                                            </div>

                                            {customer.notes && (
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                    {customer.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/dashboard/contacts/${customer.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/contacts/${customer.id}/edit`}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
