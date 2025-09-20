'use client';

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DashboardPageLayout,
    StatCard,
    StatsGrid,
    QuickAction
} from "@/components/layout";
import { 
    DollarSign, 
    Users, 
    FileText, 
    BarChart3, 
    Package, 
    ShoppingCart, 
    CreditCard, 
    Plus, 
    RefreshCw, 
    Activity,
    Eye,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    User
} from "lucide-react";
import Link from "next/link";
import { useData } from "@/contexts/DataContext";
import { usePermissions } from "@/components/auth/protected-route";
import { formatDistanceToNow } from "date-fns";
import { ROLE_CONFIG } from "@/lib/rbac";

// Helper function to safely format dates
const formatDateSafely = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return 'Invalid date';
    }
};

// Admin Dashboard Components
function AdminDashboard() {
    const { state: dataState, refreshData } = useData();
    const { dashboardStats, recentActivity, loading, lastUpdated } = dataState;

    return (
        <>
            {/* Admin Overview Stats */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 4 }}>
                <StatCard
                    title="Total Revenue"
                    value={dashboardStats?.totalRevenue.formatted || "₹0.00"}
                    icon={<DollarSign className="h-4 w-4" />}
                    description="This month"
                    trend={dashboardStats?.totalRevenue.trend ? {
                        value: Math.abs(dashboardStats.totalRevenue.trend.value),
                        label: "from last month",
                        direction: dashboardStats.totalRevenue.trend.direction
                    } : undefined}
                />
                <StatCard
                    title="Active Contacts"
                    value={dashboardStats?.activeContacts.formatted || "0"}
                    icon={<Users className="h-4 w-4" />}
                    description="Total customers/vendors"
                />
                <StatCard
                    title="Pending Invoices"
                    value={dashboardStats?.pendingInvoices.formatted || "0"}
                    icon={<FileText className="h-4 w-4" />}
                    description={dashboardStats?.pendingInvoices.amountFormatted ? 
                        `${dashboardStats.pendingInvoices.amountFormatted} outstanding` : 
                        "Awaiting payment"
                    }
                />
                <StatCard
                    title="Stock Value"
                    value={dashboardStats?.stockValue.formatted || "₹0.00"}
                    icon={<Package className="h-4 w-4" />}
                    description={dashboardStats?.stockValue.totalProducts ? 
                        `${dashboardStats.stockValue.activeProducts}/${dashboardStats.stockValue.totalProducts} products` :
                        "Current inventory"
                    }
                />
            </StatsGrid>

            {/* Admin Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <QuickAction
                    title="Add Contact"
                    description="New customer/vendor"
                    icon={<Plus className="h-4 w-4" />}
                    href="/dashboard/contacts/new"
                />
                <QuickAction
                    title="Create Invoice"
                    description="Generate new invoice"
                    icon={<FileText className="h-4 w-4" />}
                    href="/dashboard/transactions/customer-invoices/new"
                />
                <QuickAction
                    title="Record Payment"
                    description="Log new payment"
                    icon={<CreditCard className="h-4 w-4" />}
                    href="/dashboard/transactions/payments/new"
                />
                <QuickAction
                    title="User Management"
                    description="Manage user accounts"
                    icon={<Users className="h-4 w-4" />}
                    href="/dashboard/settings/users"
                />
            </div>

            {/* Admin Recent Activity & System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest transactions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity && recentActivity.length > 0 ? (
                                recentActivity.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="flex items-center space-x-4">
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateSafely(activity.date)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent activity</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Overview</CardTitle>
                        <CardDescription>Key business metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Monthly Sales Target</span>
                                <span className="text-sm font-medium text-green-600">85% Complete</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Overdue Invoices</span>
                                <span className="text-sm font-medium text-red-600">3 items</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Low Stock Items</span>
                                <span className="text-sm font-medium text-yellow-600">5 products</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Accountant Dashboard Components
function AccountantDashboard() {
    const { state: dataState } = useData();
    const { dashboardStats, recentActivity } = dataState;

    return (
        <>
            {/* Accountant KPI Stats */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 4 }}>
                <StatCard
                    title="Monthly Revenue"
                    value={dashboardStats?.totalRevenue.formatted || "₹0.00"}
                    icon={<TrendingUp className="h-4 w-4" />}
                    description="Current month sales"
                />
                <StatCard
                    title="Outstanding"
                    value={dashboardStats?.pendingInvoices.amountFormatted || "₹0.00"}
                    icon={<AlertCircle className="h-4 w-4" />}
                    description="Pending payments"
                />
                <StatCard
                    title="This Month Profit"
                    value="₹45,250.00"
                    icon={<BarChart3 className="h-4 w-4" />}
                    description="Estimated profit"
                />
                <StatCard
                    title="Stock Items"
                    value={dashboardStats?.stockValue.totalProducts || "0"}
                    icon={<Package className="h-4 w-4" />}
                    description="Total products"
                />
            </StatsGrid>

            {/* Accountant Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <QuickAction
                    title="Create Purchase Order"
                    description="New purchase order"
                    icon={<ShoppingCart className="h-4 w-4" />}
                    href="/dashboard/transactions/purchase-orders/new"
                />
                <QuickAction
                    title="Generate Invoice"
                    description="Customer invoice"
                    icon={<FileText className="h-4 w-4" />}
                    href="/dashboard/transactions/customer-invoices/new"
                />
                <QuickAction
                    title="Record Payment"
                    description="Payment entry"
                    icon={<CreditCard className="h-4 w-4" />}
                    href="/dashboard/transactions/payments/new"
                />
                <QuickAction
                    title="View Reports"
                    description="Financial reports"
                    icon={<BarChart3 className="h-4 w-4" />}
                    href="/dashboard/reports"
                />
            </div>

            {/* Accountant Working Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Tasks</CardTitle>
                        <CardDescription>Pending transactions to process</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">3 invoices generated</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">2 purchase orders pending</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm">1 overdue payment reminder</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest entries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity && recentActivity.length > 0 ? (
                                recentActivity.slice(0, 3).map((activity) => (
                                    <div key={activity.id} className="flex items-center space-x-4">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateSafely(activity.date)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent transactions</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Contact Dashboard Components  
function ContactDashboard() {
    const { data: session } = useSession();
    const { state: dataState } = useData();
    const { dashboardStats } = dataState;

    // Calculate customer-specific stats from dashboardStats
    const getCustomerStats = () => {
        if (!dashboardStats) {
            return {
                outstanding: { value: 0, formatted: '₹0.00' },
                invoiceCount: { value: 0, formatted: '0' },
                paymentCount: { value: 0, formatted: '0' },
                status: 'Active'
            };
        }
        
        return {
            outstanding: {
                value: dashboardStats.pendingInvoices?.amount || 0,
                formatted: dashboardStats.pendingInvoices?.amountFormatted || '₹0.00'
            },
            invoiceCount: {
                value: dashboardStats.pendingInvoices?.value || 0,
                formatted: (dashboardStats.pendingInvoices?.value || 0).toString()
            },
            paymentCount: {
                value: dashboardStats.monthlyPayments?.count || 0,
                formatted: (dashboardStats.monthlyPayments?.count || 0).toString()
            },
            status: 'Active'
        };
    };

    const customerStats = getCustomerStats();

    return (
        <>
            {/* Contact Limited Stats */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 4 }}>
                <StatCard
                    title="My Outstanding"
                    value={customerStats.outstanding.formatted}
                    icon={<AlertCircle className="h-4 w-4" />}
                    description="Pending payments"
                />
                <StatCard
                    title="Recent Invoices"
                    value={customerStats.invoiceCount.formatted}
                    icon={<FileText className="h-4 w-4" />}
                    description="This month"
                />
                <StatCard
                    title="Payment History"
                    value={customerStats.paymentCount.formatted}
                    icon={<CreditCard className="h-4 w-4" />}
                    description="Total payments"
                />
                <StatCard
                    title="Account Status"
                    value={customerStats.status}
                    icon={<CheckCircle className="h-4 w-4" />}
                    description="Good standing"
                />
            </StatsGrid>

            {/* Contact Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <QuickAction
                    title="My Invoices"
                    description="View all my invoices"
                    icon={<FileText className="h-4 w-4" />}
                    href="/dashboard/my-invoices"
                />
                <QuickAction
                    title="Make Payment"
                    description="Pay outstanding bills"
                    icon={<CreditCard className="h-4 w-4" />}
                    href="/dashboard/transactions/payments/my-payments"
                />
                <QuickAction
                    title="My Profile"
                    description="Update contact info"
                    icon={<User className="h-4 w-4" />}
                    href="/dashboard/profile"
                />
            </div>

            {/* Contact Personal Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Invoices</CardTitle>
                        <CardDescription>Your latest invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Invoice #INV-001</p>
                                    <p className="text-xs text-muted-foreground">Due: Dec 30, 2024</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">₹5,250.00</p>
                                    <Badge variant="secondary" className="text-xs">Pending</Badge>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Invoice #INV-002</p>
                                    <p className="text-xs text-muted-foreground">Due: Jan 15, 2025</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">₹7,250.00</p>
                                    <Badge variant="secondary" className="text-xs">Pending</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button asChild className="w-full">
                                <Link href="/dashboard/my-invoices">
                                    View All Invoices
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Quick payment options</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay by Credit Card
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Bank Transfer
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Cash Payment
                            </Button>
                        </div>
                        <div className="mt-4">
                            <Button asChild className="w-full">
                                <Link href="/dashboard/transactions/payments/my-payments">
                                    Make Payment
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Main Role-Based Dashboard Component
export default function RoleBasedDashboard() {
    const { data: session, status } = useSession();
    const { state: dataState, refreshData, clearError } = useData();
    const { userRole, roleConfig } = usePermissions();
    const { loading, error, lastUpdated } = dataState;

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session || !userRole) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p>Please sign in to access the dashboard.</p>
                </div>
            </div>
        );
    }

    const getDashboardTitle = () => {
        const name = session.user?.name || session.user?.email || 'User';
        switch (userRole) {
            case 'ADMIN':
                return `Welcome back, ${name}`;
            case 'ACCOUNTANT':
                return `Good day, ${name}`;
            case 'CONTACT':
                return `Hello, ${name}`;
            default:
                return `Welcome, ${name}`;
        }
    };

    const getDashboardDescription = () => {
        switch (userRole) {
            case 'ADMIN':
                return "Complete business overview and system management";
            case 'ACCOUNTANT':
                return "Transaction management and financial overview";
            case 'CONTACT':
                return "Your personal invoice and payment overview";
            default:
                return "Dashboard overview";
        }
    };

    return (
        <DashboardPageLayout
            title={getDashboardTitle()}
            description={getDashboardDescription()}
            actions={
                <div className="flex items-center gap-2">
                    {error && (
                        <Badge variant="destructive" className="mr-2">
                            Error loading data
                        </Badge>
                    )}
                    {lastUpdated && userRole !== 'CONTACT' && (
                        <span className="text-sm text-muted-foreground mr-2">
                            Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                        </span>
                    )}
                    {userRole !== 'CONTACT' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshData}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    )}
                    {roleConfig && (
                        <Badge className={roleConfig.color}>
                            {roleConfig.icon} {roleConfig.label}
                        </Badge>
                    )}
                </div>
            }
        >
            {/* Error Display */}
            {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-red-800">
                                <p className="font-medium">Error Loading Dashboard Data</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    clearError();
                                    refreshData();
                                }}
                            >
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Role-based Dashboard Content */}
            {userRole === 'ADMIN' && <AdminDashboard />}
            {userRole === 'ACCOUNTANT' && <AccountantDashboard />}
            {userRole === 'CONTACT' && <ContactDashboard />}
        </DashboardPageLayout>
    );
}