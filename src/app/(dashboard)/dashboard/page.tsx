"use client";

import RoleBasedDashboard from '@/components/dashboard/role-based-dashboard';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardPage() {
    return (
        <ProtectedRoute permissions={['dashboard:view_full', 'dashboard:view_limited']}>
            <RoleBasedDashboard />
        </ProtectedRoute>
    );
}
