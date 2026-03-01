-- ============================================================================
-- DASHBOARD PERFORMANCE OPTIMIZATION (INDEXES)
-- ============================================================================

-- 🚀 Speed up leads fetching for members (MemberDashboard)
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON leads(created_at DESC);

-- 🚀 Speed up manager/profile lookups
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- 🚀 Optimize status lookups
CREATE INDEX IF NOT EXISTS idx_leads_status_assigned ON leads(status, assigned_to);

-- 🔍 Verification Query: Run this to see index performance
-- EXPLAIN ANALYZE SELECT * FROM leads WHERE (user_id = 'your-id' OR assigned_to = 'your-id') ORDER BY created_at DESC LIMIT 50;
