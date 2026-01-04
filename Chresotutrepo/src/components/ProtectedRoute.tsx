import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface ProtectedRouteProps {
    allowedRoles?: Role[];
    children?: React.ReactNode;
}

/**
 * ProtectedRoute - Server-validated route guard
 * 
 * Usage:
 * - Wrap routes that require authentication
 * - Optionally specify allowedRoles to restrict by role
 * 
 * Examples:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 * 
 *   <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
 *     <Route path="/admin/*" element={<AdminLayout />} />
 *   </Route>
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, role } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // Save the attempted location for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && allowedRoles.length > 0) {
        if (!role || !allowedRoles.includes(role)) {
            // User is authenticated but doesn't have the required role
            // Redirect to dashboard with access denied message
            return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />;
        }
    }

    // Render children or Outlet for nested routes
    return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
