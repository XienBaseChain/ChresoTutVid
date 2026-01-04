/**
 * Feature Flags System - CENTRALIZED REGISTRY
 * 
 * ⚠️ ALL feature flag access MUST go through this module.
 * ⚠️ No direct import.meta.env access for flags outside this file.
 * 
 * All new auth logic is gated behind these flags for instant rollback.
 * 
 * Usage:
 *   import { FEATURE_FLAGS } from './featureFlags';
 *   if (FEATURE_FLAGS.MAGIC_LINK) { ... }
 *   
 * Environment variables (all default to false):
 *   VITE_ENABLE_MAGIC_LINK_AUTH=true
 *   VITE_ENABLE_ROLE_BASED_ACCESS_V2=true
 *   VITE_ENABLE_SUDO_ADMIN=true
 *   VITE_ENABLE_STAFF_DOMAIN_ENFORCEMENT=true
 */

// ============================================
// PRIVATE: Environment Variable Reading
// ============================================
// Only this file reads from import.meta.env for feature flags

function readEnvFlag(key: string): boolean {
    return import.meta.env[key] === 'true';
}

// ============================================
// PUBLIC: Centralized Feature Flag Registry
// ============================================

/**
 * FEATURE_FLAGS - Single source of truth for all feature toggles
 * 
 * All checks throughout the codebase MUST reference this object.
 * Values are computed once at module load time.
 */
export const FEATURE_FLAGS = {
    /** Magic link (OTP) authentication - REQUIRES Supabase SMTP */
    MAGIC_LINK: readEnvFlag('VITE_ENABLE_MAGIC_LINK_AUTH'),

    /** Staff email domain enforcement (new magic-link logins only) */
    STAFF_DOMAIN_ENFORCEMENT: readEnvFlag('VITE_ENABLE_STAFF_DOMAIN_ENFORCEMENT'),

    /** Role-based access control v2 */
    RBAC_V2: readEnvFlag('VITE_ENABLE_ROLE_BASED_ACCESS_V2'),

    /** SUDO admin functionality (runtime-only, NEVER persisted) */
    SUDO_ADMIN: readEnvFlag('VITE_ENABLE_SUDO_ADMIN'),
} as const;

// ============================================
// LEGACY COMPATIBILITY INTERFACE
// ============================================
// These maintain backward compatibility with existing code

export interface FeatureFlags {
    ENABLE_MAGIC_LINK_AUTH: boolean;
    ENABLE_ROLE_BASED_ACCESS_V2: boolean;
    ENABLE_SUDO_ADMIN: boolean;
    ENABLE_STAFF_DOMAIN_ENFORCEMENT: boolean;
}

/**
 * Get all feature flags (legacy interface)
 * @deprecated Use FEATURE_FLAGS directly
 */
export function getFeatureFlags(): FeatureFlags {
    return {
        ENABLE_MAGIC_LINK_AUTH: FEATURE_FLAGS.MAGIC_LINK,
        ENABLE_ROLE_BASED_ACCESS_V2: FEATURE_FLAGS.RBAC_V2,
        ENABLE_SUDO_ADMIN: FEATURE_FLAGS.SUDO_ADMIN,
        ENABLE_STAFF_DOMAIN_ENFORCEMENT: FEATURE_FLAGS.STAFF_DOMAIN_ENFORCEMENT,
    };
}

/**
 * Check if a specific feature is enabled (legacy interface)
 * @deprecated Use FEATURE_FLAGS.FLAG_NAME directly
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
    return getFeatureFlags()[flag];
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): string[] {
    return Object.entries(FEATURE_FLAGS)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name);
}

/**
 * Log current feature flag state (for debugging)
 */
export function logFeatureFlagState(): void {
    console.info('[FeatureFlags] Current state:', FEATURE_FLAGS);
    console.info('[FeatureFlags] Enabled:', getEnabledFeatures());
}
