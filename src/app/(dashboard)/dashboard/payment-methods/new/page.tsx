'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CreditCard, Banknote, Building2, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChartOfAccount {
    id: number;
    name: string;
    code: string;
    type: string;
}

export default function NewPaymentMethodPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        accountId: '',
        description: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            // For now, we'll use a simple approach. In a real app, you'd have an API endpoint for chart of accounts
            // For demo purposes, we'll create some sample accounts
            setAccounts([
                { id: 1, name: 'Cash in Hand', code: '1101', type: 'ASSET' },
                { id: 2, name: 'Bank Account - SBI', code: '1102', type: 'ASSET' },
                { id: 3, name: 'Bank Account - HDFC', code: '1103', type: 'ASSET' },
                { id: 4, name: 'Petty Cash', code: '1104', type: 'ASSET' },
            ]);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.type) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/payment-methods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    type: formData.type,
                    accountId: formData.accountId || undefined,
                    description: formData.description || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Payment method created successfully!');
                router.push('/dashboard/payment-methods');
            } else {
                alert(`Error creating payment method: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating payment method:', error);
            alert('Error creating payment method');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CASH':
                return <Banknote className="w-6 h-6" />;
            case 'BANK':
                return <Building2 className="w-6 h-6" />;
            case 'CARD':
                return <CreditCard className="w-6 h-6" />;
            case 'DIGITAL':
                return <Smartphone className="w-6 h-6" />;
            default:
                return <CreditCard className="w-6 h-6" />;
        }
    };

    const getTypeDescription = (type: string) => {
        switch (type) {
            case 'CASH':
                return 'Physical cash transactions';
            case 'BANK':
                return 'Bank transfers, wire transfers, and direct deposits';
            case 'CARD':
                return 'Credit cards, debit cards, and prepaid cards';
            case 'DIGITAL':
                return 'Digital wallets, UPI, mobile payments';
            default:
                return '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/payment-methods">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Payment Methods
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New Payment Method</h1>
                    <p className="text-muted-foreground">
                        Create a new payment method for transactions
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>
                                    Enter the basic details for this payment method
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Cash, Bank Transfer, Credit Card"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment method type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="w-4 h-4" />
                                                    Cash
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="BANK">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4" />
                                                    Bank Transfer
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="CARD">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4" />
                                                    Card Payment
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="DIGITAL">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="w-4 h-4" />
                                                    Digital Wallet
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.type && (
                                    <div className="bg-muted p-4 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="text-muted-foreground">
                                                {getTypeIcon(formData.type)}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{formData.type}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {getTypeDescription(formData.type)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="accountId">Linked Account (Optional)</Label>
                                    <Select
                                        value={formData.accountId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a chart of accounts entry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.code} - {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Link this payment method to a specific account for better tracking
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Additional details about this payment method..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Method Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.name && (
                                    <div>
                                        <Label className="text-sm font-medium">Name</Label>
                                        <p className="text-sm text-muted-foreground">{formData.name}</p>
                                    </div>
                                )}

                                {formData.type && (
                                    <div>
                                        <Label className="text-sm font-medium">Type</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getTypeIcon(formData.type)}
                                            <span className="text-sm text-muted-foreground">{formData.type}</span>
                                        </div>
                                    </div>
                                )}

                                {formData.accountId && (
                                    <div>
                                        <Label className="text-sm font-medium">Linked Account</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {accounts.find(acc => acc.id.toString() === formData.accountId)?.name}
                                        </p>
                                    </div>
                                )}

                                {formData.description && (
                                    <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <p className="text-sm text-muted-foreground">{formData.description}</p>
                                    </div>
                                )}

                                {!formData.name && !formData.type && (
                                    <div className="text-center text-muted-foreground py-8">
                                        Fill in the details to see a preview
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading || !formData.name || !formData.type} className="flex-1">
                                {loading ? 'Creating...' : 'Create Payment Method'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/payment-methods">Cancel</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
