# Auth Upgrade V2 - Complete Walkthrough

**Date**: 2025-12-31  
**Status**: ✅ Complete (All features disabled by default)

---

## Prerequisites

> [!CAUTION]
> **SMTP Required for Magic Link**: Supabase email delivery must be configured before enabling `VITE_ENABLE_MAGIC_LINK_AUTH=true`

> [!IMPORTANT]
> **Magic links are DISABLED by default**. No user action required until SMTP is configured.

---

## Feature Flag Dependency Order

Enable features in this order to avoid runtime errors:

1. **SMTP Configuration** (Supabase Dashboard → Settings → Auth → SMTP)
2. `VITE_STAFF_EMAIL_DOMAIN=your.domain.edu` (set first)
3. `VITE_ENABLE_STAFF_DOMAIN_ENFORCEMENT=true` (optional)
4. `VITE_ENABLE_MAGIC_LINK_AUTH=true` (requires SMTP)
5. `VITE_SUDO_ADMIN_EMAIL=admin@...`
6. `VITE_SUDO_ADMIN_PASSWORD_HASH=...` (generate hash)
7. `VITE_ENABLE_SUDO_ADMIN=true`

---

## Files Modified / Created

### Core Feature Flags
| File | Change |
|------|--------|
| `src/lib/featureFlags.ts` | Centralized `FEATURE_FLAGS` registry |
| `src/hooks/useFeatureFlags.ts` | Updated to use central registry |

### SUDO Admin (Runtime-Only)
| File | Change |
|------|--------|
| `src/lib/sudoGuard.ts` | **[NEW]** SUDO runtime guard, blocks DB persistence |
| `src/lib/sudoConfig.ts` | Password hash support added |

### Auth Event Logging
| File | Change |
|------|--------|
| `src/lib/authEventLog.ts` | **[NEW]** Centralized auth event logging |

### Session Handling
| File | Change |
|------|--------|
| `src/hooks/useV2SessionExpiry.tsx` | **[NEW]** V2 session expiry handler |

### Staff Domain
| File | Change |
|------|--------|
| `src/lib/authConfig.ts` | Configurable `VITE_STAFF_EMAIL_DOMAIN` |
| `src/features/auth/api/magicLink.api.ts` | Removed hardcoded domain |

### Documentation
| File | Change |
|------|--------|
| `.env.example` | **[NEW]** All environment variables |
| `AUTH_UPGRADE_WALKTHROUGH.md` | **[UPDATED]** This file |

---

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Feature Flags (all default: false)
VITE_ENABLE_MAGIC_LINK_AUTH=false
VITE_ENABLE_STAFF_DOMAIN_ENFORCEMENT=false
VITE_ENABLE_SUDO_ADMIN=false
VITE_ENABLE_ROLE_BASED_ACCESS_V2=false

# Staff Domain (configurable, not hardcoded)
VITE_STAFF_EMAIL_DOMAIN=

# SUDO Admin (runtime-only, NEVER in DB)
VITE_SUDO_ADMIN_EMAIL=
VITE_SUDO_ADMIN_PASSWORD_HASH=
```

---

## Key Constraints Verified

| Constraint | Status | Implementation |
|------------|--------|----------------|
| SUDO never persisted to DB | ✅ | `sudoGuard.ts` blocks writes |
| Staff domain configurable | ✅ | `VITE_STAFF_EMAIL_DOMAIN` |
| Magic link disabled by default | ✅ | `FEATURE_FLAGS.MAGIC_LINK = false` |
| Legacy `/login` unchanged | ✅ | Original `LoginPage.tsx` untouched |
| All flags default false | ✅ | Verified in `featureFlags.ts` |

---

## Verification Results

```
✅ npm run build    - Success
✅ npm run test     - 3/3 passing
✅ Legacy login     - Unchanged
✅ V2 routes exist  - /auth/v2/login, /auth/v2/verify
```

---

## Rollback Instructions

Set all flags to `false`:
```bash
VITE_ENABLE_MAGIC_LINK_AUTH=false
VITE_ENABLE_STAFF_DOMAIN_ENFORCEMENT=false
VITE_ENABLE_SUDO_ADMIN=false
```

No database changes required - all schema changes are additive.
