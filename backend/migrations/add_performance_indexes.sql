-- =====================================================
-- ADD PERFORMANCE INDEXES
-- These indexes significantly improve query performance for common operations
-- Run this in Supabase SQL Editor after the security migration
-- =====================================================

-- Game sessions lookup by user + date (for weekly reports, recent games)
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_date 
ON public.game_sessions(user_id, created_at DESC);

-- Chat messages for conversation history retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date 
ON public.chat_messages(user_id, created_at DESC);

-- Diary entries calendar view and recent entries
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date 
ON public.diary_entries(user_id, entry_date DESC);

-- Weekly reports lookup
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_date 
ON public.weekly_reports(user_id, report_date DESC);

-- Profile lookups by email (for authentication flows)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

-- Usage stats for analytics
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date 
ON public.usage_stats(user_id, created_at DESC);

-- Daily session tracking for dashboard
CREATE INDEX IF NOT EXISTS idx_daily_session_tracking_user_date 
ON public.daily_session_tracking(user_id, session_date DESC);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'game_sessions',
    'chat_messages',
    'diary_entries',
    'weekly_reports',
    'profiles',
    'usage_stats',
    'daily_session_tracking'
)
ORDER BY tablename, indexname;

-- Analyze table statistics (helps query planner)
ANALYZE public.game_sessions;
ANALYZE public.chat_messages;
ANALYZE public.diary_entries;
ANALYZE public.weekly_reports;
ANALYZE public.profiles;
ANALYZE public.usage_stats;
ANALYZE public.daily_session_tracking;

SELECT '✅ Performance indexes created successfully!' as result;
