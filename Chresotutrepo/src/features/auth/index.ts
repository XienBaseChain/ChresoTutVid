/**
 * Auth Feature Module - Public API
 * 
 * Re-exports all auth-related functionality for easy imports.
 */

export {
    sendStudentMagicLink,
    sendStaffMagicLink,
    verifyMagicLinkSession,
    isValidStaffDomain,
    getStaffDomain,
    type MagicLinkResult,
} from './api/magicLink.api';
