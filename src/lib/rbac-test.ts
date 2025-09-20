import { UserRole, hasPermission, hasAnyPermission, hasAllPermissions, ROLE_PERMISSIONS } from '@/lib/rbac';

/**
 * RBAC System Test Suite
 * Tests the Role-Based Access Control implementation
 */

// Mock user sessions for testing
const testUsers = {
  admin: { role: 'ADMIN' as UserRole, name: 'Admin User', email: 'admin@test.com', id: '1' },
  accountant: { role: 'ACCOUNTANT' as UserRole, name: 'Accountant User', email: 'accountant@test.com', id: '2' },
  contact: { role: 'CONTACT' as UserRole, name: 'Contact User', email: 'contact@test.com', id: '3' }
};

// Test cases for different permission scenarios
const testCases = [
  // Dashboard access
  {
    permission: 'dashboard:view_full',
    expectedResults: { admin: true, accountant: true, contact: false }
  },
  {
    permission: 'dashboard:view_limited',
    expectedResults: { admin: true, accountant: false, contact: true }
  },
  
  // Contact management
  {
    permission: 'contacts:create',
    expectedResults: { admin: true, accountant: true, contact: false }
  },
  {
    permission: 'contacts:delete',
    expectedResults: { admin: true, accountant: false, contact: false }
  },
  {
    permission: 'contacts:view_own',
    expectedResults: { admin: false, accountant: false, contact: true }
  },
  
  // Product management
  {
    permission: 'products:create',
    expectedResults: { admin: true, accountant: true, contact: false }
  },
  {
    permission: 'products:delete',
    expectedResults: { admin: true, accountant: false, contact: false }
  },
  
  // User management
  {
    permission: 'users:create',
    expectedResults: { admin: true, accountant: false, contact: false }
  },
  
  // Settings
  {
    permission: 'settings:system_config',
    expectedResults: { admin: true, accountant: false, contact: false }
  },
  
  // Reports
  {
    permission: 'reports:view_all',
    expectedResults: { admin: true, accountant: true, contact: false }
  },
  
  // Profile
  {
    permission: 'profile:edit_own',
    expectedResults: { admin: true, accountant: true, contact: true }
  }
];

/**
 * Run RBAC validation tests
 */
export function runRBACTests() {
  console.log('🔐 Running RBAC System Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test role permissions mapping
  console.log('📋 Role Permissions Summary:');
  Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
    console.log(`${role}: ${permissions.length} permissions`);
  });
  console.log('');
  
  // Test individual permissions
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.permission}`);
    
    Object.entries(testUsers).forEach(([userType, user]) => {
      totalTests++;
      const hasAccess = hasPermission(user.role, testCase.permission as any);
      const expected = testCase.expectedResults[userType as keyof typeof testCase.expectedResults];
      
      if (hasAccess === expected) {
        console.log(`  ✅ ${userType.toUpperCase()}: ${hasAccess ? 'GRANTED' : 'DENIED'} (Expected: ${expected ? 'GRANTED' : 'DENIED'})`);
        passedTests++;
      } else {
        console.log(`  ❌ ${userType.toUpperCase()}: ${hasAccess ? 'GRANTED' : 'DENIED'} (Expected: ${expected ? 'GRANTED' : 'DENIED'}) - FAILED`);
      }
    });
    console.log('');
  });
  
  // Test multiple permissions
  console.log('🔍 Testing Multiple Permissions:');
  
  // Test dashboard access (any of the dashboard permissions)
  const dashboardPermissions = ['dashboard:view_full', 'dashboard:view_limited'];
  Object.entries(testUsers).forEach(([userType, user]) => {
    const hasAnyDashboard = hasAnyPermission(user.role, dashboardPermissions as any);
    console.log(`${userType.toUpperCase()} dashboard access: ${hasAnyDashboard ? 'GRANTED' : 'DENIED'}`);
  });
  
  console.log('');
  
  // Test admin-only features (all admin permissions required)
  const adminOnlyPermissions = ['users:create', 'settings:system_config'];
  Object.entries(testUsers).forEach(([userType, user]) => {
    const hasAllAdmin = hasAllPermissions(user.role, adminOnlyPermissions as any);
    console.log(`${userType.toUpperCase()} admin features: ${hasAllAdmin ? 'GRANTED' : 'DENIED'}`);
  });
  
  console.log('');
  
  // Test results summary
  console.log('📊 Test Results Summary:');
  console.log(`Passed: ${passedTests}/${totalTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All RBAC tests passed! Role-based access control is working correctly.');
  } else {
    console.log('⚠️  Some RBAC tests failed. Please review the permission configuration.');
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

/**
 * Test navigation filtering based on roles
 */
export function testNavigationFiltering() {
  console.log('🧭 Testing Navigation Filtering...\n');
  
  // Sample navigation items (simplified for testing)
  const sampleNavItems = [
    { title: 'Dashboard', permissions: ['dashboard:view_full', 'dashboard:view_limited'] },
    { title: 'All Contacts', permissions: ['contacts:view_all'] },
    { title: 'My Profile', permissions: ['profile:edit_own'] },
    { title: 'User Management', permissions: ['users:view'] },
    { title: 'System Settings', permissions: ['settings:system_config'] },
    { title: 'My Invoices', permissions: ['transactions:customer_invoices:view_own'] }
  ];
  
  Object.entries(testUsers).forEach(([userType, user]) => {
    console.log(`${userType.toUpperCase()} Navigation Items:`);
    
    const visibleItems = sampleNavItems.filter(item => 
      hasAnyPermission(user.role, item.permissions as any)
    );
    
    visibleItems.forEach(item => {
      console.log(`  ✅ ${item.title}`);
    });
    
    const hiddenItems = sampleNavItems.filter(item => 
      !hasAnyPermission(user.role, item.permissions as any)
    );
    
    if (hiddenItems.length > 0) {
      console.log('  Hidden items:');
      hiddenItems.forEach(item => {
        console.log(`    ❌ ${item.title}`);
      });
    }
    
    console.log('');
  });
}

/**
 * Generate RBAC feature comparison table
 */
export function generateFeatureMatrix() {
  console.log('📊 RBAC Feature Access Matrix:\n');
  
  const features = [
    { name: 'Dashboard (Full)', permissions: ['dashboard:view_full'] },
    { name: 'Dashboard (Limited)', permissions: ['dashboard:view_limited'] },
    { name: 'Contact Management', permissions: ['contacts:create', 'contacts:edit'] },
    { name: 'Contact Deletion', permissions: ['contacts:delete'] },
    { name: 'Product Management', permissions: ['products:create', 'products:edit'] },
    { name: 'Product Deletion', permissions: ['products:delete'] },
    { name: 'Tax Management', permissions: ['taxes:create', 'taxes:edit'] },
    { name: 'Chart of Accounts', permissions: ['coa:create', 'coa:edit'] },
    { name: 'Purchase Orders', permissions: ['transactions:purchase_orders:create'] },
    { name: 'Sales Orders', permissions: ['transactions:sales_orders:create'] },
    { name: 'All Reports', permissions: ['reports:view_all'] },
    { name: 'User Management', permissions: ['users:create', 'users:edit'] },
    { name: 'System Settings', permissions: ['settings:system_config'] },
    { name: 'Own Invoices Only', permissions: ['transactions:customer_invoices:view_own'] },
    { name: 'Own Profile', permissions: ['profile:edit_own'] }
  ];
  
  // Table header
  console.log('Feature'.padEnd(25) + 'Admin'.padEnd(10) + 'Accountant'.padEnd(12) + 'Contact');
  console.log('-'.repeat(55));
  
  features.forEach(feature => {
    const adminAccess = hasAnyPermission('ADMIN', feature.permissions as any);
    const accountantAccess = hasAnyPermission('ACCOUNTANT', feature.permissions as any);
    const contactAccess = hasAnyPermission('CONTACT', feature.permissions as any);
    
    const row = feature.name.padEnd(25) + 
                (adminAccess ? '✅' : '❌').padEnd(10) + 
                (accountantAccess ? '✅' : '❌').padEnd(12) + 
                (contactAccess ? '✅' : '❌');
    
    console.log(row);
  });
  
  console.log('');
}

// Export test functions for manual execution
if (typeof window === 'undefined') {
  // Node.js environment - can run tests directly
  // runRBACTests();
  // testNavigationFiltering();
  // generateFeatureMatrix();
}