-- Debug why 30 leads are unassigned today (Jan 17, 2026)

-- 1. Check unassigned leads details
SELECT 
    id,
    name,
    phone,
    city,
    state,
    status,
    created_at,
    source
FROM leads 
WHERE created_at >= '2026-01-17 00:00:00'::timestamptz
  AND user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check active users who should be eligible
SELECT 
    id,
    name,
    is_active,
    plan_name,
    daily_limit,
    leads_today,
    target_state,
    target_gender,
    valid_until,
    last_activity,
    payment_status
FROM users
WHERE is_active = true
  AND plan_name != 'none'
ORDER BY leads_today ASC;

-- 3. Check if users have expired subscriptions
SELECT 
    name,
    valid_until,
    CASE 
        WHEN valid_until < NOW() THEN '❌ EXPIRED'
        ELSE '✅ ACTIVE'
    END as subscription_status
FROM users
WHERE is_active = true
  AND plan_name != 'none'
ORDER BY valid_until;

-- 4. Check last_activity for 7-day rule
SELECT 
    name,
    last_activity,
    CASE 
        WHEN last_activity IS NULL THEN '❌ NULL'
        WHEN last_activity < NOW() - INTERVAL '7 days' THEN '❌ INACTIVE 7+ DAYS'
        ELSE '✅ ACTIVE'
    END as activity_status,
    leads_today,
    daily_limit
FROM users
WHERE is_active = true
  AND plan_name != 'none'
ORDER BY last_activity DESC NULLS LAST;
