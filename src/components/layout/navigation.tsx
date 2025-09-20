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
import { usePermissions } from "@/components/auth/protected-route";
import { Permission } from "@/lib/rbac";
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
  Calculator,
  Receipt
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavigationItem[];
  permissions?: Permission[]; // Required permissions to view this item
  requireAll?: boolean; // If true, user must have ALL permissions
}

// Role-based navigation configuration
const getNavigationItems = (): NavigationItem[] => [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    permissions: ['dashboard:view_full', 'dashboard:view_limited'],
  },
  {
    title: "Contacts",
    href: "/dashboard/contacts",
    icon: Users,
    permissions: ['contacts:view_all', 'contacts:view_own'],
    children: [
      { 
        title: "All Contacts", 
        href: "/dashboard/contacts", 
        icon: Eye,
        permissions: ['contacts:view_all']
      },
      { 
        title: "Add Contact", 
        href: "/dashboard/contacts/new", 
        icon: Plus,
        permissions: ['contacts:create']
      },
      { 
        title: "Customers", 
        href: "/dashboard/contacts/customers", 
        icon: Users,
        permissions: ['contacts:view_all']
      },
      { 
        title: "Vendors", 
        href: "/dashboard/contacts/vendors", 
        icon: Users,
        permissions: ['contacts:view_all']
      },
    ],
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
    permissions: ['products:view'],
    children: [
      { 
        title: "All Products", 
        href: "/dashboard/products", 
        icon: Eye,
        permissions: ['products:view']
      },
      { 
        title: "Add Product", 
        href: "/dashboard/products/new", 
        icon: Plus,
        permissions: ['products:create']
      },
      { 
        title: "Categories", 
        href: "/dashboard/products/categories", 
        icon: Package,
        permissions: ['products:view']
      },
      { 
        title: "Stock Report", 
        href: "/dashboard/products/stock", 
        icon: BarChart3,
        permissions: ['reports:stock_report']
      },
    ],
  },
  {
    title: "Taxes",
    href: "/dashboard/taxes",
    icon: Calculator,
    permissions: ['taxes:view'],
    children: [
      { 
        title: "Tax Rules", 
        href: "/dashboard/taxes", 
        icon: Eye,
        permissions: ['taxes:view']
      },
      { 
        title: "Add Tax Rule", 
        href: "/dashboard/taxes/new", 
        icon: Plus,
        permissions: ['taxes:create']
      },
    ],
  },
  {
    title: "Chart of Accounts",
    href: "/dashboard/settings/chart-of-accounts",
    icon: FileText,
    permissions: ['coa:view'],
  },
  {
    title: "My Invoices",
    href: "/dashboard/my-invoices",
    icon: FileText,
    permissions: ['transactions:customer_invoices:view_own'],
  },
  {
    title: "Transactions",
    href: "/dashboard/transactions",
    icon: ShoppingCart,
    permissions: [
      'transactions:purchase_orders:view',
      'transactions:vendor_bills:view',
      'transactions:vendor_bills:view_own',
      'transactions:sales_orders:view',
      'transactions:customer_invoices:view',
      'transactions:customer_invoices:view_own',
      'transactions:payments:view',
      'transactions:payments:view_own'
    ],
    children: [
      {
        title: "Purchase Orders",
        href: "/dashboard/transactions/purchase-orders",
        icon: CreditCard,
        permissions: ['transactions:purchase_orders:view'],
        children: [
          { 
            title: "All Purchase Orders", 
            href: "/dashboard/transactions/purchase-orders", 
            icon: Eye,
            permissions: ['transactions:purchase_orders:view']
          },
          { 
            title: "Create Purchase Order", 
            href: "/dashboard/transactions/purchase-orders/new", 
            icon: Plus,
            permissions: ['transactions:purchase_orders:create']
          },
        ],
      },
      {
        title: "Vendor Bills",
        href: "/dashboard/transactions/vendor-bills",
        icon: Receipt,
        permissions: ['transactions:vendor_bills:view', 'transactions:vendor_bills:view_own'],
        children: [
          { 
            title: "All Vendor Bills", 
            href: "/dashboard/transactions/vendor-bills", 
            icon: Eye,
            permissions: ['transactions:vendor_bills:view']
          },
          { 
            title: "My Bills", 
            href: "/dashboard/transactions/vendor-bills/my-bills", 
            icon: Eye,
            permissions: ['transactions:vendor_bills:view_own']
          },
          { 
            title: "Create Bill", 
            href: "/dashboard/transactions/vendor-bills/new", 
            icon: Plus,
            permissions: ['transactions:vendor_bills:create']
          },
        ],
      },
      {
        title: "Sales Orders",
        href: "/dashboard/transactions/sales-orders",
        icon: ShoppingCart,
        permissions: ['transactions:sales_orders:view'],
        children: [
          { 
            title: "All Sales Orders", 
            href: "/dashboard/transactions/sales-orders", 
            icon: Eye,
            permissions: ['transactions:sales_orders:view']
          },
          { 
            title: "Create Sales Order", 
            href: "/dashboard/transactions/sales-orders/new", 
            icon: Plus,
            permissions: ['transactions:sales_orders:create']
          },
        ],
      },
      {
        title: "Customer Invoices",
        href: "/dashboard/transactions/customer-invoices",
        icon: FileText,
        permissions: ['transactions:customer_invoices:view', 'transactions:customer_invoices:view_own'],
        children: [
          { 
            title: "All Invoices", 
            href: "/dashboard/transactions/customer-invoices", 
            icon: Eye,
            permissions: ['transactions:customer_invoices:view']
          },
          { 
            title: "My Invoices", 
            href: "/dashboard/my-invoices", 
            icon: Eye,
            permissions: ['transactions:customer_invoices:view_own']
          },
          { 
            title: "Create Invoice", 
            href: "/dashboard/transactions/customer-invoices/new", 
            icon: Plus,
            permissions: ['transactions:customer_invoices:create']
          },
        ],
      },
      {
        title: "Payments",
        href: "/dashboard/transactions/payments",
        icon: DollarSign,
        permissions: ['transactions:payments:view', 'transactions:payments:view_own'],
        children: [
          { 
            title: "All Payments", 
            href: "/dashboard/transactions/payments", 
            icon: Eye,
            permissions: ['transactions:payments:view']
          },
          { 
            title: "My Payments", 
            href: "/dashboard/transactions/payments/my-payments", 
            icon: Eye,
            permissions: ['transactions:payments:view_own']
          },
          { 
            title: "Record Payment", 
            href: "/dashboard/transactions/payments/new", 
            icon: Plus,
            permissions: ['transactions:payments:create']
          },
        ],
      },
    ],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    permissions: ['reports:view_all'],
    children: [
      { 
        title: "Balance Sheet", 
        href: "/dashboard/reports/balance-sheet", 
        icon: Calculator,
        permissions: ['reports:balance_sheet']
      },
      { 
        title: "Profit & Loss", 
        href: "/dashboard/reports/profit-loss", 
        icon: TrendingUp,
        permissions: ['reports:profit_loss']
      },
      { 
        title: "Stock Report", 
        href: "/dashboard/reports/stock-report", 
        icon: Package,
        permissions: ['reports:stock_report']
      },
      { 
        title: "Partner Ledger", 
        href: "/dashboard/reports/partner-ledger", 
        icon: BarChart3,
        permissions: ['reports:partner_ledger']
      },
    ],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permissions: ['settings:view', 'users:view', 'profile:view_own'],
    children: [
      { 
        title: "General", 
        href: "/dashboard/settings/general", 
        icon: Settings,
        permissions: ['settings:general']
      },
      { 
        title: "Tax Settings", 
        href: "/dashboard/settings/taxes", 
        icon: Calculator,
        permissions: ['settings:view']
      },
      { 
        title: "Chart of Accounts", 
        href: "/dashboard/settings/chart-of-accounts", 
        icon: FileText,
        permissions: ['coa:view']
      },
      { 
        title: "User Management", 
        href: "/dashboard/settings/users", 
        icon: Users,
        permissions: ['users:view']
      },
      { 
        title: "My Profile", 
        href: "/dashboard/profile", 
        icon: Users,
        permissions: ['profile:view_own']
      },
      { 
        title: "RBAC Test", 
        href: "/dashboard/rbac-test", 
        icon: Settings,
        permissions: ['users:view', 'settings:system_config']
      },
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
  const { hasAnyPermission, userRole } = usePermissions();
  
  // Get navigation items and filter based on permissions
  const navigationItems = getNavigationItems().filter(item => {
    if (!item.permissions) return true;
    return hasAnyPermission(item.permissions);
  });

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
    // Check permissions for this item
    if (item.permissions && !hasAnyPermission(item.permissions)) {
      return null;
    }

    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems.has(item.title);
    const hasActiveChildren = hasActiveChild(item);

    // Filter children based on permissions
    const visibleChildren = hasChildren 
      ? item.children!.filter(child => {
          if (!child.permissions) return true;
          return hasAnyPermission(child.permissions);
        })
      : [];

    // Don't show parent if no children are visible
    if (hasChildren && visibleChildren.length === 0) {
      return null;
    }

    if (hasChildren && visibleChildren.length > 0) {
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
              {visibleChildren.map((child) => renderNavigationItem(child, level + 1))}
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
      
      {/* Show role indicator for debugging */}
      {userRole && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="px-2 py-1 text-xs text-gray-500">
            Role: <span className="font-medium">{userRole}</span>
          </div>
        </div>
      )}
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

export { getNavigationItems };