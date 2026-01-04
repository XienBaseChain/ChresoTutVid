/**
 * Auth V2 Module
 * 
 * Contains all new auth features gated behind feature flags.
 * This module is ADDITIVE - does not modify existing auth flows.
 * 
 * Features:
 *   - Magic link (OTP) authentication via signInWithOtp()
 *   - Staff email domain validation
 * 
 * All features are DISABLED by default and require explicit
 * environment variable activation.
 */
import { supabase } from './supabase';
import { isFeatureEnabled } from './featureFlags';
import { AUTH_CONFIG, validateStaffEmail } from './authConfig';

export interface MagicLinkResult {
    success: boolean;
    error: string | null;
}

/**
 * Send magic link email for OTP authentication
 * ONLY works when ENABLE_MAGIC_LINK_AUTH is true
 * 
 * @param email - User email address
 * @param options.isStaff - If true, enforce staff domain when that flag is enabled
 */
export async function sendMagicLink(
    email: string,
    options?: { isStaff?: boolean }
): Promise<MagicLinkResult> {
    // Gate behind feature flag - fail gracefully
    if (!isFeatureEnabled('ENABLE_MAGIC_LINK_AUTH')) {
        return {
            success: false,
            error: 'Magic link authentication is not enabled. Please use email/password login.',
        };
    }

    // Enforce staff domain for staff users (only when enforcement flag is enabled)
    if (options?.isStaff) {
        const domainError = validateStaffEmail(email);
        if (domainError) {
            return {
                success: false,
                error: domainError,
            };
        }
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
                emailRedirectTo: `${AUTH_CONFIG.magicLinkRedirectUrl}/auth/v2/callback`,
            },
        });

        if (error) {
            return {
                success: false,
                error: error.message || 'Failed to send magic link email',
            };
        }

        return {
            success: true,
            error: null,
        };
    } catch (err) {
        console.error('Magic link error:', err);
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}

/**
 * Verify magic link token from email callback
 * Called when user clicks the link in their email
 */
export async function verifyMagicLinkToken(
    tokenHash: string,
    type: 'email' | 'magiclink' = 'email'
): Promise<MagicLinkResult> {
    if (!isFeatureEnabled('ENABLE_MAGIC_LINK_AUTH')) {
        return {
            success: false,
            error: 'Magic link authentication is not enabled',
        };
    }

    try {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
        });

        if (error) {
            return {
                success: false,
                error: error.message || 'Failed to verify magic link',
            };
        }

        return {
            success: true,
            error: null,
        };
    } catch (err) {
        console.error('Magic link verification error:', err);
        return {
            success: false,
            error: 'An unexpected error occurred during verification',
        };
    }
}

/**
 * Check if magic link auth is available
 */
export function isMagicLinkEnabled(): boolean {
    return isFeatureEnabled('ENABLE_MAGIC_LINK_AUTH');
}
