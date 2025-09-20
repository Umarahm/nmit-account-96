"use client";

import {
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger
} from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
    Home,
    Users,
    Package,
    ShoppingCart,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    DollarSign
} from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    const navigationItems = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: Home,
        },
        {
            title: "Contacts",
            url: "/dashboard/contacts",
            icon: Users,
        },
        {
            title: "Products",
            url: "/dashboard/products",
            icon: Package,
        },
        {
            title: "Sales",
            url: "/dashboard/sales",
            icon: ShoppingCart,
        },
        {
            title: "Invoices",
            url: "/dashboard/invoices",
            icon: FileText,
        },
        {
            title: "Reports",
            url: "/dashboard/reports",
            icon: BarChart3,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings,
        },
    ];

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-background flex w-full">
                <Sidebar>
                    <SidebarHeader className="border-b">
                        <div className="flex items-center gap-2 px-2 py-2">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-6 w-6 text-primary" />
                                <span className="font-semibold">Shiv Accounts</span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navigationItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild>
                                                <a href={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t">
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </Button>
                        </div>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                <SidebarInset>
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background px-4">
                        <SidebarTrigger className="-ml-1" />
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Dashboard</span>
                        </div>
                    </header>
                    <main className="flex-1">
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
