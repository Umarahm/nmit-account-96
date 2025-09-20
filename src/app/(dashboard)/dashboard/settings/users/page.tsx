'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardPageLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2, Users, Shield, Mail, User, Save, X } from "lucide-react";
import Link from "next/link";

interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'ACCOUNTANT' | 'CONTACT';
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'ACCOUNTANT' | 'CONTACT';
}

interface UpdateUserData {
    name: string;
    email: string;
    role: 'ADMIN' | 'ACCOUNTANT' | 'CONTACT';
    isActive: boolean;
}

export default function UserManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Create user dialog state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createUserData, setCreateUserData] = useState<CreateUserData>({
        name: '',
        email: '',
        password: '',
        role: 'CONTACT'
    });
    const [creatingUser, setCreatingUser] = useState(false);
    
    // Edit user dialog state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUserData, setEditUserData] = useState<UpdateUserData>({
        name: '',
        email: '',
        role: 'CONTACT',
        isActive: true
    });
    const [updatingUser, setUpdatingUser] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (session && session.user?.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
    }, [session, router]);

    useEffect(() => {
        if (session?.user?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [session]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setUsers(data.users);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            setCreatingUser(true);
            setError(null);

            if (!createUserData.name || !createUserData.email || !createUserData.password) {
                throw new Error('All fields are required');
            }

            if (createUserData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createUserData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user');
            }

            setSuccess('User created successfully!');
            setShowCreateDialog(false);
            setCreateUserData({ name: '', email: '', password: '', role: 'CONTACT' });
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setCreatingUser(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditUserData({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });
        setShowEditDialog(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        try {
            setUpdatingUser(true);
            setError(null);

            if (!editUserData.name || !editUserData.email) {
                throw new Error('Name and email are required');
            }

            const response = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editUserData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }

            setSuccess('User updated successfully!');
            setShowEditDialog(false);
            setEditingUser(null);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setUpdatingUser(false);
        }
    };

    const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
        try {
            const response = await fetch(`/api/users/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user status');
            }

            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'ACCOUNTANT':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'CONTACT':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Show loading if session is loading or user is not admin
    if (!session || session.user?.role !== 'ADMIN') {
        return (
            <DashboardPageLayout
                title="User Management"
                description="Access denied - Admin privileges required"
            >
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Access Denied</h3>
                            <p className="text-muted-foreground">
                                You need administrator privileges to access user management.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </DashboardPageLayout>
        );
    }

    if (loading) {
        return (
            <DashboardPageLayout
                title="User Management"
                description="Manage users, roles, and permissions"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading users...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title="User Management"
            description="Manage users, roles, and permissions"
            actions={
                <div className="flex space-x-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/settings">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Settings
                        </Link>
                    </Button>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to the system. Default role is Contact.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={createUserData.name}
                                        onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={createUserData.email}
                                        onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={createUserData.password}
                                        onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Enter password (min 6 characters)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={createUserData.role}
                                        onValueChange={(value: 'ADMIN' | 'ACCOUNTANT' | 'CONTACT') => 
                                            setCreateUserData(prev => ({ ...prev, role: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CONTACT">Contact (Default)</SelectItem>
                                            <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                            <SelectItem value="ADMIN">Administrator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateUser} disabled={creatingUser}>
                                    {creatingUser ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create User
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Error/Success Messages */}
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

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <CardTitle>System Users</CardTitle>
                        </div>
                        <CardDescription>
                            Manage user accounts and their access levels
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <div className="text-center py-8">
                                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">No users found</h3>
                                <p className="text-muted-foreground">
                                    Start by adding the first user to the system.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span>{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleBadgeColor(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={user.isActive}
                                                        onCheckedChange={(checked) => 
                                                            handleToggleUserStatus(user.id, checked)
                                                        }
                                                        disabled={user.id === session.user?.id}
                                                    />
                                                    <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Edit User Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Update user information and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editName">Full Name</Label>
                                <Input
                                    id="editName"
                                    value={editUserData.name}
                                    onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editEmail">Email</Label>
                                <Input
                                    id="editEmail"
                                    type="email"
                                    value={editUserData.email}
                                    onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editRole">Role</Label>
                                <Select
                                    value={editUserData.role}
                                    onValueChange={(value: 'ADMIN' | 'ACCOUNTANT' | 'CONTACT') => 
                                        setEditUserData(prev => ({ ...prev, role: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CONTACT">Contact</SelectItem>
                                        <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="editActive"
                                    checked={editUserData.isActive}
                                    onCheckedChange={(checked) => 
                                        setEditUserData(prev => ({ ...prev, isActive: checked }))
                                    }
                                />
                                <Label htmlFor="editActive">Active User</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateUser} disabled={updatingUser}>
                                {updatingUser ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Update User
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardPageLayout>
    );
}