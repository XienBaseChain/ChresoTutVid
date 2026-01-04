/**
 * SUDO Admin Configuration
 * 
 * SUDO credentials are NEVER stored in database.
 * Loaded from environment variables only.
 * 
 * Environment variables required:
 *   VITE_SUDO_ADMIN_EMAIL=sudo@chresouniversity.edu.zm
 * 
 * Password verification happens server-side via Supabase Auth.
 * The SUDO user must be created in Supabase Auth with matching email.
 */

import { isFeatureEnabled } from './featureFlags';

export const SUDO_CONFIG = {
    email: import.meta.env.VITE_SUDO_ADMIN_EMAIL as string | undefined,
    // Password hash for server-side verification (never stored in DB)
    // Generate with: node -e "console.log(require('crypto').createHash('sha256').update('password').digest('hex'))"
    passwordHash: import.meta.env.VITE_SUDO_ADMIN_PASSWORD_HASH as string | undefined,
};

/**
 * Check if an email matches the SUDO admin
 * Only works when SUDO feature is enabled
 */
export function isSudoAdmin(email: string | null | undefined): boolean {
    if (!email || !isFeatureEnabled('ENABLE_SUDO_ADMIN')) {
        return false;
    }

    if (!SUDO_CONFIG.email) {
        console.warn('SUDO admin email not configured in environment');
        return false;
    }

    return email.toLowerCase().trim() === SUDO_CONFIG.email.toLowerCase().trim();
}

/**
 * Check if SUDO admin is properly configured
 */
export function isSudoConfigured(): boolean {
    return !!(SUDO_CONFIG.email && isFeatureEnabled('ENABLE_SUDO_ADMIN'));
}
