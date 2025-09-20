'use client';

import { DashboardPageLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, ChevronRight, Building, Calculator, FileText, Users } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const settingsCategories = [
        {
            title: "General",
            description: "Company information, preferences, and basic settings",
            icon: Building,
            href: "/dashboard/settings/general",
        },
        {
            title: "Tax Settings",
            description: "Configure tax rates, GST settings, and tax calculations",
            icon: Calculator,
            href: "/dashboard/settings/tax",
        },
        {
            title: "Chart of Accounts",
            description: "Manage your chart of accounts structure",
            icon: FileText,
            href: "/dashboard/settings/chart-of-accounts",
        },
        {
            title: "User Management",
            description: "Manage users, roles, and permissions",
            icon: Users,
            href: "/dashboard/settings/users",
        },
    ];

    return (
        <DashboardPageLayout
            title="Settings"
            description="Configure your application settings and preferences"
        >
            <div className="grid gap-6">
                {settingsCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                        <Link key={category.title} href={category.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <IconComponent className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{category.title}</h3>
                                            <p className="text-muted-foreground text-sm">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </DashboardPageLayout>
    );
}