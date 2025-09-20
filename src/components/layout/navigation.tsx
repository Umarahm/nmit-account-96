"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
// Using custom collapsible logic instead of external component
import { 
  Home,
  Users,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  DollarSign,
  Menu,
  ChevronDown,
  Plus,
  Eye,
  CreditCard,
  TrendingUp,
  Calculator
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Contacts",
    href: "/dashboard/contacts",
    icon: Users,
    children: [
      { title: "All Contacts", href: "/dashboard/contacts", icon: Eye },
      { title: "Add Contact", href: "/dashboard/contacts/new", icon: Plus },
      { title: "Customers", href: "/dashboard/contacts/customers", icon: Users },
      { title: "Vendors", href: "/dashboard/contacts/vendors", icon: Users },
    ],
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
    children: [
      { title: "All Products", href: "/dashboard/products", icon: Eye },
      { title: "Add Product", href: "/dashboard/products/new", icon: Plus },
      { title: "Categories", href: "/dashboard/products/categories", icon: Package },
      { title: "Stock Report", href: "/dashboard/products/stock", icon: BarChart3 },
    ],
  },
  {
    title: "Sales",
    href: "/dashboard/sales",
    icon: ShoppingCart,
    children: [
      { title: "Sales Orders", href: "/dashboard/sales", icon: ShoppingCart },
      { title: "Create Sale", href: "/dashboard/sales/new", icon: Plus },
      { title: "Quotations", href: "/dashboard/sales/quotations", icon: FileText },
    ],
  },
  {
    title: "Purchases",
    href: "/dashboard/purchases",
    icon: CreditCard,
    children: [
      { title: "Purchase Orders", href: "/dashboard/purchases", icon: CreditCard },
      { title: "Create Purchase", href: "/dashboard/purchases/new", icon: Plus },
      { title: "Vendor Bills", href: "/dashboard/purchases/bills", icon: FileText },
    ],
  },
  {
    title: "Invoices",
    href: "/dashboard/invoices",
    icon: FileText,
    badge: "3",
    children: [
      { title: "All Invoices", href: "/dashboard/invoices", icon: Eye },
      { title: "Create Invoice", href: "/dashboard/invoices/new", icon: Plus },
      { title: "Pending", href: "/dashboard/invoices/pending", icon: FileText },
      { title: "Overdue", href: "/dashboard/invoices/overdue", icon: FileText },
    ],
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: DollarSign,
    children: [
      { title: "All Payments", href: "/dashboard/payments", icon: Eye },
      { title: "Record Payment", href: "/dashboard/payments/new", icon: Plus },
      { title: "Payment Methods", href: "/dashboard/payments/methods", icon: CreditCard },
    ],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    children: [
      { title: "Financial Reports", href: "/dashboard/reports/financial", icon: TrendingUp },
      { title: "Balance Sheet", href: "/dashboard/reports/balance-sheet", icon: Calculator },
      { title: "P&L Statement", href: "/dashboard/reports/pnl", icon: BarChart3 },
      { title: "Stock Report", href: "/dashboard/reports/stock", icon: Package },
    ],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    children: [
      { title: "General", href: "/dashboard/settings", icon: Settings },
      { title: "Tax Settings", href: "/dashboard/settings/taxes", icon: Calculator },
      { title: "Chart of Accounts", href: "/dashboard/settings/accounts", icon: FileText },
      { title: "User Management", href: "/dashboard/settings/users", icon: Users },
    ],
  },
];

interface NavigationProps {
  className?: string;
  isMobile?: boolean;
}

export function Navigation({ className, isMobile = false }: NavigationProps) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (title: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(title)) {
      newOpenItems.delete(title);
    } else {
      newOpenItems.add(title);
    }
    setOpenItems(newOpenItems);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavigationItem) => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child.href));
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.has(item.title);
    const hasActiveChildren = hasActiveChild(item);

    if (hasChildren) {
      return (
        <div key={item.title}>
          <Button
            variant={active || hasActiveChildren ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 h-10",
              level > 0 && "ml-4 w-[calc(100%-1rem)]",
              (active || hasActiveChildren) && "bg-primary/10 text-primary",
              className
            )}
            onClick={() => toggleItem(item.title)}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </Button>
          {isOpen && (
            <div className="space-y-1 pt-1">
              {item.children?.map((child) => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={item.href}
        variant={active ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2 h-10",
          level > 0 && "ml-4 w-[calc(100%-1rem)]",
          active && "bg-primary/10 text-primary",
          className
        )}
        asChild
      >
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </Link>
      </Button>
    );
  };

  const navigationContent = (
    <nav className="space-y-1 p-2">
      {navigationItems.map((item) => renderNavigationItem(item))}
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Navigation
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {navigationContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return navigationContent;
}

export { navigationItems };