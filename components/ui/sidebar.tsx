"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    Calculator,
    Users,
    Package,
    ShoppingCart,
    FileText,
    BarChart3,
    Settings,
    Menu,
    Home,
    Receipt,
    CreditCard,
    TrendingUp,
    Building2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface SidebarProps {
    className?: string;
}

const navigationItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Overview and analytics",
    },
    {
        title: "Contacts",
        href: "/dashboard/contacts",
        icon: Users,
        description: "Customers and vendors",
    },
    {
        title: "Products",
        href: "/dashboard/products",
        icon: Package,
        description: "Product catalog",
    },
    {
        title: "Sales",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        description: "Orders and invoices",
        children: [
            { title: "Sales Orders", href: "/dashboard/sales/orders" },
            { title: "Sales Invoices", href: "/dashboard/sales/invoices" },
        ],
    },
    {
        title: "Purchases",
        href: "/dashboard/purchases",
        icon: Building2,
        description: "Purchase orders and bills",
        children: [
            { title: "Purchase Orders", href: "/dashboard/purchases/orders" },
            { title: "Vendor Bills", href: "/dashboard/purchases/bills" },
        ],
    },
    {
        title: "Transactions",
        href: "/dashboard/transactions",
        icon: CreditCard,
        description: "Financial transactions",
    },
    {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        description: "Financial reports",
        children: [
            { title: "Balance Sheet", href: "/dashboard/reports/balance-sheet" },
            { title: "Profit & Loss", href: "/dashboard/reports/profit-loss" },
            { title: "Stock Statement", href: "/dashboard/reports/stock" },
        ],
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        description: "System configuration",
    },
];

function SidebarContent({
    onItemClick,
    collapsed = false,
    isMobile = false
}: {
    onItemClick?: () => void;
    collapsed?: boolean;
    isMobile?: boolean;
}) {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        );
    };

    return (
        <div className={cn(
            "flex h-full flex-col transition-all duration-300",
            collapsed && !isMobile ? "w-16" : "w-64"
        )}>
            {/* Logo/Brand */}
            <div className={cn(
                "flex h-16 items-center border-b px-4",
                collapsed && !isMobile ? "justify-center px-2" : "justify-start"
            )}>
                <Calculator className="h-8 w-8 text-primary" />
                {(!collapsed || isMobile) && (
                    <span className="ml-2 text-lg font-bold">Shiv Accounts</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navigationItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.includes(item.title);

                    return (
                        <div key={item.title}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start h-auto p-3",
                                    collapsed && !isMobile ? "px-2 justify-center" : "",
                                    isActive && "bg-secondary font-medium"
                                )}
                                onClick={() => {
                                    if (hasChildren) {
                                        toggleExpanded(item.title);
                                    } else {
                                        onItemClick?.();
                                    }
                                }}
                                asChild={!hasChildren}
                            >
                                {hasChildren ? (
                                    <div className="flex items-center w-full">
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {(!collapsed || isMobile) && (
                                            <>
                                                <span className="ml-3 flex-1 text-left">{item.title}</span>
                                                {hasChildren && (
                                                    isExpanded ?
                                                        <ChevronLeft className="h-4 w-4" /> :
                                                        <ChevronRight className="h-4 w-4" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Link href={item.href} onClick={onItemClick}>
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {(!collapsed || isMobile) && (
                                            <span className="ml-3">{item.title}</span>
                                        )}
                                    </Link>
                                )}
                            </Button>

                            {/* Submenu */}
                            {hasChildren && isExpanded && (!collapsed || isMobile) && (
                                <div className="ml-8 mt-1 space-y-1">
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Button
                                                key={child.title}
                                                variant={isChildActive ? "secondary" : "ghost"}
                                                size="sm"
                                                className={cn(
                                                    "w-full justify-start h-auto p-2 text-sm",
                                                    isChildActive && "bg-secondary font-medium"
                                                )}
                                                asChild
                                                onClick={onItemClick}
                                            >
                                                <Link href={child.href}>
                                                    <span className="ml-1">{child.title}</span>
                                                </Link>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Tooltip for collapsed state */}
                            {collapsed && !isMobile && !hasChildren && (
                                <div className="absolute left-16 top-0 z-50 hidden group-hover:block">
                                    <div className="bg-popover text-popover-foreground rounded-md border p-2 shadow-md">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <div className={cn(
                    "flex items-center",
                    collapsed && !isMobile ? "justify-center" : "justify-between"
                )}>
                    {(!collapsed || isMobile) && (
                        <div className="text-xs text-muted-foreground">
                            <p>Shiv Accounts Cloud</p>
                            <p>v1.0.0</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function Sidebar({ className }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={cn("hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-50", className)}>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r">
                    <SidebarContent collapsed={collapsed} />
                </div>

                {/* Collapse Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background p-0 shadow-md"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </Button>
            </div>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden fixed top-4 left-4 z-40"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent isMobile={true} />
                </SheetContent>
            </Sheet>
        </>
    );
}

export default Sidebar;
