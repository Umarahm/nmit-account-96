'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { hasPermission, hasAnyPermission, Permission, UserRole, ROLE_CONFIG } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  permissions, 
  requireAll = false, 
  fallback,
  redirectTo 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/signin');
      return;
    }

    if (redirectTo && !hasAccessToRoute()) {
      router.push(redirectTo);
      return;
    }
  }, [session, status, router]);

  const hasAccessToRoute = (): boolean => {
    if (!session?.user?.role) return false;
    
    const userRole = session.user.role as UserRole;
    
    if (requireAll) {
      return permissions.every(permission => hasPermission(userRole, permission));
    } else {
      return hasAnyPermission(userRole, permissions);
    }
  };

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!session) {
    return null;
  }

  // Check permissions
  if (!hasAccessToRoute()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const userRole = session.user.role as UserRole;
    const roleConfig = ROLE_CONFIG[userRole];

    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-6">
                <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
              </div>
              
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Access Denied
              </h2>
              
              <div className="mb-6 space-y-3">
                <p className="text-gray-600">
                  You don't have permission to access this resource.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Your Current Role:</strong>{' '}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                      {roleConfig.icon} {roleConfig.label}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {roleConfig.description}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Required Permissions:</strong>
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-1">
                    {permissions.map((permission, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                
                {userRole === 'CONTACT' && (
                  <Button asChild>
                    <Link href="/dashboard/profile">
                      View My Profile
                    </Link>
                  </Button>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Need access? Contact your system administrator to request permission changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function usePermissions() {
  const { data: session } = useSession();
  
  const checkPermission = (permission: Permission): boolean => {
    if (!session?.user?.role) return false;
    return hasPermission(session.user.role as UserRole, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!session?.user?.role) return false;
    return hasAnyPermission(session.user.role as UserRole, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!session?.user?.role) return false;
    return permissions.every(permission => hasPermission(session.user.role as UserRole, permission));
  };

  const getUserRole = (): UserRole | null => {
    return (session?.user?.role as UserRole) || null;
  };

  const getRoleConfig = () => {
    const role = getUserRole();
    return role ? ROLE_CONFIG[role] : null;
  };

  return {
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    userRole: getUserRole(),
    roleConfig: getRoleConfig(),
    isAdmin: getUserRole() === 'ADMIN',
    isAccountant: getUserRole() === 'ACCOUNTANT',
    isContact: getUserRole() === 'CONTACT',
  };
}

// Component for conditionally rendering content based on permissions
interface PermissionGateProps {
  permissions: Permission[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ 
  permissions, 
  requireAll = false, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// HOC for protecting components
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissions: Permission[],
  requireAll: boolean = false
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute permissions={permissions} requireAll={requireAll}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}