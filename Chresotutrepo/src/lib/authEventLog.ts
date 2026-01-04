/**
 * Auth Event Logging
 * 
 * Centralized logging for all authentication-related events.
 * All logs are append-only and include timestamps and actor info.
 * 
 * Events logged:
 * - Magic link sent
 * - Magic link verified
 * - Magic link expired
 * - Staff domain validation failure
 * - Admin password reset
 * - SUDO admin action invocation
 * - SUDO persistence blocked
 */

import { supabase } from './supabase';

// ============================================
// AUTH EVENT TYPES
// ============================================

export type AuthEventType =
    | 'MAGIC_LINK_SENT'
    | 'MAGIC_LINK_VERIFIED'
    | 'MAGIC_LINK_EXPIRED'
    | 'MAGIC_LINK_FAILED'
    | 'STAFF_DOMAIN_VALIDATION_FAILURE'
    | 'ADMIN_PASSWORD_RESET'
    | 'SUDO_ACTION_INVOKED'
    | 'SUDO_PERSISTENCE_BLOCKED'
    | 'SESSION_EXPIRED_V2'
    | 'AUTH_PROVIDER_SET';

export interface AuthEventDetails {
    email?: string;
    role?: string;
    context?: string;
    error?: string;
    timestamp?: string;
    [key: string]: unknown;
}

// ============================================
// LOGGING FUNCTIONS
// ============================================

/**
 * Log an authentication event (append-only)
 * 
 * @param eventType - Type of auth event
 * @param details - Additional context for the event
 */
export async function logAuthEvent(
    eventType: AuthEventType,
    details: AuthEventDetails = {}
): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = {
        event: eventType,
        timestamp,
        ...details,
    };

    // Console log for immediate visibility
    console.info(`[AuthEvent] ${eventType}:`, logEntry);

    // Persist to audit log via Supabase RPC
    try {
        const detailsString = JSON.stringify({
            ...details,
            logged_at: timestamp,
        });

        await supabase.rpc('log_action', {
            p_action: `AUTH_EVENT:${eventType}`,
            p_details: detailsString,
        } as never);
    } catch (error) {
        // Don't throw - logging should never break the app
        console.error('[AuthEvent] Failed to persist log:', error);
    }
}

// ============================================
// CONVENIENCE LOGGING FUNCTIONS
// ============================================

/**
 * Log magic link sent event
 */
export async function logMagicLinkSent(email: string, role: string): Promise<void> {
    await logAuthEvent('MAGIC_LINK_SENT', { email, role });
}

/**
 * Log magic link verified event
 */
export async function logMagicLinkVerified(email: string, role: string): Promise<void> {
    await logAuthEvent('MAGIC_LINK_VERIFIED', { email, role });
}

/**
 * Log magic link expired event
 */
export async function logMagicLinkExpired(email: string): Promise<void> {
    await logAuthEvent('MAGIC_LINK_EXPIRED', { email });
}

/**
 * Log staff domain validation failure
 */
export async function logStaffDomainFailure(email: string, expectedDomain: string): Promise<void> {
    await logAuthEvent('STAFF_DOMAIN_VALIDATION_FAILURE', {
        email,
        context: `Expected domain: ${expectedDomain}`,
    });
}

/**
 * Log admin password reset
 */
export async function logAdminPasswordReset(adminEmail: string, targetEmail: string): Promise<void> {
    await logAuthEvent('ADMIN_PASSWORD_RESET', {
        email: targetEmail,
        context: `Reset by: ${adminEmail}`,
    });
}

/**
 * Log SUDO action invocation
 */
export async function logSudoAction(sudoEmail: string, action: string): Promise<void> {
    await logAuthEvent('SUDO_ACTION_INVOKED', {
        email: sudoEmail,
        role: 'SUDO',
        context: action,
    });
}

/**
 * Log auth provider assignment
 */
export async function logAuthProviderSet(
    userId: string,
    provider: 'magic_link' | 'password' | 'legacy'
): Promise<void> {
    await logAuthEvent('AUTH_PROVIDER_SET', {
        context: `User ${userId} set to ${provider}`,
    });
}

/**
 * Log V2 session expiry
 */
export async function logV2SessionExpired(userEmail?: string): Promise<void> {
    await logAuthEvent('SESSION_EXPIRED_V2', {
        email: userEmail ?? undefined,
        context: 'Redirecting to /auth/v2/login',
    });
}
