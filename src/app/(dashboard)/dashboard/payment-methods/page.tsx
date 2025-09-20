'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import Link from 'next/link';

interface PaymentMethod {
    id: number;
    name: string;
    type: 'CASH' | 'BANK' | 'CARD' | 'DIGITAL';
    accountId?: number;
    accountName?: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export default function PaymentMethodsPage() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/payment-methods');
            const data = await response.json();

            if (response.ok) {
                setPaymentMethods(data.paymentMethods || []);
            } else {
                console.error('Error fetching payment methods:', data.error);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleActiveStatus = async (id: number, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/payment-methods/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: !currentStatus,
                }),
            });

            if (response.ok) {
                setPaymentMethods(prev =>
                    prev.map(method =>
                        method.id === id
                            ? { ...method, isActive: !currentStatus }
                            : method
                    )
                );
            } else {
                const data = await response.json();
                alert(`Error updating payment method: ${data.error}`);
            }
        } catch (error) {
            console.error('Error updating payment method:', error);
            alert('Error updating payment method');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CASH':
                return <Banknote className="w-5 h-5" />;
            case 'BANK':
                return <Building2 className="w-5 h-5" />;
            case 'CARD':
                return <CreditCard className="w-5 h-5" />;
            case 'DIGITAL':
                return <Smartphone className="w-5 h-5" />;
            default:
                return <CreditCard className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'CASH':
                return 'bg-green-100 text-green-800';
            case 'BANK':
                return 'bg-blue-100 text-blue-800';
            case 'CARD':
                return 'bg-purple-100 text-purple-800';
            case 'DIGITAL':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Payment Methods</h1>
                        <p className="text-muted-foreground">Loading payment methods...</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
                    <h1 className="text-3xl font-bold">Payment Methods</h1>
                    <p className="text-muted-foreground">
                        Manage payment methods for transactions
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/payment-methods/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Payment Method
                    </Link>
                </Button>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paymentMethods.length === 0 ? (
                    <div className="col-span-full">
                        <Card>
                            <CardContent className="p-8 text-center">
                                <div className="text-muted-foreground mb-4">
                                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    No payment methods found
                                </div>
                                <Button asChild>
                                    <Link href="/dashboard/payment-methods/new">
                                        Create your first payment method
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    paymentMethods.map((method) => (
                        <Card key={method.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${getTypeColor(method.type)}`}>
                                            {getTypeIcon(method.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{method.name}</h3>
                                            <Badge className={getTypeColor(method.type)} variant="secondary">
                                                {method.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={method.isActive}
                                            onCheckedChange={() => toggleActiveStatus(method.id, method.isActive)}
                                        />
                                    </div>
                                </div>

                                {method.accountName && (
                                    <div className="mb-3">
                                        <span className="text-sm text-muted-foreground">Account: </span>
                                        <span className="text-sm font-medium">{method.accountName}</span>
                                    </div>
                                )}

                                {method.description && (
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {method.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Created {new Date(method.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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
                            <div className="text-2xl font-bold text-blue-600">
                                {paymentMethods.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Methods</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {paymentMethods.filter(m => m.isActive).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {paymentMethods.filter(m => !m.isActive).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Inactive</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {paymentMethods.filter(m => m.accountId).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Linked to Accounts</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
