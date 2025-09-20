'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UserRole, hasPermission, hasAnyPermission, ROLE_PERMISSIONS, Permission } from '@/lib/rbac';
import { runRBACTests, testNavigationFiltering, generateFeatureMatrix } from '@/lib/rbac-test';
import { CheckCircle2, XCircle, Play, Users, Shield, TestTube } from 'lucide-react';

export default function RBACTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    
    // Simulate running tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const results = runRBACTests();
      setTestResults(results);
      
      // Also run other tests and log to console
      console.log('\\n--- Navigation Filtering Tests ---');
      testNavigationFiltering();
      
      console.log('\\n--- Feature Access Matrix ---');
      generateFeatureMatrix();
      
    } catch (error) {
      console.error('Error running RBAC tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample test cases for display
  const samplePermissionTests = [
    {
      permission: 'dashboard:view_full',
      description: 'Full dashboard access',
      roles: {
        ADMIN: hasPermission('ADMIN', 'dashboard:view_full'),
        ACCOUNTANT: hasPermission('ACCOUNTANT', 'dashboard:view_full'),
        CONTACT: hasPermission('CONTACT', 'dashboard:view_full')
      }
    },
    {
      permission: 'contacts:delete',
      description: 'Delete contacts',
      roles: {
        ADMIN: hasPermission('ADMIN', 'contacts:delete'),
        ACCOUNTANT: hasPermission('ACCOUNTANT', 'contacts:delete'),
        CONTACT: hasPermission('CONTACT', 'contacts:delete')
      }
    },
    {
      permission: 'users:create',
      description: 'Create new users',
      roles: {
        ADMIN: hasPermission('ADMIN', 'users:create'),
        ACCOUNTANT: hasPermission('ACCOUNTANT', 'users:create'),
        CONTACT: hasPermission('CONTACT', 'users:create')
      }
    },
    {
      permission: 'transactions:customer_invoices:view_own',
      description: 'View own invoices only',
      roles: {
        ADMIN: hasPermission('ADMIN', 'transactions:customer_invoices:view_own'),
        ACCOUNTANT: hasPermission('ACCOUNTANT', 'transactions:customer_invoices:view_own'),
        CONTACT: hasPermission('CONTACT', 'transactions:customer_invoices:view_own')
      }
    },
    {
      permission: 'settings:system_config',
      description: 'System configuration',
      roles: {
        ADMIN: hasPermission('ADMIN', 'settings:system_config'),
        ACCOUNTANT: hasPermission('ACCOUNTANT', 'settings:system_config'),
        CONTACT: hasPermission('CONTACT', 'settings:system_config')
      }
    }
  ];

  const getRolePermissionCount = (role: UserRole) => {
    return ROLE_PERMISSIONS[role]?.length || 0;
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <ProtectedRoute permissions={['users:view', 'settings:system_config']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RBAC System Test</h1>
            <p className="text-muted-foreground">
              Validate Role-Based Access Control implementation
            </p>
          </div>
          <Button onClick={runTests} disabled={loading}>
            {loading ? (
              <>
                <TestTube className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Full Tests
              </>
            )}
          </Button>
        </div>

        {/* Test Results Summary */}
        {testResults && (
          <Card className={testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {testResults.passed}/{testResults.total} tests passed 
                ({Math.round((testResults.passed / testResults.total) * 100)}%)
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {testResults.success 
                  ? 'All RBAC tests passed! Role-based access control is working correctly.'
                  : 'Some tests failed. Check the console for detailed results.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Role Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Admin Role
              </CardTitle>
              <CardDescription>Business Owner - Full Access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getRolePermissionCount('ADMIN')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Permissions
              </p>
              <div className="mt-4 space-y-1">
                <Badge variant="secondary" className="text-xs">Full Dashboard</Badge>
                <Badge variant="secondary" className="text-xs">User Management</Badge>
                <Badge variant="secondary" className="text-xs">System Settings</Badge>
                <Badge variant="secondary" className="text-xs">All Transactions</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Accountant Role
              </CardTitle>
              <CardDescription>Invoicing User - Limited Access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getRolePermissionCount('ACCOUNTANT')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Permissions
              </p>
              <div className="mt-4 space-y-1">
                <Badge variant="secondary" className="text-xs">Full Dashboard</Badge>
                <Badge variant="secondary" className="text-xs">CRUD Contacts/Products</Badge>
                <Badge variant="secondary" className="text-xs">All Reports</Badge>
                <Badge variant="outline" className="text-xs">No User Mgmt</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Contact Role
              </CardTitle>
              <CardDescription>Customer/Vendor - Own Data Only</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getRolePermissionCount('CONTACT')}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Permissions
              </p>
              <div className="mt-4 space-y-1">
                <Badge variant="secondary" className="text-xs">Limited Dashboard</Badge>
                <Badge variant="secondary" className="text-xs">Own Invoices</Badge>
                <Badge variant="secondary" className="text-xs">Own Profile</Badge>
                <Badge variant="outline" className="text-xs">No Master Data</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permission Test Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Test Matrix</CardTitle>
            <CardDescription>
              Sample permission tests showing access control for different roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Permission</th>
                    <th className="text-center p-3 font-semibold">Admin</th>
                    <th className="text-center p-3 font-semibold">Accountant</th>
                    <th className="text-center p-3 font-semibold">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePermissionTests.map((test, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-sm">{test.description}</div>
                          <div className="text-xs text-gray-500 font-mono">{test.permission}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getPermissionIcon(test.roles.ADMIN)}
                      </td>
                      <td className="p-3 text-center">
                        {getPermissionIcon(test.roles.ACCOUNTANT)}
                      </td>
                      <td className="p-3 text-center">
                        {getPermissionIcon(test.roles.CONTACT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Status */}
        <Card>
          <CardHeader>
            <CardTitle>RBAC Implementation Status</CardTitle>
            <CardDescription>
              Current status of Role-Based Access Control features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">✅ Completed Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Permission system with 3 distinct roles</li>
                  <li>• Role-based navigation filtering</li>
                  <li>• Protected route components</li>
                  <li>• Dashboard customization by role</li>
                  <li>• Contact-specific limited access pages</li>
                  <li>• Profile management for all roles</li>
                  <li>• RBAC middleware for API protection</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">🔧 Architecture Components</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code>rbac.ts</code> - Core permission system</li>
                  <li>• <code>ProtectedRoute</code> - Page-level protection</li>
                  <li>• <code>usePermissions</code> - React hooks</li>
                  <li>• <code>ApiProtections</code> - API middleware</li>
                  <li>• <code>RoleBasedDashboard</code> - Custom dashboards</li>
                  <li>• Navigation filtering by permissions</li>
                  <li>• Contact data access controls</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
            <CardDescription>
              How to test the RBAC implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">1. Role Switching</h4>
                <p className="text-sm text-muted-foreground">
                  Update your user role in the database or session to test different access levels.
                  The system supports ADMIN, ACCOUNTANT, and CONTACT roles.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">2. Navigation Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Notice how menu items appear/disappear based on your role. Contact users see
                  "My Invoices" and "My Profile" while Admin users see "User Management" and "Settings".
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">3. Page Access Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Try accessing protected pages directly via URL. Users without proper permissions
                  will see an access denied page with role requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">4. Console Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Run Full Tests" above to execute comprehensive RBAC tests in the browser console.
                  Check the console for detailed test results and permission matrices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}