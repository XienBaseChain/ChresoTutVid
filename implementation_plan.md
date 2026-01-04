# Project Ironclad: Implementation Plan
## Chreso University Tutorial Repository - Prototype to Production

**Prepared:** December 19, 2025  
**Classification:** Technical Specification for Development Team

---

## Executive Summary

This plan migrates the Chreso University Tutorial Repository from a **localStorage-based prototype** to a **production-ready application** with:

- **Supabase Auth** replacing client-side RBAC (Critical Security Fix)
- **React Router v6** replacing state-based routing  
- **Component architecture** replacing god components

> ⚠️ **CRITICAL:** The current app has P0 security vulnerabilities. Client-side auth can be bypassed via browser DevTools. This refactor eliminates all client-side trust.

---

## Phase 1: Security Foundation (Week 1)

### 1.1 Supabase Database Schema

Create the following in Supabase SQL Editor:

```sql
-- ============================================
-- CHRESO UNIVERSITY - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_number TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STAFF', 'STUDENT', 'ADMIN')),
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tutorials table
CREATE TABLE public.tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  portal_link TEXT,
  elearning_link TEXT,
  target_role TEXT NOT NULL CHECK (target_role IN ('STAFF', 'STUDENT')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users: Only admins can view all users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Tutorials: Role-based viewing
CREATE POLICY "Users see role-appropriate tutorials" ON public.tutorials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND (role = 'ADMIN' OR role = target_role)
    )
  );

CREATE POLICY "Only admins can manage tutorials" ON public.tutorials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Only admins can update tutorials" ON public.tutorials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Only admins can delete tutorials" ON public.tutorials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Audit Logs: Only admins can view
CREATE POLICY "Only admins can view logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "System can insert logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to log actions
CREATE OR REPLACE FUNCTION public.log_action(
  p_action TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  SELECT role INTO v_user_role FROM public.users WHERE id = auth.uid();
  
  INSERT INTO public.audit_logs (user_id, user_role, action, details)
  VALUES (auth.uid(), COALESCE(v_user_role, 'UNKNOWN'), p_action, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.2 New Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-router-dom": "^6.21.0"
  }
}
```

### 1.3 Environment Configuration

Update `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Phase 2: New File Structure

```
Chresotutrepo/
├── supabase/
│   └── schema.sql              # [NEW] Database schema
├── src/
│   ├── lib/
│   │   └── supabase.ts         # [NEW] Supabase client
│   ├── hooks/
│   │   └── useAuth.ts          # [NEW] Auth hook
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx      # [NEW] Reusable button
│   │   │   ├── Input.tsx       # [NEW] Reusable input
│   │   │   └── Modal.tsx       # [NEW] Accessible modal
│   │   ├── layout/
│   │   │   └── AdminLayout.tsx # [NEW] Admin shell
│   │   └── ProtectedRoute.tsx  # [NEW] Route guard
│   ├── views/
│   │   ├── admin/
│   │   │   ├── TutorialManager.tsx  # [NEW] From AdminPanel
│   │   │   ├── UserManager.tsx      # [NEW] From AdminPanel
│   │   │   └── AuditLogViewer.tsx   # [NEW] From AdminPanel
│   │   ├── LandingPage.tsx     # [MODIFY]
│   │   ├── LoginPage.tsx       # [NEW] Unified login
│   │   └── Dashboard.tsx       # [MODIFY]
│   ├── types.ts                # [MODIFY]
│   ├── App.tsx                 # [MODIFY] Router setup
│   └── index.tsx
└── package.json                # [MODIFY]
```

### Files to DELETE:
- `database.ts` - Replaced by Supabase
- `views/AdminPanel.tsx` - Split into smaller components
- `views/AdminLogin.tsx` - Merged into LoginPage

---

## Phase 3: Component Specifications

### 3.1 ProtectedRoute Component

```typescript
// src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'STAFF' | 'STUDENT')[];
  children?: React.ReactNode;
}

// Functionality:
// - Check if user session exists (from Supabase)
// - Validate user role against allowedRoles
// - Redirect to /login if unauthenticated
// - Redirect to /dashboard if wrong role
// - Render children or <Outlet /> if authorized
```

### 3.2 Route Structure

```typescript
// App.tsx routes
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  
  {/* Protected: Any authenticated user */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
  
  {/* Protected: Admin only */}
  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="tutorials" replace />} />
      <Route path="tutorials" element={<TutorialManager />} />
      <Route path="users" element={<UserManager />} />
      <Route path="logs" element={<AuditLogViewer />} />
    </Route>
  </Route>
  
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 3.3 UI Component Library

| Component | Variants | Props |
|-----------|----------|-------|
| `Button` | primary, secondary, danger, ghost | `variant`, `size`, `isLoading`, `leftIcon`, `disabled` |
| `Input` | default, error | `label`, `error`, `helperText`, all native input props |
| `Modal` | - | `isOpen`, `onClose`, `title`, `children`, `size` |

### 3.4 Tailwind Fix

Replace all dynamic class interpolation:

```typescript
// ❌ BROKEN (classes get purged in production)
className={`bg-${themeColor}-600`}

// ✅ FIXED (static strings preserved)
className={role === 'STAFF' ? 'bg-blue-600' : 'bg-emerald-600'}
```

---

## Phase 4: Testing Checklist

### Security Tests

| Test | Steps | Expected |
|------|-------|----------|
| Unauthenticated Block | Visit `/admin` without login | Redirected to `/login` |
| Role Enforcement | Login as STUDENT, visit `/admin` | Access denied, redirected |
| Session Tampering | Modify localStorage, refresh | Session invalid, logged out |
| RLS Enforcement | Login as STUDENT, check tutorials | Only STUDENT tutorials visible |

### Functional Tests

| Test | Steps | Expected |
|------|-------|----------|
| Admin CRUD | Add/edit/delete tutorial as Admin | Changes persist across refresh |
| Deep Linking | Navigate directly to `/admin/users` | Page renders correctly |
| Back Button | Click back in admin section | Navigates to previous admin page |
| Logout | Click logout from any page | Redirected to landing, session cleared |

### Accessibility Tests

| Test | Steps | Expected |
|------|-------|----------|
| Modal Focus | Open modal, tab through | Focus trapped in modal |
| Modal Escape | Press Escape in modal | Modal closes |
| Screen Reader | Navigate with VoiceOver/NVDA | All elements announced correctly |

### Mobile Tests

| Test | Steps | Expected |
|------|-------|----------|
| Responsive Layout | View at 375px width | No horizontal scroll |
| Admin Sidebar | View admin at 375px | Sidebar hidden, hamburger menu |
| Touch Targets | Tap buttons on mobile | All buttons ≥44px touch target |

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1 | 2-3 days | Supabase schema, client config, auth hooks |
| 2 | 1-2 days | React Router setup, ProtectedRoute, App.tsx |
| 3 | 2-3 days | UI components, AdminLayout, split views |
| 4 | 1-2 days | Testing, bug fixes, deployment prep |

**Total Estimated:** 6-10 days

---

## Dependencies & Prerequisites

Before starting development:

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note the project URL and anon key

2. **Run Database Migrations**
   - Open Supabase SQL Editor
   - Execute the schema SQL from Phase 1.1

3. **Create Initial Admin User**
   - Use Supabase Auth to create first user
   - Manually insert into `users` table with `role = 'ADMIN'`

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase downtime | Implement offline detection, show maintenance message |
| Migration data loss | Export current localStorage data before migration |
| Auth token expiry | Handle refresh token rotation, auto-logout on failure |
| Breaking changes | Feature flag new auth, keep old code until verified |

---

**Document prepared by:** Senior Full-Stack Architect  
**For:** Development Team  
**Status:** Ready for Review
