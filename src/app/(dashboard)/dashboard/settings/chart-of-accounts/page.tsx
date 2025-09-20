'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardPageLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, 
    Plus, 
    Edit, 
    Trash2, 
    FileText, 
    ChevronRight, 
    ChevronDown,
    Search,
    Filter,
    Download,
    Upload
} from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useDataRefresh } from "@/contexts/DataContext";

interface ChartOfAccount {
    id: number;
    code: string;
    name: string;
    type: string;
    parentId?: number;
    level: number;
    isGroup: boolean;
    description?: string;
    isActive: boolean;
    children?: ChartOfAccount[];
}

const accountTypes = [
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'INCOME', label: 'Income' },
    { value: 'EXPENSE', label: 'Expense' },
];

const typeColors = {
    ASSET: 'bg-blue-100 text-blue-800',
    LIABILITY: 'bg-red-100 text-red-800',
    EQUITY: 'bg-purple-100 text-purple-800',
    INCOME: 'bg-green-100 text-green-800',
    EXPENSE: 'bg-orange-100 text-orange-800',
};

export default function ChartOfAccountsPage() {
    const { data: session } = useSession();
    const refreshDashboard = useDataRefresh();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'ASSET',
        parentId: '',
        isGroup: false,
        description: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        filterAccounts();
    }, [accounts, searchTerm, selectedType]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings/chart-of-accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
            } else {
                setError('Failed to fetch chart of accounts');
            }
        } catch (err) {
            setError('Error fetching chart of accounts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterAccounts = () => {
        let filtered = accounts;

        if (searchTerm) {
            filtered = filtered.filter(account =>
                account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedType !== 'ALL') {
            filtered = filtered.filter(account => account.type === selectedType);
        }

        setFilteredAccounts(filtered);
    };

    const buildAccountTree = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
        const accountMap = new Map();
        const roots: ChartOfAccount[] = [];

        // Create a map of all accounts
        accounts.forEach(account => {
            accountMap.set(account.id, { ...account, children: [] });
        });

        // Build the tree structure
        accounts.forEach(account => {
            const accountNode = accountMap.get(account.id);
            if (account.parentId && accountMap.has(account.parentId)) {
                const parent = accountMap.get(account.parentId);
                parent.children.push(accountNode);
            } else {
                roots.push(accountNode);
            }
        });

        return roots;
    };

    const toggleNode = (accountId: number) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId);
        } else {
            newExpanded.add(accountId);
        }
        setExpandedNodes(newExpanded);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const url = editingAccount 
                ? `/api/settings/chart-of-accounts/${editingAccount.id}`
                : '/api/settings/chart-of-accounts';
            
            const method = editingAccount ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    parentId: formData.parentId ? parseInt(formData.parentId) : null,
                }),
            });

            if (response.ok) {
                const message = editingAccount ? 'Account updated successfully' : 'Account created successfully';
                setSuccess(message);
                setIsDialogOpen(false);
                resetForm();
                fetchAccounts();
                refreshDashboard(); // Refresh dashboard data
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save account');
            }
        } catch (err) {
            setError('Error saving account');
            console.error(err);
        }
    };

    const handleEdit = (account: ChartOfAccount) => {
        setEditingAccount(account);
        setFormData({
            code: account.code,
            name: account.name,
            type: account.type,
            parentId: account.parentId?.toString() || '',
            isGroup: account.isGroup,
            description: account.description || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (accountId: number) => {
        if (!confirm('Are you sure you want to delete this account?')) {
            return;
        }

        try {
            const response = await fetch(`/api/settings/chart-of-accounts/${accountId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess('Account deleted successfully');
                fetchAccounts();
                refreshDashboard(); // Refresh dashboard data
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete account');
            }
        } catch (err) {
            setError('Error deleting account');
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            type: 'ASSET',
            parentId: '',
            isGroup: false,
            description: '',
        });
        setEditingAccount(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const renderAccountRow = (account: ChartOfAccount, level = 0) => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expandedNodes.has(account.id);

        return (
            <div key={account.id}>
                <div 
                    className="flex items-center justify-between p-3 border-b hover:bg-gray-50"
                    style={{ paddingLeft: `${12 + level * 20}px` }}
                >
                    <div className="flex items-center space-x-3 flex-1">
                        {hasChildren ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-6 w-6"
                                onClick={() => toggleNode(account.id)}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        ) : (
                            <div className="w-6" />
                        )}
                        
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{account.code}</span>
                                <span>{account.name}</span>
                                {account.isGroup && (
                                    <Badge variant="outline" className="text-xs">Group</Badge>
                                )}
                            </div>
                            {account.description && (
                                <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                            )}
                        </div>
                        
                        <Badge 
                            className={`${typeColors[account.type as keyof typeof typeColors]} text-xs`}
                        >
                            {account.type}
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(account)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(account.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                
                {hasChildren && isExpanded && account.children?.map(child => 
                    renderAccountRow(child, level + 1)
                )}
            </div>
        );
    };

    const accountTree = buildAccountTree(filteredAccounts);

    if (loading) {
        return (
            <DashboardPageLayout
                title="Chart of Accounts"
                description="Manage your chart of accounts structure"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading chart of accounts...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title="Chart of Accounts"
            description="Manage your chart of accounts structure"
            actions={
                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/settings">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Settings
                        </Link>
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Filters and Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search accounts by name or code..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger>
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Types</SelectItem>
                                        {accountTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Messages */}
                {error && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-red-600 bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {success && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-green-600 bg-green-50 p-3 rounded-lg">
                                {success}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Accounts List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Chart of Accounts
                                </CardTitle>
                                <CardDescription>
                                    {filteredAccounts.length} account(s) found
                                </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {accountTree.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg mb-2">No accounts found</p>
                                <p className="text-sm">
                                    {searchTerm || selectedType !== 'ALL' 
                                        ? 'Try adjusting your search or filter criteria'
                                        : 'Create your first account to get started'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                {accountTree.map(account => renderAccountRow(account))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingAccount ? 'Edit Account' : 'Create New Account'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingAccount 
                                    ? 'Update the account details below.'
                                    : 'Add a new account to your chart of accounts.'
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Account Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., 1001"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Account Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accountTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Account Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Cash in Hand"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parentId">Parent Account</Label>
                                <Select
                                    value={formData.parentId}
                                    onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent account (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None (Root Level)</SelectItem>
                                        {accounts
                                            .filter(acc => acc.isGroup && acc.id !== editingAccount?.id)
                                            .map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.code} - {account.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isGroup"
                                    checked={formData.isGroup}
                                    onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })}
                                    className="rounded"
                                />
                                <Label htmlFor="isGroup">This is a group account (can have sub-accounts)</Label>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingAccount ? 'Update Account' : 'Create Account'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardPageLayout>
    );
}