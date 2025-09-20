import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission, type Permission, type UserRole } from '@/lib/rbac';

/**
 * API Route Protection Middleware
 * Validates user permissions for API endpoints
 */
export async function withRoleProtection(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  requiredPermissions: Permission[],
  requireAll = false
) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      // Get session
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }

      // Check permissions
      const userRole = session.user.role as UserRole;
      if (!userRole || !['ADMIN', 'ACCOUNTANT', 'CONTACT'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden - Invalid user role' },
          { status: 403 }
        );
      }
      
      const hasRequiredPermission = requireAll
        ? requiredPermissions.every(permission => hasPermission(userRole, permission))
        : requiredPermissions.some(permission => hasPermission(userRole, permission));

      if (!hasRequiredPermission) {
        return NextResponse.json(
          {
            error: 'Forbidden - Insufficient permissions',
            required: requiredPermissions,
            userRole: userRole
          },
          { status: 403 }
        );
      }

      // User has required permissions, proceed with the request
      return handler(req, ...args);
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return NextResponse.json(
        { error: 'Internal server error during authorization' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function to create protected API route handlers
 */
export function createProtectedApiHandler(
  permissions: Permission[],
  requireAll = false
) {
  return function protectedHandler(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return withRoleProtection(handler, permissions, requireAll);
  };
}

/**
 * Common API route protections for different feature areas
 */
export const ApiProtections = {
  // Dashboard & Reports
  dashboard: createProtectedApiHandler(['dashboard:view_full', 'dashboard:view_limited']),
  reports: createProtectedApiHandler(['reports:view_all']),
  
  // Master Data
  contacts: {
    read: createProtectedApiHandler(['contacts:view_all', 'contacts:view_own']),
    create: createProtectedApiHandler(['contacts:create']),
    update: createProtectedApiHandler(['contacts:edit']),
    delete: createProtectedApiHandler(['contacts:delete']),
    archive: createProtectedApiHandler(['contacts:archive'])
  },
  
  products: {
    read: createProtectedApiHandler(['products:view']),
    create: createProtectedApiHandler(['products:create']),
    update: createProtectedApiHandler(['products:edit']),
    delete: createProtectedApiHandler(['products:delete']),
    archive: createProtectedApiHandler(['products:archive'])
  },
  
  taxes: {
    read: createProtectedApiHandler(['taxes:view']),
    manage: createProtectedApiHandler(['taxes:create', 'taxes:edit', 'taxes:delete'])
  },
  
  chartOfAccounts: {
    read: createProtectedApiHandler(['coa:view']),
    create: createProtectedApiHandler(['coa:create']),
    update: createProtectedApiHandler(['coa:edit']),
    delete: createProtectedApiHandler(['coa:delete'])
  },
  
  // Transactions
  purchaseOrders: {
    read: createProtectedApiHandler(['transactions:purchase_orders:view']),
    create: createProtectedApiHandler(['transactions:purchase_orders:create']),
    update: createProtectedApiHandler(['transactions:purchase_orders:edit']),
    delete: createProtectedApiHandler(['transactions:purchase_orders:delete'])
  },
  
  vendorBills: {
    read: createProtectedApiHandler(['transactions:vendor_bills:view', 'transactions:vendor_bills:view_own']),
    create: createProtectedApiHandler(['transactions:vendor_bills:create']),
    update: createProtectedApiHandler(['transactions:vendor_bills:edit']),
    delete: createProtectedApiHandler(['transactions:vendor_bills:delete'])
  },
  
  salesOrders: {
    read: createProtectedApiHandler(['transactions:sales_orders:view']),
    create: createProtectedApiHandler(['transactions:sales_orders:create']),
    update: createProtectedApiHandler(['transactions:sales_orders:edit']),
    delete: createProtectedApiHandler(['transactions:sales_orders:delete'])
  },
  
  customerInvoices: {
    read: createProtectedApiHandler(['transactions:customer_invoices:view', 'transactions:customer_invoices:view_own']),
    create: createProtectedApiHandler(['transactions:customer_invoices:create']),
    update: createProtectedApiHandler(['transactions:customer_invoices:edit']),
    delete: createProtectedApiHandler(['transactions:customer_invoices:delete'])
  },
  
  payments: {
    read: createProtectedApiHandler(['transactions:payments:view', 'transactions:payments:view_own']),
    create: createProtectedApiHandler(['transactions:payments:create']),
    update: createProtectedApiHandler(['transactions:payments:edit']),
    delete: createProtectedApiHandler(['transactions:payments:delete'])
  },
  
  // Administration
  users: {
    read: createProtectedApiHandler(['users:view']),
    create: createProtectedApiHandler(['users:create']),
    update: createProtectedApiHandler(['users:edit']),
    delete: createProtectedApiHandler(['users:delete'])
  },
  
  settings: createProtectedApiHandler(['settings:system_config', 'settings:general'])
};

/**
 * Contact-specific data access control
 * Ensures contacts can only access their own data
 */
export async function withContactDataAccess(
  handler: (req: NextRequest, contactId: string, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }

      const userRole = session.user.role as UserRole;
      const userId = session.user.id;

      if (!userRole || !['ADMIN', 'ACCOUNTANT', 'CONTACT'].includes(userRole)) {
        return NextResponse.json(
          { error: 'Forbidden - Invalid user role' },
          { status: 403 }
        );
      }

      // If user is CONTACT, they can only access their own data
      if (userRole === 'CONTACT') {
        // Extract contact ID from URL or request body
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const contactIdFromPath = pathSegments[pathSegments.length - 1];
        
        // For CONTACT users, ensure they can only access their own data
        if (contactIdFromPath !== userId) {
          return NextResponse.json(
            { error: 'Forbidden - Can only access own data' },
            { status: 403 }
          );
        }
        
        return handler(req, userId, ...args);
      }

      // For ADMIN and ACCOUNTANT, allow access to any contact data
      return handler(req, '', ...args);
    } catch (error) {
      console.error('Contact Data Access Control Error:', error);
      return NextResponse.json(
        { error: 'Internal server error during data access control' },
        { status: 500 }
      );
    }
  };
}