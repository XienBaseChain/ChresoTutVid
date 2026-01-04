# Chreso University Tutorial Repository
## Comprehensive 360-Degree Security & Architecture Audit

**Audit Date:** December 19, 2025  
**Auditor Role:** Senior Full-Stack Architect & Security Engineer  
**Project Status:** Prototype → Production Readiness Assessment

---

# Critical Findings Summary

| Priority | Area | Finding | Risk Level |
|----------|------|---------|------------|
| 🔴 P0 | Security | Client-side RBAC bypass via localStorage tampering | **CRITICAL** |
| 🔴 P0 | Security | No password/MFA verification - ID-only auth | **CRITICAL** |
| 🔴 P0 | Data | Singleton DB class causes race conditions | **HIGH** |
| 🟠 P1 | Auth | Session stored as plain JSON without signature | HIGH |
| 🟠 P1 | Routing | No deep-linking support; state-based router limits SEO | MEDIUM |
| 🟡 P2 | UI/UX | Missing ARIA labels on modal & interactive elements | MEDIUM |
| 🟡 P2 | Code | Repeated button/input patterns need component abstraction | LOW |

---

# 1. Security & Auth Logic Analysis

## 1.1 RBAC Implementation Review

### Current Implementation (database.ts, Lines 89-92)

```typescript
getTutorials(role: Role): Tutorial[] {
  if (role === Role.ADMIN) return this.tutorials;
  return this.tutorials.filter(t => t.targetRole === role);
}
```

### ⚠️ CRITICAL FLAW: Client-Side Trust Model

The RBAC enforcement happens entirely in the browser. A malicious student can:

1. Open DevTools → Application → LocalStorage
2. Modify `chreso_session`:
```json
{"user":{"id":"s1","role":"ADMIN"},"role":"ADMIN","isAuthenticated":true}
```
3. Refresh the page → Full Admin access granted

### Bypass Scenario Proof:
```javascript
// Browser Console Attack
localStorage.setItem('chreso_session', JSON.stringify({
  user: { id: 'attacker', idNumber: 'STD001', role: 'ADMIN', name: 'Attacker', isActive: true },
  role: 'ADMIN',
  isAuthenticated: true
}));
location.reload(); // Now has Admin Panel access
```

### Current Auth Flow Issues

| Issue | Location | Impact |
|-------|----------|--------|
| No password verification | LandingPage.tsx:22 | Anyone with an ID can login |
| No email OTP for admin | AdminLogin.tsx:28 | Domain check is trivially bypassed |
| Demo bypass hardcoded | AdminLogin.tsx:38-42 | **Must remove for production** |
| Session tampering | App.tsx:23-37 | No signature verification |

## 1.2 JWT/SSO Migration Strategy

### Recommended Auth Flow:

```
User → Frontend → Auth API (Supabase) → Verify password hash
                                      → Generate JWT + Refresh Token
                                      → Return tokens
         Frontend ← Store in httpOnly cookie
         Frontend → API call + Authorization header
                    Database → Verify JWT signature + claims
                            → Return Role-filtered data (RLS)
```

### Recommended Auth Stack:

| Component | Solution | Rationale |
|-----------|----------|-----------|
| Identity Provider | Supabase Auth / Auth0 | Built-in JWT, MFA, SSO support |
| Session Storage | httpOnly Secure cookies | Prevents XSS token theft |
| RBAC | Supabase Row Level Security | Server-enforced, not client-side |
| Admin SSO | SAML 2.0 via university IdP | Integrates with existing AD |

---

# 2. State Management & Routing

## 2.1 Current State-Based Router Analysis

### Pattern (App.tsx:69-88):

```typescript
const [currentView, setCurrentView] = useState<AppView>('landing');

const renderView = () => {
  if (!auth.isAuthenticated) {
    if (currentView === 'admin-login') return <AdminLogin />;
    return <LandingPage />;
  }
  // Role-based rendering...
};
```

| Aspect | Current State | Production Impact |
|--------|---------------|-------------------|
| **Deep Linking** | ❌ Not supported | Users can't bookmark `/admin/tutorials/123` |
| **Browser History** | ❌ No integration | Back button doesn't work as expected |
| **SEO** | ❌ Single URL for all views | Search engines can't index content |
| **Code Splitting** | ❌ All views bundled | Larger initial bundle size |

## 2.2 Scalability Assessment

**Current Approach Works For:**
- ✅ Embedded iframe deployments (avoids frame navigation)
- ✅ Simple 4-view applications
- ✅ Prototype/demo purposes

**Breaking Points:**
- ❌ 10+ routes → `renderView()` becomes unmanageable
- ❌ Nested routes (e.g., `/admin/users/:id/edit`)
- ❌ Route guards with async permission checks

## 2.3 Recommended Migration: React Router v6

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login/:role" element={<LoginForm />} />
  <Route path="/admin/*" element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <Routes>
          <Route path="tutorials" element={<TutorialManager />} />
          <Route path="users" element={<UserManager />} />
          <Route path="logs" element={<AuditLogs />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  } />
  <Route path="/dashboard" element={
    <ProtectedRoute requiredRole={["STAFF", "STUDENT"]}>
      <Dashboards />
    </ProtectedRoute>
  } />
</Routes>
```

---

# 3. Data Persistence Analysis

## 3.1 LocalStorage Implementation Review

### Current Architecture (database.ts:42-68):

```typescript
class UniversityDB {
  private users: UniversityUser[] = [...MOCK_USERS];
  // Singleton mutating in-memory arrays
  
  private saveToStorage() {
    localStorage.setItem('chreso_db_users', JSON.stringify(this.users));
    // Full overwrite on every change
  }
}

export const db = new UniversityDB(); // Singleton
```

## 3.2 Race Condition Scenarios

### ⚠️ Multi-Tab Data Corruption

| Scenario | Steps | Result |
|----------|-------|--------|
| Dual Admin Edits | Tab A: Add user → Tab B: Delete tutorial → Both save | Last write wins, one operation lost |
| Stale Read | Tab A reads users → Tab B adds user → Tab A saves | Tab B's user deleted |
| Log Overflow | Rapid actions fill logs → concurrent cleanup | Log entries duplicated or missing |

### Proof of Concept:

```javascript
// Tab A
db.addUser({ idNumber: 'NEW001', role: 'STUDENT', name: 'Test', isActive: true }, 'admin');

// Tab B (before Tab A's write completes)
db.deleteUser('STD001', 'admin');

// Result: Either NEW001 never exists OR STD001 resurrection
```

## 3.3 Production-Ready Alternative: Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

// Optimistic updates with server reconciliation
const { data, error } = await supabase
  .from('users')
  .insert({ id_number: 'NEW001', role: 'STUDENT' })
  .select()
  .single();

// Realtime subscription for cross-tab sync
supabase
  .channel('users')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, 
    payload => updateLocalState(payload))
  .subscribe();
```

---

# 4. UI/UX & Accessibility Audit

## 4.1 Mobile Responsiveness Review

| Component | Issue | Fix |
|-----------|-------|-----|
| AdminPanel.tsx:116 | Fixed 64px sidebar on mobile | Add responsive `hidden md:block` + hamburger menu |
| AdminPanel.tsx:170 | `pl-64` hardcoded | Use `md:pl-64 pl-0` for mobile |
| Dashboards.tsx:40 | Title hidden on mobile | Already has `hidden md:block` ✅ |
| Dashboards.tsx:64 | Dynamic Tailwind classes | `bg-${themeColor}-600` won't work in production build |

### ⚠️ IMPORTANT: Tailwind Purge Issue

Dynamic class names like `bg-${themeColor}-600` are **stripped during production builds** because Tailwind's JIT compiler only includes classes it can statically analyze.

**Fix:**
```typescript
// Instead of dynamic interpolation
const bannerClasses = role === Role.STAFF 
  ? 'bg-blue-600 shadow-blue-100' 
  : 'bg-emerald-600 shadow-emerald-100';
```

## 4.2 ARIA Compliance Issues

| Component | Element | Missing | Required |
|-----------|---------|---------|----------|
| Dashboards.tsx:180-198 | Video Modal | `role="dialog"`, `aria-modal`, `aria-labelledby` | WCAG 2.1 AA |
| AdminPanel.tsx:377-446 | Add Tutorial Modal | Same as above | WCAG 2.1 AA |
| AdminPanel.tsx:305-312 | ID Number Input | `aria-describedby` for format hint | Best practice |
| All forms | Submit buttons | Loading state `aria-busy="true"` | Assistive tech |

### Example Fix:

```tsx
// Accessible Modal Pattern
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="fixed inset-0 z-[100]..."
>
  <h4 id="modal-title">New Tutorial Entry</h4>
  {/* Focus trap implementation needed */}
</div>
```

## 4.3 Branding Consistency

| Observation | Location | Recommendation |
|-------------|----------|----------------|
| Logo color inconsistent | Blue-900 vs Slate-900 | Standardize to `#1E3A5F` (Chreso brand) |
| Font weights excessive | `font-black` everywhere | Reserve for headings only |
| Missing favicon | index.html | Add Chreso logo favicon |

---

# 5. Code Quality Analysis

## 5.1 Code Smells Identified

### Smell 1: God Component

AdminPanel.tsx (453 lines) handles:
- 3 different tab views
- Tutorial CRUD
- User management
- Audit log display
- Modal state
- CSV export

**Recommendation:** Split into:
```
views/admin/
├── AdminLayout.tsx       # Sidebar + routing
├── TutorialManager.tsx   # Content tab
├── UserRegistry.tsx      # Users tab
└── AuditLogs.tsx         # Logs tab
```

### Smell 2: Repeated UI Patterns

**Input Pattern** (appears 8+ times):
```tsx
<input 
  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
             outline-none focus:border-slate-900 transition-all font-bold text-sm"
/>
```

**Button Pattern** (appears 12+ times):
```tsx
<button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white 
                   rounded-xl font-bold flex items-center gap-2 shadow-lg 
                   shadow-blue-100 transition-all">
```

## 5.2 Design System Proposal

```typescript
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => (
  <div>
    {label && (
      <label className="block text-[10px] font-black text-slate-400 
                        uppercase tracking-widest mb-1.5">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none 
                  transition-all font-bold text-sm
                  ${error ? 'border-red-300' : 'border-slate-200 focus:border-slate-900'}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
```

## 5.3 Additional Code Issues

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Unused import | AdminPanel.tsx | 13 | Remove `FileUp` |
| Unused import | AdminPanel.tsx | 14 | Remove `Search` |
| Magic string | database.ts | 97 | Use `crypto.randomUUID()` |
| `confirm()` dialog | AdminPanel.tsx | 75, 94 | Replace with custom modal |
| Missing error boundary | App.tsx | — | Add React Error Boundary |

---

# 6. Production Migration Roadmap

## Step 1: Security Hardening (Week 1-2)

### Supabase Project Setup
```bash
npm install -g supabase
supabase init
supabase migration new initial_schema
```

### Database Schema
```sql
-- migrations/001_initial_schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_number TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STAFF', 'STUDENT', 'ADMIN')),
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  portal_link TEXT,
  elearning_link TEXT,
  target_role TEXT NOT NULL CHECK (target_role IN ('STAFF', 'STUDENT')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see role-appropriate tutorials" ON tutorials
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'ADMIN' 
    OR target_role = auth.jwt() ->> 'role'
  );

CREATE POLICY "Only admins modify tutorials" ON tutorials
  FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
```

---

## Step 2: Frontend Modernization (Week 2-3)

### Project Structure Migration
```
src/
├── components/
│   ├── ui/           # Design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   ├── layout/
│   │   ├── AdminSidebar.tsx
│   │   └── DashboardHeader.tsx
│   └── features/
│       ├── tutorials/
│       └── users/
├── hooks/
│   ├── useAuth.ts
│   ├── useTutorials.ts
│   └── useUsers.ts
├── pages/
│   ├── index.tsx
│   ├── login/
│   ├── admin/
│   └── dashboard/
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

## Step 3: Deployment & Monitoring (Week 3-4)

### Vercel Deployment
```bash
npm i -g vercel
vercel --prod
```

### Environment Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...  # Server-side only
```

### Monitoring Setup

| Tool | Purpose | Priority |
|------|---------|----------|
| Vercel Analytics | Performance metrics | P0 |
| Sentry | Error tracking | P0 |
| Supabase Dashboard | DB monitoring | P1 |
| PostHog | User analytics | P2 |

---

## Production Checklist

- [ ] Remove "Quick Access (Demo)" button from AdminLogin.tsx
- [ ] Enable Supabase RLS on all tables
- [ ] Configure CORS for production domain only
- [ ] Set up rate limiting on auth endpoints
- [ ] Enable Supabase audit logging
- [ ] Configure CSP headers in Vercel
- [ ] Set up automated database backups
- [ ] Create staging environment for testing
- [ ] Document API endpoints
- [ ] Write runbook for incident response

---

# Summary

This audit identified **critical security vulnerabilities** in the current prototype that must be addressed before any production deployment. The primary concerns are:

1. **Client-side RBAC** that can be bypassed via localStorage manipulation
2. **No authentication verification** beyond ID matching
3. **Race conditions** in the localStorage persistence layer

The recommended 3-step migration path provides a clear timeline for transitioning to a production-ready stack using **Supabase** for auth/database and **Vercel** for hosting, with proper security controls at every layer.

---

**Prepared by:** Senior Full-Stack Architect & Security Engineer  
**Audit Date:** December 19, 2025  
**Classification:** Internal - For Technical Review
