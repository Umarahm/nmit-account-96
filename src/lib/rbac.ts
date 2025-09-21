// Role-Based Access Control (RBAC) System
// This file defines roles, permissions, and access control logic

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'CONTACT';

export type Permission =
  // Dashboard permissions
  | 'dashboard:view_full'
  | 'dashboard:view_limited'

  // Contact permissions
  | 'contacts:create'
  | 'contacts:edit'
  | 'contacts:delete'
  | 'contacts:archive'
  | 'contacts:view_all'
  | 'contacts:view_own'

  // Product permissions
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'products:archive'
  | 'products:view'

  // Tax permissions
  | 'taxes:create'
  | 'taxes:edit'
  | 'taxes:delete'
  | 'taxes:view'

  // Chart of Accounts permissions
  | 'coa:create'
  | 'coa:edit'
  | 'coa:delete'
  | 'coa:view'
  | 'coa:full_control'

  // Transaction permissions
  | 'transactions:purchase_orders:create'
  | 'transactions:purchase_orders:edit'
  | 'transactions:purchase_orders:delete'
  | 'transactions:purchase_orders:view'

  | 'transactions:vendor_bills:create'
  | 'transactions:vendor_bills:edit'
  | 'transactions:vendor_bills:delete'
  | 'transactions:vendor_bills:view'
  | 'transactions:vendor_bills:view_own'

  | 'transactions:sales_orders:create'
  | 'transactions:sales_orders:edit'
  | 'transactions:sales_orders:delete'
  | 'transactions:sales_orders:view'

  | 'transactions:customer_invoices:create'
  | 'transactions:customer_invoices:edit'
  | 'transactions:customer_invoices:delete'
  | 'transactions:customer_invoices:view'
  | 'transactions:customer_invoices:view_own'

  | 'transactions:payments:create'
  | 'transactions:payments:edit'
  | 'transactions:payments:delete'
  | 'transactions:payments:view'
  | 'transactions:payments:view_own'
  | 'transactions:payments:full_control'

  // Report permissions
  | 'reports:profit_loss'
  | 'reports:stock_report'
  | 'reports:partner_ledger'
  | 'reports:view_all'

  // User management permissions
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:view'
  | 'users:assign_roles'

  // System settings permissions
  | 'settings:system_config'
  | 'settings:archive_data'
  | 'settings:general'
  | 'settings:view'

  // Profile permissions
  | 'profile:edit_own'
  | 'profile:view_own';

// Role definitions with their permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Dashboard - full KPIs overview
    'dashboard:view_full',

    // Contacts - Full CRUD + Archive
    'contacts:create',
    'contacts:edit',
    'contacts:delete',
    'contacts:archive',
    'contacts:view_all',

    // Products - Full CRUD
    'products:create',
    'products:edit',
    'products:delete',
    'products:archive',
    'products:view',

    // Taxes - Full control
    'taxes:create',
    'taxes:edit',
    'taxes:delete',
    'taxes:view',

    // Chart of Accounts - Full control
    'coa:create',
    'coa:edit',
    'coa:delete',
    'coa:view',
    'coa:full_control',

    // Transactions - Full control
    'transactions:purchase_orders:create',
    'transactions:purchase_orders:edit',
    'transactions:purchase_orders:delete',
    'transactions:purchase_orders:view',

    'transactions:vendor_bills:create',
    'transactions:vendor_bills:edit',
    'transactions:vendor_bills:delete',
    'transactions:vendor_bills:view',

    'transactions:sales_orders:create',
    'transactions:sales_orders:edit',
    'transactions:sales_orders:delete',
    'transactions:sales_orders:view',

    'transactions:customer_invoices:create',
    'transactions:customer_invoices:edit',
    'transactions:customer_invoices:delete',
    'transactions:customer_invoices:view',

    'transactions:payments:create',
    'transactions:payments:edit',
    'transactions:payments:delete',
    'transactions:payments:view',
    'transactions:payments:full_control',

    // Reports - All access
    'reports:profit_loss',
    'reports:stock_report',
    'reports:partner_ledger',
    'reports:view_all',

    // User Management - Full control
    'users:create',
    'users:edit',
    'users:delete',
    'users:view',
    'users:assign_roles',

    // Settings - Full control
    'settings:system_config',
    'settings:archive_data',
    'settings:general',
    'settings:view',

    // Profile
    'profile:edit_own',
    'profile:view_own',
  ],

  ACCOUNTANT: [
    // Dashboard - KPIs overview
    'dashboard:view_full',

    // Contacts - Create/Edit (no delete/archive)
    'contacts:create',
    'contacts:edit',
    'contacts:view_all',

    // Products - Create/Edit (no delete/archive)
    'products:create',
    'products:edit',
    'products:view',

    // Taxes - Manage tax rules
    'taxes:create',
    'taxes:edit',
    'taxes:view',

    // Chart of Accounts - Add and edit accounts
    'coa:create',
    'coa:edit',
    'coa:view',

    // Transactions - Full operational access
    'transactions:purchase_orders:create',
    'transactions:purchase_orders:edit',
    'transactions:purchase_orders:view',

    'transactions:vendor_bills:create',
    'transactions:vendor_bills:edit',
    'transactions:vendor_bills:view',

    'transactions:sales_orders:create',
    'transactions:sales_orders:edit',
    'transactions:sales_orders:view',

    'transactions:customer_invoices:create',
    'transactions:customer_invoices:edit',
    'transactions:customer_invoices:view',

    'transactions:payments:create',
    'transactions:payments:edit',
    'transactions:payments:view',

    // Reports - View all reports
    'reports:profit_loss',
    'reports:stock_report',
    'reports:partner_ledger',
    'reports:view_all',

    // Profile
    'profile:edit_own',
    'profile:view_own',
  ],

  CONTACT: [
    // Dashboard - Limited view (own invoices/bills status)
    'dashboard:view_limited',

    // Own data only
    'contacts:view_own',
    'transactions:vendor_bills:view_own',
    'transactions:customer_invoices:view_own',
    'transactions:payments:view_own',

    // Profile management
    'profile:edit_own',
    'profile:view_own',
  ],
};

// Navigation menu configuration based on roles
export interface NavigationItem {
  title: string;
  href: string;
  permissions: Permission[];
  children?: NavigationItem[];
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    permissions: ['dashboard:view_full', 'dashboard:view_limited'],
  },
  {
    title: 'Contacts',
    href: '/dashboard/contacts',
    permissions: ['contacts:view_all', 'contacts:view_own'],
  },
  {
    title: 'Products',
    href: '/dashboard/products',
    permissions: ['products:view'],
  },
  {
    title: 'Taxes',
    href: '/dashboard/taxes',
    permissions: ['taxes:view'],
  },
  {
    title: 'Chart of Accounts',
    href: '/dashboard/settings/chart-of-accounts',
    permissions: ['coa:view'],
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    permissions: [
      'transactions:purchase_orders:view',
      'transactions:vendor_bills:view',
      'transactions:vendor_bills:view_own',
      'transactions:sales_orders:view',
      'transactions:customer_invoices:view',
      'transactions:customer_invoices:view_own',
      'transactions:payments:view',
      'transactions:payments:view_own',
    ],
    children: [
      {
        title: 'Purchase Orders',
        href: '/dashboard/transactions/purchase-orders',
        permissions: ['transactions:purchase_orders:view'],
      },
      {
        title: 'Vendor Bills',
        href: '/dashboard/transactions/vendor-bills',
        permissions: ['transactions:vendor_bills:view', 'transactions:vendor_bills:view_own'],
      },
      {
        title: 'Sales Orders',
        href: '/dashboard/transactions/sales-orders',
        permissions: ['transactions:sales_orders:view'],
      },
      {
        title: 'Customer Invoices',
        href: '/dashboard/transactions/customer-invoices',
        permissions: ['transactions:customer_invoices:view', 'transactions:customer_invoices:view_own'],
      },
      {
        title: 'Payments',
        href: '/dashboard/transactions/payments',
        permissions: ['transactions:payments:view', 'transactions:payments:view_own'],
      },
    ],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    permissions: ['reports:view_all'],
    children: [
      {
        title: 'Profit & Loss',
        href: '/dashboard/reports/profit-loss',
        permissions: ['reports:profit_loss'],
      },
      {
        title: 'Stock Report',
        href: '/dashboard/reports/stock-report',
        permissions: ['reports:stock_report'],
      },
      {
        title: 'Partner Ledger',
        href: '/dashboard/reports/partner-ledger',
        permissions: ['reports:partner_ledger'],
      },
    ],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    permissions: ['settings:view', 'users:view'],
  },
];

// Helper functions for permission checking
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Find navigation item for the route
  const findNavItem = (items: NavigationItem[], targetRoute: string): NavigationItem | null => {
    for (const item of items) {
      if (item.href === targetRoute) {
        return item;
      }
      if (item.children) {
        const found = findNavItem(item.children, targetRoute);
        if (found) return found;
      }
    }
    return null;
  };

  const navItem = findNavItem(NAVIGATION_CONFIG, route);
  if (!navItem) return true; // Allow access to routes not defined in navigation

  return hasAnyPermission(userRole, navItem.permissions);
}

// Role display configurations
export const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrator',
    description: 'Business Owner - Full system access',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: '👑',
  },
  ACCOUNTANT: {
    label: 'Accountant',
    description: 'Invoicing User - Transaction management',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: '📊',
  },
  CONTACT: {
    label: 'Contact',
    description: 'Customer/Vendor - Limited access',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: '👤',
  },
} as const;

// Feature access matrix for quick reference
export const FEATURE_ACCESS_MATRIX = {
  'Dashboard (KPIs)': { ADMIN: true, ACCOUNTANT: true, CONTACT: 'Limited' },
  'Contacts': { ADMIN: 'Full CRUD', ACCOUNTANT: 'Create/Edit', CONTACT: 'Own only' },
  'Products': { ADMIN: 'Full CRUD', ACCOUNTANT: 'Create/Edit', CONTACT: false },
  'Taxes': { ADMIN: true, ACCOUNTANT: true, CONTACT: false },
  'Chart of Accounts': { ADMIN: 'Full Control', ACCOUNTANT: 'Add/Edit', CONTACT: false },
  'Purchase Orders': { ADMIN: true, ACCOUNTANT: true, CONTACT: false },
  'Vendor Bills': { ADMIN: true, ACCOUNTANT: true, CONTACT: 'View Own' },
  'Sales Orders': { ADMIN: true, ACCOUNTANT: true, CONTACT: false },
  'Customer Invoices': { ADMIN: true, ACCOUNTANT: true, CONTACT: 'View Own' },
  'Payments': { ADMIN: 'Full Control', ACCOUNTANT: true, CONTACT: 'Own only' },
  'Reports': { ADMIN: true, ACCOUNTANT: true, CONTACT: false },
  'User Management': { ADMIN: true, ACCOUNTANT: false, CONTACT: false },
  'System Config/Archive': { ADMIN: true, ACCOUNTANT: false, CONTACT: false },
} as const;