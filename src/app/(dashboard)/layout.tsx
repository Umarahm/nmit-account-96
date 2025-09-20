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
import { Navigation } from "@/components/layout";
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
                        <Navigation />
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

                <SidebarInset className="flex flex-col min-h-screen">
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Dashboard</span>
                        </div>
                    </header>
                    <main className="flex-1 p-6">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
