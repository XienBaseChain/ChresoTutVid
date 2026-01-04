import { useMemo } from 'react';
import { FEATURE_FLAGS, getFeatureFlags, isFeatureEnabled, type FeatureFlags } from '../lib/featureFlags';

/**
 * React hook for feature flag access
 * 
 * Uses centralized FEATURE_FLAGS registry.
 * 
 * Usage:
 *   const { magicLinkEnabled } = useFeatureFlags();
 *   if (magicLinkEnabled) { ... }
 */
export function useFeatureFlags() {
    // Use memoized access to the centralized registry
    const flags = useMemo(() => FEATURE_FLAGS, []);

    return {
        /** Raw flag object from centralized registry */
        flags: getFeatureFlags(),

        /** Magic link (OTP) authentication enabled */
        magicLinkEnabled: flags.MAGIC_LINK,

        /** Role-based access control v2 enabled */
        rbacV2Enabled: flags.RBAC_V2,

        /** SUDO admin functionality enabled (runtime-only) */
        sudoEnabled: flags.SUDO_ADMIN,

        /** Staff email domain enforcement enabled */
        staffDomainEnforcementEnabled: flags.STAFF_DOMAIN_ENFORCEMENT,

        /** Check a specific flag by legacy key */
        isEnabled: (flag: keyof FeatureFlags) => isFeatureEnabled(flag),
    };
}

export default useFeatureFlags;
