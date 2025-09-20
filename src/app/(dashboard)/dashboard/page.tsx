"use client";

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
import { DollarSign, Users, FileText, BarChart3, TrendingUp, Package, ShoppingCart, CreditCard, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p>Please sign in to access the dashboard.</p>
                </div>
            </div>
        );
    }

    const userRole = session.user?.role || "ACCOUNTANT";

    const getRoleColor = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "ACCOUNTANT":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "CONTACT":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    return (
        <DashboardPageLayout
            title={`Welcome back, ${session.user?.name || session.user?.email || 'User'}`}
            description="Here's an overview of your accounting dashboard"
            actions={
                <Badge className={getRoleColor(userRole)}>
                    {userRole}
                </Badge>
            }
        >
            {/* Quick Stats */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
                <StatCard
                    title="Total Revenue"
                    value="₹0.00"
                    icon={<DollarSign className="h-4 w-4" />}
                    description="This month"
                    trend={{
                        value: 0,
                        label: "from last month",
                        direction: "neutral"
                    }}
                />
                <StatCard
                    title="Active Contacts"
                    value="0"
                    icon={<Users className="h-4 w-4" />}
                    description="Total customers/vendors"
                />
                <StatCard
                    title="Pending Invoices"
                    value="0"
                    icon={<FileText className="h-4 w-4" />}
                    description="Awaiting payment"
                    trend={{
                        value: 0,
                        label: "from last week",
                        direction: "neutral"
                    }}
                />
                <StatCard
                    title="Stock Value"
                    value="₹0.00"
                    icon={<Package className="h-4 w-4" />}
                    description="Current inventory"
                />
            </StatsGrid>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest transactions and updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Welcome to Shiv Accounts!</p>
                                    <p className="text-xs text-muted-foreground">Your accounting dashboard is ready</p>
                                </div>
                            </div>
                            <div className="text-center py-8 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No recent activity yet</p>
                                <p className="text-xs">Start by adding contacts or creating transactions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks to get you started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickAction
                                title="Add Contact"
                                description="Customer or vendor"
                                icon={<Users className="h-6 w-6" />}
                                href="/dashboard/contacts/new"
                            />
                            <QuickAction
                                title="Add Product"
                                description="Inventory item"
                                icon={<Package className="h-6 w-6" />}
                                href="/dashboard/products/new"
                            />
                            <QuickAction
                                title="Create Sale"
                                description="New sale order"
                                icon={<ShoppingCart className="h-6 w-6" />}
                                href="/dashboard/sales/new"
                            />
                            <QuickAction
                                title="View Reports"
                                description="Financial insights"
                                icon={<BarChart3 className="h-6 w-6" />}
                                href="/dashboard/reports"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardPageLayout>
    );
}
