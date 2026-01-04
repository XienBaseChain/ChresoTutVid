-- ============================================
-- AUTH UPGRADE MIGRATION (v2)
-- ADDITIVE ONLY - DO NOT DROP/RENAME EXISTING COLUMNS
-- ============================================
-- 
-- MIGRATION INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query and paste this entire file
-- 3. Run the query to apply the migration
-- 
-- ROLLBACK INSTRUCTIONS:
-- - These changes are additive and backward compatible
-- - No rollback required - legacy data continues to work
-- - To disable new features, use feature flags in .env.local
--
-- ============================================

-- Add email_verified column (nullable, defaults to null = legacy)
-- Legacy users will have NULL, new users will have true/false
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT NULL;

-- Add auth_provider column (nullable, defaults to 'legacy')
-- Tracks how the user authenticates: legacy, magic_link, or password
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'legacy' 
CHECK (auth_provider IS NULL OR auth_provider IN ('legacy', 'magic_link', 'password'));

-- ============================================
-- UPDATE ROLE CONSTRAINT (ADDITIVE)
-- ============================================
-- First, drop the existing constraint if it exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Recreate with SUDO role added
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('STAFF', 'STUDENT', 'ADMIN', 'SUDO'));

-- ============================================
-- INDEXES FOR NEW COLUMNS
-- ============================================

-- Index for email verification lookups (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON public.users(email_verified) WHERE email_verified = false;

-- Index for auth provider filtering
CREATE INDEX IF NOT EXISTS idx_users_auth_provider 
ON public.users(auth_provider);

-- ============================================
-- SUDO ADMIN RLS POLICIES
-- ============================================

-- SUDO can read all users (including other SUDOs/ADMINs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'sudo_read_all_users'
    ) THEN
        CREATE POLICY "sudo_read_all_users" 
          ON public.users 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
          );
    END IF;
END $$;

-- SUDO can insert new users (including ADMIN accounts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'sudo_insert_users'
    ) THEN
        CREATE POLICY "sudo_insert_users" 
          ON public.users 
          FOR INSERT 
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
          );
    END IF;
END $$;

-- SUDO can update all users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'sudo_update_users'
    ) THEN
        CREATE POLICY "sudo_update_users" 
          ON public.users 
          FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
          );
    END IF;
END $$;

-- SUDO can delete users (except themselves)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'sudo_delete_users'
    ) THEN
        CREATE POLICY "sudo_delete_users" 
          ON public.users 
          FOR DELETE 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
            AND id != auth.uid() -- Cannot delete yourself
          );
    END IF;
END $$;

-- SUDO can read all audit logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'audit_logs' 
        AND policyname = 'sudo_read_all_logs'
    ) THEN
        CREATE POLICY "sudo_read_all_logs" 
          ON public.audit_logs 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
          );
    END IF;
END $$;

-- SUDO can read all tutorials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tutorials' 
        AND policyname = 'sudo_read_all_tutorials'
    ) THEN
        CREATE POLICY "sudo_read_all_tutorials" 
          ON public.tutorials 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
          );
    END IF;
END $$;

-- SUDO can manage all tutorials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tutorials' 
        AND policyname = 'sudo_manage_tutorials'
    ) THEN
        CREATE POLICY "sudo_manage_tutorials" 
          ON public.tutorials 
          FOR ALL 
          USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE id = auth.uid() AND role = 'SUDO'
            )
          );
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify:
--
-- Check new columns exist:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name IN ('email_verified', 'auth_provider');
--
-- Check role constraint:
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'users_role_check';
--
-- Check SUDO policies:
-- SELECT policyname FROM pg_policies 
-- WHERE schemaname = 'public' AND policyname LIKE 'sudo%';
