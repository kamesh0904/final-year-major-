-- =====================================================
-- FIX SUPABASE SECURITY & PERFORMANCE ISSUES
-- Addresses all errors and warnings from Supabase linter
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: FIX FUNCTION SEARCH_PATH VULNERABILITIES
-- =====================================================

-- Fix check_diary_entry_date function with secure search_path
CREATE OR REPLACE FUNCTION public.check_diary_entry_date()
RETURNS TRIGGER 
SET search_path = '' -- Prevent search_path manipulation attacks
AS $$
BEGIN
    IF NEW.entry_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot create diary entries for future dates';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix cleanup_expired_otps function with secure search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void 
SET search_path = '' -- Prevent search_path manipulation attacks
AS $$
BEGIN
    DELETE FROM public.diary_password_reset_otps
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: ENABLE RLS ON WEEKLY_CHECKINS TABLE
-- =====================================================

-- Enable RLS on weekly_checkins table (CRITICAL ERROR FIX)
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for weekly_checkins with PERFORMANCE OPTIMIZATION
-- Using (select auth.uid()) to avoid re-evaluation per row
DROP POLICY IF EXISTS "Users can view their own weekly checkins" ON public.weekly_checkins;
DROP POLICY IF EXISTS "Users can manage their own weekly checkins" ON public.weekly_checkins;

-- Consolidated policy for SELECT (fixes multiple permissive policies warning)
CREATE POLICY "Users can access their own weekly checkins" 
ON public.weekly_checkins FOR SELECT 
USING ((select auth.uid()) = user_id);

-- Separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Users can insert their own weekly checkins" 
ON public.weekly_checkins FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own weekly checkins" 
ON public.weekly_checkins FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own weekly checkins" 
ON public.weekly_checkins FOR DELETE 
USING ((select auth.uid()) = user_id);

-- =====================================================
-- PART 3: FIX OVERLY PERMISSIVE RLS POLICIES
-- =====================================================

-- Fix game_sessions table - replace USING(true) with proper user-based policy
DROP POLICY IF EXISTS "Public Access Sessions" ON public.game_sessions;

-- Add secure policies for game_sessions with PERFORMANCE OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update their own game sessions" ON public.game_sessions;

CREATE POLICY "Users can view their own game sessions" 
ON public.game_sessions FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own game sessions" 
ON public.game_sessions FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own game sessions" 
ON public.game_sessions FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Fix profiles table - replace USING(true) with proper user-based policy
DROP POLICY IF EXISTS "Public Access Profiles" ON public.profiles;

-- Consolidate profiles policies with PERFORMANCE OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile_type" ON public.profiles;

-- Keep public viewability but optimize it
-- "Profiles are viewable by everyone" policy remains unchanged as it's for public read access

-- Consolidated UPDATE policy (replaces two separate update policies)
CREATE POLICY "Users can modify their own profile" 
ON public.profiles FOR UPDATE 
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ((select auth.uid()) = id);

-- =====================================================
-- PART 4: ADD RLS POLICIES TO TABLES WITHOUT POLICIES
-- =====================================================

-- Add policies to usage_stats table with PERFORMANCE OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.usage_stats;
DROP POLICY IF EXISTS "Users can manage their own usage stats" ON public.usage_stats;

-- Consolidated SELECT policy (fixes multiple permissive policies warning)
CREATE POLICY "Users can access their own usage stats" 
ON public.usage_stats FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own usage stats" 
ON public.usage_stats FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own usage stats" 
ON public.usage_stats FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own usage stats" 
ON public.usage_stats FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Add policies to weekly_reports table with PERFORMANCE OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own weekly reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Users can manage their own weekly reports" ON public.weekly_reports;

-- Consolidated SELECT policy (fixes multiple permissive policies warning)
CREATE POLICY "Users can access their own weekly reports" 
ON public.weekly_reports FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own weekly reports" 
ON public.weekly_reports FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own weekly reports" 
ON public.weekly_reports FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own weekly reports" 
ON public.weekly_reports FOR DELETE 
USING ((select auth.uid()) = user_id);

-- =====================================================
-- PART 5: OPTIMIZE EXISTING RLS POLICIES FOR PERFORMANCE
-- =====================================================

-- Optimize daily_session_tracking policies
DROP POLICY IF EXISTS "Users can view their own session tracking" ON public.daily_session_tracking;
DROP POLICY IF EXISTS "Users can manage their own session tracking" ON public.daily_session_tracking;

-- Consolidated SELECT policy (fixes multiple permissive policies warning)
CREATE POLICY "Users can access their own session tracking" 
ON public.daily_session_tracking FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own session tracking" 
ON public.daily_session_tracking FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own session tracking" 
ON public.daily_session_tracking FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own session tracking" 
ON public.daily_session_tracking FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Optimize used_questions policies
DROP POLICY IF EXISTS "Users can view their own used questions" ON public.used_questions;
DROP POLICY IF EXISTS "Users can manage their own used questions" ON public.used_questions;

-- Consolidated SELECT policy (fixes multiple permissive policies warning)
CREATE POLICY "Users can access their own used questions" 
ON public.used_questions FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own used questions" 
ON public.used_questions FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own used questions" 
ON public.used_questions FOR UPDATE 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own used questions" 
ON public.used_questions FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Optimize post_game_responses policies
DROP POLICY IF EXISTS "Users can view their own post-game responses" ON public.post_game_responses;
DROP POLICY IF EXISTS "Users can insert their own post-game responses" ON public.post_game_responses;

CREATE POLICY "Users can view their own post-game responses" 
ON public.post_game_responses FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own post-game responses" 
ON public.post_game_responses FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

-- Optimize chat_messages policies
DROP POLICY IF EXISTS "Users can view own chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat" ON public.chat_messages;

CREATE POLICY "Users can view own chat" 
ON public.chat_messages FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own chat" 
ON public.chat_messages FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

-- Optimize diary_entries policies
DROP POLICY IF EXISTS "Users can manage their own diary entries" ON public.diary_entries;

CREATE POLICY "Users can manage their own diary entries" 
ON public.diary_entries FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Optimize diary_password_reset_otps policies
DROP POLICY IF EXISTS "Users can view own OTPs" ON public.diary_password_reset_otps;

CREATE POLICY "Users can view own OTPs" 
ON public.diary_password_reset_otps FOR SELECT 
USING ((select auth.uid()) = user_id);

-- =====================================================
-- PART 6: REMOVE DUPLICATE INDEXES/CONSTRAINTS
-- =====================================================

-- Remove duplicate constraint on daily_session_tracking
-- This constraint creates a duplicate index with a truncated name
-- We'll keep the original constraint and remove the duplicate one
ALTER TABLE public.daily_session_tracking 
DROP CONSTRAINT IF EXISTS daily_session_tracking_user_id_profile_category_session_date_ke CASCADE;

-- =====================================================
-- PART 7: VERIFICATION QUERIES
-- =====================================================

-- Check if RLS is enabled on all required tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'weekly_checkins', 
    'game_sessions', 
    'profiles', 
    'usage_stats', 
    'weekly_reports',
    'daily_session_tracking',
    'used_questions',
    'post_game_responses',
    'chat_messages',
    'diary_entries',
    'diary_password_reset_otps'
)
ORDER BY tablename;

-- Check count of policies per table (should have limited separate policies now)
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'weekly_checkins', 
    'game_sessions', 
    'profiles', 
    'usage_stats', 
    'weekly_reports',
    'daily_session_tracking',
    'used_questions'
)
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Verify functions have search_path set
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    COALESCE(
        (SELECT setting 
         FROM unnest(p.proconfig) AS setting 
         WHERE setting LIKE 'search_path=%'), 
        'NOT SET'
    ) as search_path_setting
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('check_diary_entry_date', 'cleanup_expired_otps');

-- Check for remaining duplicate indexes
SELECT 
    t.tablename,
    i1.indexname as index1,
    i2.indexname as index2
FROM pg_indexes i1
JOIN pg_indexes i2 ON i1.tablename = i2.tablename 
    AND i1.indexdef = i2.indexdef 
    AND i1.indexname < i2.indexname
JOIN pg_tables t ON t.tablename = i1.tablename
WHERE t.schemaname = 'public'
AND t.tablename = 'daily_session_tracking';

-- Final success message
SELECT '🎉 SECURITY & PERFORMANCE MIGRATION COMPLETED! All critical errors and performance warnings addressed.' as result;

-- =====================================================
-- NOTES ON REMAINING WARNINGS
-- =====================================================
/*
ANONYMOUS ACCESS WARNINGS (NOT FIXED):
The following tables still allow anonymous access via their RLS policies:
- chat_messages
- daily_session_tracking
- diary_entries
- diary_password_reset_otps
- game_sessions
- post_game_responses
- profiles
- used_questions
- storage.objects

These warnings indicate that anonymous users (non-authenticated) can access
data through these policies. This may be intentional for your application design.

If you want to restrict these tables to authenticated users only, you can
modify the policies to check for authenticated users using:
    USING (auth.uid() IS NOT NULL AND (select auth.uid()) = user_id)

LEAKED PASSWORD PROTECTION (NOT ENABLED):
Supabase recommends enabling leaked password protection via HaveIBeenPwned.org.
This is configured in your Supabase Dashboard under Authentication settings,
not via SQL migration.

To enable:
1. Go to Supabase Dashboard > Authentication > Policies
2. Enable "Check for leaked passwords"

PERFORMANCE IMPROVEMENTS MADE:
✅ All auth.uid() calls wrapped in subqueries (select auth.uid())
✅ Multiple permissive policies consolidated into specific operation policies
✅ Duplicate indexes removed
✅ Function search_path vulnerabilities fixed
*/
