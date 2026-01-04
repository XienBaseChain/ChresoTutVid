import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import type { Role } from '../types';

interface RBACGuardProps {
    allowedRoles: Role[];
    children: React.ReactNode;
    fallbackPath?: string;
}

/**
 * RBAC Guard - Role-Based Access Control for v2 routes
 * 
 * This is a NEW component that does NOT modify the existing ProtectedRoute.
 * Applied ONLY to new protected routes.
 * 
 * Role Hierarchy:
 *   SUDO > ADMIN > STAFF/STUDENT
 * 
 * Usage:
 *   <RBACGuard allowedRoles={['ADMIN', 'SUDO']}>
 *     <AdminComponent />
 *   </RBACGuard>
 * 
 * IMPORTANT: Only used when ENABLE_ROLE_BASED_ACCESS_V2 flag is enabled.
 * Falls back to basic auth check if flag is disabled.
 */
export function RBACGuard({ allowedRoles, children, fallbackPath = '/dashboard' }: RBACGuardProps) {
    const { isAuthenticated, isLoading, role } = useAuth();
    const { rbacV2Enabled } = useFeatureFlags();
    const location = useLocation();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If RBAC v2 is not enabled, just check authentication (backward compatible)
    if (!rbacV2Enabled) {
        return <>{children}</>;
    }

    // Check role-based access
    if (!role) {
        return <Navigate to={fallbackPath} state={{ accessDenied: true }} replace />;
    }

    // Role hierarchy check
    // SUDO has access to everything
    if (role === 'SUDO') {
        return <>{children}</>;
    }

    // Check if user's role is in allowed roles
    if (allowedRoles.includes(role)) {
        return <>{children}</>;
    }

    // ADMIN can access STAFF and STUDENT resources (but not SUDO)
    if (role === 'ADMIN') {
        const canAccessAsAdmin = allowedRoles.some(r => r === 'STAFF' || r === 'STUDENT' || r === 'ADMIN');
        if (canAccessAsAdmin) {
            return <>{children}</>;
        }
    }

    // Access denied - redirect to fallback
    return <Navigate to={fallbackPath} state={{ accessDenied: true }} replace />;
}

/**
 * Higher-order component version of RBACGuard
 */
export function withRBAC<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    allowedRoles: Role[]
) {
    return function RBACWrappedComponent(props: P) {
        return (
            <RBACGuard allowedRoles={allowedRoles}>
                <WrappedComponent {...props} />
            </RBACGuard>
        );
    };
}

export default RBACGuard;
