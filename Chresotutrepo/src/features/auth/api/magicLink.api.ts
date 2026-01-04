/**
 * Magic Link Authentication API
 * 
 * Uses Supabase's signInWithOtp for passwordless auth.
 * Gated behind ENABLE_MAGIC_LINK_AUTH feature flag.
 * 
 * Usage:
 *   const result = await sendStudentMagicLink('student@email.com');
 *   if (result.success) { // redirect to confirmation page }
 */

import { supabase, logAction } from '../../../lib/supabase';
import { isFeatureEnabled } from '../../../lib/featureFlags';
import { AUTH_CONFIG, shouldEnforceStaffDomain } from '../../../lib/authConfig';

// Get staff domain from environment (NOT hardcoded per user constraints)
function getConfiguredStaffDomain(): string {
    return AUTH_CONFIG.staffEmailDomain
        ? `@${AUTH_CONFIG.staffEmailDomain}`
        : '@staff.university.edu'; // Fallback, won't be enforced unless configured
}

// ============================================
// API Response Types
// ============================================

export interface MagicLinkResult {
    success: boolean;
    error: string | null;
}

// ============================================
// Magic Link Functions
// ============================================

/**
 * Send magic link to student email (any email domain allowed)
 * 
 * @param email - Student's personal email address
 * @returns Promise with success status and error message if failed
 */
export async function sendStudentMagicLink(email: string): Promise<MagicLinkResult> {
    // Check feature flag
    if (!isFeatureEnabled('ENABLE_MAGIC_LINK_AUTH')) {
        return {
            success: false,
            error: 'Magic link authentication is not currently available'
        };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            error: 'Please enter a valid email address'
        };
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase().trim(),
            options: {
                emailRedirectTo: `${window.location.origin}/auth/v2/verify?role=STUDENT`,
                data: {
                    intended_role: 'STUDENT',
                    auth_provider: 'magic_link',
                },
            },
        });

        if (error) {
            await logAction('MAGIC_LINK_FAIL', `Student: ${email} - ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }

        await logAction('MAGIC_LINK_SENT', `Student: ${email}`);
        return { success: true, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send magic link';
        await logAction('MAGIC_LINK_ERROR', `Student: ${email} - ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Send magic link to staff email (domain restricted to @chresouniversity.edu.zm)
 * 
 * @param email - Staff university email address
 * @returns Promise with success status and error message if failed
 */
export async function sendStaffMagicLink(email: string): Promise<MagicLinkResult> {
    // Check feature flag
    if (!isFeatureEnabled('ENABLE_MAGIC_LINK_AUTH')) {
        return {
            success: false,
            error: 'Magic link authentication is not currently available'
        };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const staffDomain = getConfiguredStaffDomain();

    // Domain validation for staff (only enforced when flag is enabled)
    if (shouldEnforceStaffDomain() && !normalizedEmail.endsWith(staffDomain)) {
        await logAction('STAFF_DOMAIN_FAIL', `Invalid domain attempted: ${email}`);
        return {
            success: false,
            error: `Staff must use their ${staffDomain} university email address`
        };
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/v2/verify?role=STAFF`,
                data: {
                    intended_role: 'STAFF',
                    auth_provider: 'magic_link',
                },
            },
        });

        if (error) {
            await logAction('MAGIC_LINK_FAIL', `Staff: ${email} - ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }

        await logAction('MAGIC_LINK_SENT', `Staff: ${email}`);
        return { success: true, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send magic link';
        await logAction('MAGIC_LINK_ERROR', `Staff: ${email} - ${message}`);
        return { success: false, error: message };
    }
}

/**
 * Verify a magic link token (called when user clicks the link)
 * Supabase handles this automatically via URL params, but this can be used
 * for manual verification if needed.
 */
export async function verifyMagicLinkSession(): Promise<{
    success: boolean;
    user: { id: string; email: string } | null;
    error: string | null;
}> {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            return { success: false, user: null, error: error.message };
        }

        if (!data.session) {
            return { success: false, user: null, error: 'No active session' };
        }

        return {
            success: true,
            user: {
                id: data.session.user.id,
                email: data.session.user.email || '',
            },
            error: null,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Session verification failed';
        return { success: false, user: null, error: message };
    }
}

/**
 * Check if email domain is valid for staff
 */
export function isValidStaffDomain(email: string): boolean {
    const staffDomain = getConfiguredStaffDomain();
    return email.toLowerCase().trim().endsWith(staffDomain);
}

/**
 * Get the required staff domain
 */
export function getStaffDomain(): string {
    return getConfiguredStaffDomain();
}
