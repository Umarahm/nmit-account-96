"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, Building2, Eye, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { Contact, ContactFilters, ContactsResponse } from "@/types/contacts";

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ContactFilters>({
        type: 'ALL',
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

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const searchParams = new URLSearchParams();

            if (filters.type && filters.type !== 'ALL') {
                searchParams.append('type', filters.type);
            }
            if (filters.search) {
                searchParams.append('search', filters.search);
            }
            searchParams.append('page', filters.page?.toString() || '1');
            searchParams.append('limit', filters.limit?.toString() || '10');

            const response = await fetch(`/api/contacts?${searchParams}`);
            if (!response.ok) {
                throw new Error('Failed to fetch contacts');
            }

            const data: ContactsResponse = await response.json();
            setContacts(data.contacts);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [filters]);

    const handleSearch = (value: string) => {
        setFilters(prev => ({ ...prev, search: value, page: 1 }));
    };

    const handleTypeFilter = (value: string) => {
        setFilters(prev => ({ ...prev, type: value as ContactFilters['type'], page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const getContactTypeIcon = (type: string) => {
        switch (type) {
            case 'CUSTOMER':
                return <Users className="h-4 w-4" />;
            case 'VENDOR':
                return <Building2 className="h-4 w-4" />;
            case 'BOTH':
                return <div className="flex gap-1"><Users className="h-3 w-3" /><Building2 className="h-3 w-3" /></div>;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getContactTypeBadge = (type: string) => {
        switch (type) {
            case 'CUSTOMER':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Customer</Badge>;
            case 'VENDOR':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Vendor</Badge>;
            case 'BOTH':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Both</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Contacts</h1>
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
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <p className="text-muted-foreground">
                        Manage your customers and vendors
                    </p>
                </div>
                <Link href="/dashboard/contacts/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search contacts..."
                                    value={filters.search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={filters.type} onValueChange={handleTypeFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Contacts</SelectItem>
                                <SelectItem value="CUSTOMER">Customers</SelectItem>
                                <SelectItem value="VENDOR">Vendors</SelectItem>
                                <SelectItem value="BOTH">Both</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Contacts List */}
            <div className="grid gap-4">
                {contacts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                            <p className="text-muted-foreground mb-4">
                                {filters.search || filters.type !== 'ALL'
                                    ? "Try adjusting your search or filters"
                                    : "Get started by adding your first contact"
                                }
                            </p>
                            <Link href="/dashboard/contacts/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Contact
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    contacts.map((contact) => (
                        <Card key={contact.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-muted rounded-lg">
                                            {getContactTypeIcon(contact.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {contact.displayName || contact.name}
                                                </h3>
                                                {getContactTypeBadge(contact.type)}
                                            </div>

                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                {contact.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3" />
                                                        {contact.email}
                                                    </div>
                                                )}
                                                {contact.mobile && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3" />
                                                        {contact.mobile}
                                                    </div>
                                                )}
                                                {contact.address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" />
                                                        {contact.address.city}, {contact.address.state}
                                                    </div>
                                                )}
                                            </div>

                                            {contact.notes && (
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                    {contact.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/dashboard/contacts/${contact.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/contacts/${contact.id}/edit`}>
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
