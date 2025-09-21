"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DashboardPageLayout,
    StatCard,
    StatsGrid,
    QuickAction
} from "@/components/layout";
import {
    BarChart3,
    Calculator,
    TrendingUp,
    Package,
    FileText,
    Download,
    Calendar,
    DollarSign
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
    const reportCards = [
        {
            title: "Financial Reports",
            description: "Comprehensive financial overview and analytics",
            icon: <TrendingUp className="h-8 w-8" />,
            href: "/dashboard/reports/financial",
            color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
            iconColor: "text-blue-600",
            features: ["Revenue Analysis", "Expense Tracking", "Financial Ratios", "Trend Analysis"]
        },
        {
            title: "Profit & Loss Statement",
            description: "Income and expense analysis over time",
            icon: <BarChart3 className="h-8 w-8" />,
            href: "/dashboard/reports/profit-loss",
            color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
            iconColor: "text-purple-600",
            features: ["Revenue Breakdown", "Cost Analysis", "Gross Profit", "Net Profit"]
        },
        {
            title: "Partner Ledger",
            description: "Detailed transaction history for customers and vendors",
            icon: <FileText className="h-8 w-8" />,
            href: "/dashboard/reports/partner-ledger",
            color: "bg-green-50 border-green-200 hover:bg-green-100",
            iconColor: "text-green-600",
            features: ["Customer Transactions", "Vendor Payments", "Outstanding Balances", "Transaction History"]
        },
        {
            title: "Stock Report",
            description: "Inventory levels and movement tracking",
            icon: <Package className="h-8 w-8" />,
            href: "/dashboard/reports/stock",
            color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
            iconColor: "text-orange-600",
            features: ["Stock Levels", "Stock Value", "Movement History", "Reorder Alerts"]
        }
    ];

    return (
        <DashboardPageLayout
            title="Reports & Analytics"
            description="Generate and view financial reports for your business"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date Range
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                    </Button>
                </div>
            }
        >
            {/* Quick Stats */}
            <StatsGrid columns={{ sm: 1, md: 2, lg: 4 }}>
                <StatCard
                    title="Reports Generated"
                    value="12"
                    icon={<FileText className="h-4 w-4" />}
                    description="This month"
                />
                <StatCard
                    title="Total Revenue"
                    value="₹2,45,000"
                    icon={<DollarSign className="h-4 w-4" />}
                    description="From reports"
                />
                <StatCard
                    title="Stock Value"
                    value="₹85,000"
                    icon={<Package className="h-4 w-4" />}
                    description="Current inventory"
                />
                <StatCard
                    title="Active Reports"
                    value="4"
                    icon={<BarChart3 className="h-4 w-4" />}
                    description="Available reports"
                />
            </StatsGrid>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportCards.map((report) => (
                    <Card key={report.title} className={`${report.color} transition-all duration-200 border-2`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg bg-white shadow-sm ${report.iconColor}`}>
                                    {report.icon}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    Available
                                </Badge>
                            </div>
                            <CardTitle className="text-xl">{report.title}</CardTitle>
                            <CardDescription className="text-sm">
                                {report.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {report.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60"></div>
                                        <span className="text-xs text-muted-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Link href={report.href} className="flex-1">
                                    <Button className="w-full" size="sm">
                                        View Report
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Common reporting tasks and shortcuts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickAction
                            title="Monthly Summary"
                            description="Generate monthly report"
                            icon={<Calendar className="h-6 w-6" />}
                            href="/dashboard/reports/financial"
                        />
                        <QuickAction
                            title="Balance Check"
                            description="View current balance"
                            icon={<Calculator className="h-6 w-6" />}
                            href="/dashboard/reports/balance-sheet"
                        />
                        <QuickAction
                            title="Profit Analysis"
                            description="Analyze profitability"
                            icon={<TrendingUp className="h-6 w-6" />}
                            href="/dashboard/reports/profit-loss"
                        />
                        <QuickAction
                            title="Stock Status"
                            description="Check inventory"
                            icon={<Package className="h-6 w-6" />}
                            href="/dashboard/reports/stock"
                        />
                    </div>
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}
