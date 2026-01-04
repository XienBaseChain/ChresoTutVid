/**
 * Auth Configuration
 * 
 * All auth-related config loaded from environment variables.
 * None of these values are hardcoded to ensure flexibility.
 * 
 * Environment variables:
 *   VITE_STAFF_EMAIL_DOMAIN=chresouniversity.edu.zm (without @)
 *   VITE_MAGIC_LINK_REDIRECT_URL=https://your-app.com/auth/v2/callback
 */
import { isFeatureEnabled } from './featureFlags';

export const AUTH_CONFIG = {
    // Staff email domain (NOT hardcoded - env variable required)
    staffEmailDomain: import.meta.env.VITE_STAFF_EMAIL_DOMAIN as string | undefined,

    // Magic link redirect URL (defaults to current origin)
    magicLinkRedirectUrl: import.meta.env.VITE_MAGIC_LINK_REDIRECT_URL ||
        (typeof window !== 'undefined' ? window.location.origin : ''),
};

/**
 * Check if an email matches the configured staff domain
 * Only enforced for NEW magic-link logins when feature is enabled
 */
export function isStaffEmail(email: string): boolean {
    if (!AUTH_CONFIG.staffEmailDomain) {
        console.warn('VITE_STAFF_EMAIL_DOMAIN not configured');
        return true; // Allow if not configured (fail-open for backward compat)
    }

    const domain = AUTH_CONFIG.staffEmailDomain.toLowerCase();
    return email.toLowerCase().trim().endsWith(`@${domain}`);
}

/**
 * Check if staff domain enforcement should be applied
 */
export function shouldEnforceStaffDomain(): boolean {
    return isFeatureEnabled('ENABLE_STAFF_DOMAIN_ENFORCEMENT') &&
        !!AUTH_CONFIG.staffEmailDomain;
}

/**
 * Validate email for staff magic-link login
 * Returns error message if invalid, null if valid
 */
export function validateStaffEmail(email: string): string | null {
    if (!shouldEnforceStaffDomain()) {
        return null; // No enforcement, always valid
    }

    if (!isStaffEmail(email)) {
        return `Staff login requires a @${AUTH_CONFIG.staffEmailDomain} email address`;
    }

    return null;
}
