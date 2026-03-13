-- ============================================================================
-- STEP 1: VERIFY — Active Users + Lead Counts (Aaj ke)
-- Pehle yeh run karo, phir ASSIGN_14_LEADS_EQUAL.sql
-- ============================================================================

SELECT
  u.id,
  u.name,
  u.email,
  u.leads_today,
  u.daily_limit,
  u.is_active,
  u.payment_status,
  COUNT(l.id) AS actual_leads_today
FROM users u
LEFT JOIN leads l
  ON l.assigned_to = u.id
  AND l.created_at >= CURRENT_DATE
WHERE u.is_active = true
  AND u.payment_status = 'active'
  AND u.role = 'member'
GROUP BY u.id, u.name, u.email, u.leads_today, u.daily_limit, u.is_active, u.payment_status
ORDER BY actual_leads_today ASC;
