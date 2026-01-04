-- ============================================
-- CHRESO UNIVERSITY TUTORIAL REPOSITORY
-- SUPABASE DATABASE SCHEMA
-- ============================================
-- 
-- SETUP INSTRUCTIONS:
-- 1. Go to https://supabase.com and create a new project
-- 2. Wait for project to provision (2-3 minutes)
-- 3. Go to SQL Editor in the Supabase Dashboard
-- 4. Create a new query and paste this entire file
-- 5. Run the query to create all tables and policies
-- 6. Copy your project URL and anon key to .env.local
--
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (linked to Supabase Auth)
-- This extends auth.users with application-specific data
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

-- Create index for faster lookups
CREATE INDEX idx_users_id_number ON public.users(id_number);
CREATE INDEX idx_users_role ON public.users(role);

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

-- Create index for role-based queries
CREATE INDEX idx_tutorials_target_role ON public.tutorials(target_role);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for timestamp-based queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- USERS TABLE POLICIES
-- --------------------------------------------

-- Users can read their own profile
CREATE POLICY "users_read_own" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "admins_read_all_users" 
  ON public.users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can insert new users
CREATE POLICY "admins_insert_users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can update users
CREATE POLICY "admins_update_users" 
  ON public.users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can delete users
CREATE POLICY "admins_delete_users" 
  ON public.users 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- --------------------------------------------
-- TUTORIALS TABLE POLICIES
-- --------------------------------------------

-- Users can read tutorials matching their role
-- Admins can read all tutorials
CREATE POLICY "users_read_role_tutorials" 
  ON public.tutorials 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (role = 'ADMIN' OR role = target_role)
    )
  );

-- Only admins can create tutorials
CREATE POLICY "admins_insert_tutorials" 
  ON public.tutorials 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only admins can update tutorials
CREATE POLICY "admins_update_tutorials" 
  ON public.tutorials 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only admins can delete tutorials
CREATE POLICY "admins_delete_tutorials" 
  ON public.tutorials 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- --------------------------------------------
-- AUDIT LOGS TABLE POLICIES
-- --------------------------------------------

-- Only admins can read audit logs
CREATE POLICY "admins_read_logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Any authenticated user can insert logs (for their own actions)
CREATE POLICY "authenticated_insert_logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current user's role (for use in app)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Function to get current user's profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.users
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$;

-- Function to log an action (callable from app)
CREATE OR REPLACE FUNCTION public.log_action(
  p_action TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user's role
  SELECT role INTO v_user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Insert the log entry
  INSERT INTO public.audit_logs (user_id, user_role, action, details)
  VALUES (auth.uid(), COALESCE(v_user_role, 'UNKNOWN'), p_action, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================
-- AUTOMATIC TIMESTAMPS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for users table
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for tutorials table
CREATE TRIGGER tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================
-- NOTE: You must first create users via Supabase Auth,
-- then insert their records here with matching UUIDs.
-- 
-- Example (after creating auth user):
-- INSERT INTO public.users (id, id_number, role, name, email)
-- VALUES (
--   'uuid-from-auth-users-table',
--   'ADM001',
--   'ADMIN',
--   'System Administrator',
--   'admin@chresouniversity.edu.zm'
-- );
--
-- INSERT INTO public.tutorials (title, description, video_url, portal_link, elearning_link, target_role)
-- VALUES (
--   'Staff Portal: Grade Submission',
--   'A step-by-step guide on how to submit semester grades.',
--   'https://www.w3schools.com/html/mov_bbb.mp4',
--   'https://staff.chresouniversity.edu.zm',
--   'https://elearning.chresouniversity.edu.zm/staff',
--   'STAFF'
-- );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after setup to verify everything works:
--
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
--
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- Check policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
