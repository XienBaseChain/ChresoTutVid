/**
 * SUDO Admin Runtime Guard
 * 
 * ⚠️ CRITICAL: SUDO role is RUNTIME-ONLY and NEVER persisted to database.
 * 
 * This module provides guards to prevent SUDO from being written to the DB
 * and logs any blocked attempts.
 */

import { FEATURE_FLAGS } from './featureFlags';
import { supabase } from './supabase';

// ============================================
// SUDO ROLE CONSTANTS
// ============================================

/** SUDO role identifier - NEVER write this to DB */
export const SUDO_ROLE = 'SUDO' as const;

/** Roles that CAN be persisted to database */
export const PERSISTABLE_ROLES = ['STAFF', 'STUDENT', 'ADMIN'] as const;
export type PersistableRole = typeof PERSISTABLE_ROLES[number];

// ============================================
// RUNTIME GUARD FUNCTIONS
// ============================================

/**
 * Check if a role is safe to persist to database
 * Returns false for SUDO role
 */
export function isRolePersistable(role: string | null | undefined): role is PersistableRole {
    if (!role) return false;
    return PERSISTABLE_ROLES.includes(role as PersistableRole);
}

/**
 * Guard function to block SUDO role from being written to database
 * Throws error and logs the attempt if SUDO is detected
 * 
 * @param role - The role being written
 * @param context - Description of where the write is happening
 * @throws Error if role is SUDO
 */
export function assertNotSudoForPersistence(role: string | null | undefined, context: string): void {
    if (role === SUDO_ROLE) {
        const errorMessage = `[SUDO_GUARD] BLOCKED: Attempt to persist SUDO role to database in ${context}`;

        // Log the blocked attempt
        console.error(errorMessage);

        // Log to audit via supabase (fire and forget)
        void supabase.rpc('log_action', {
            p_action: 'SUDO_PERSISTENCE_BLOCKED',
            p_details: JSON.stringify({ context, timestamp: new Date().toISOString() }),
        } as never).then(({ error }) => {
            if (error) console.error('[SUDO_GUARD] Failed to log:', error);
        });

        throw new Error('SUDO role cannot be persisted to database');
    }
}

/**
 * Sanitize role for database persistence
 * Returns null if role is SUDO (which will be rejected by DB constraint anyway)
 */
export function sanitizeRoleForPersistence(role: string | null | undefined): PersistableRole | null {
    if (!role) return null;
    if (role === SUDO_ROLE) {
        console.warn('[SUDO_GUARD] Sanitized SUDO role to null for persistence');
        return null;
    }
    if (isRolePersistable(role)) {
        return role;
    }
    return null;
}

// ============================================
// SUDO RUNTIME STATE
// ============================================

/**
 * Check if current user should have SUDO privileges (runtime only)
 * This is derived from email match, NOT from database
 */
export function isSudoSession(userEmail: string | null | undefined): boolean {
    if (!FEATURE_FLAGS.SUDO_ADMIN) {
        return false;
    }

    const sudoEmail = import.meta.env.VITE_SUDO_ADMIN_EMAIL;
    if (!sudoEmail || !userEmail) {
        return false;
    }

    return userEmail.toLowerCase().trim() === sudoEmail.toLowerCase().trim();
}

/**
 * Get effective role for UI/routing purposes
 * Returns SUDO if user email matches and feature is enabled (runtime only)
 * Otherwise returns the DB-stored role
 */
export function getEffectiveRole(
    dbRole: string | null | undefined,
    userEmail: string | null | undefined
): string | null {
    // SUDO overrides DB role at runtime (but only for display/auth checks)
    if (isSudoSession(userEmail)) {
        return SUDO_ROLE;
    }
    return dbRole ?? null;
}
