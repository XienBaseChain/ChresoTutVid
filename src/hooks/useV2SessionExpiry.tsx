import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logV2SessionExpired } from '../lib/authEventLog';

/**
 * V2 Session Expiry Handler Hook
 * 
 * Monitors session state and redirects to V2 login on expiry.
 * ONLY applies to /auth/v2/* routes - legacy routes unaffected.
 * 
 * Usage:
 *   useV2SessionExpiry(); // In V2 route components
 */
export function useV2SessionExpiry() {
    const navigate = useNavigate();
    const location = useLocation();

    const isV2Route = location.pathname.startsWith('/auth/v2');

    const handleSessionExpiry = useCallback(async () => {
        // Only handle V2 routes
        if (!isV2Route) return;

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Session expired on V2 route - redirect to V2 login
            await logV2SessionExpired(undefined);
            navigate('/auth/v2/login', { replace: true });
        }
    }, [isV2Route, navigate]);

    useEffect(() => {
        // Only run on V2 routes
        if (!isV2Route) return;

        // Check session on mount
        handleSessionExpiry();

        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                    if (!session && isV2Route) {
                        await logV2SessionExpired();
                        navigate('/auth/v2/login', { replace: true });
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [isV2Route, navigate, handleSessionExpiry]);
}

/**
 * V2 Session Guard Component
 * 
 * Wrapper component that redirects to V2 login if session expires.
 * Use this as a wrapper around V2 protected content.
 */
export function V2SessionGuard({ children }: { children: React.ReactNode }) {
    useV2SessionExpiry();
    return <>{children}</>;
}

export default useV2SessionExpiry;
