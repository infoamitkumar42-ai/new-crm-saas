-- B1: ALL active users — counter vs actual leads mismatch
SELECT 
  u.email,
  u.plan_name,
  u.total_leads_received AS counter_value,
  u.total_leads_promised AS promised_value,
  COUNT(l.id) AS actual_leads_rows_in_db,
  (u.total_leads_received - COUNT(l.id)) AS counter_vs_actual_mismatch,
  u.daily_limit,
  u.is_active
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.is_active = true
  AND u.payment_status = 'active'
GROUP BY u.id, u.email, u.plan_name, u.total_leads_received,
         u.total_leads_promised, u.daily_limit, u.is_active
ORDER BY counter_vs_actual_mismatch DESC;

-- B2: Payment count per user vs expected promised
SELECT 
  u.email,
  u.plan_name,
  u.total_leads_promised,
  COUNT(p.id) AS total_payments,
  SUM(p.amount) AS total_paid,
  u.total_leads_promised / NULLIF(COUNT(p.id), 0) AS promised_per_payment
FROM users u
LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'captured'
WHERE u.is_active = true
  AND u.payment_status = 'active'
GROUP BY u.id, u.email, u.plan_name, u.total_leads_promised
ORDER BY u.plan_name, total_payments DESC;

-- B3: Full payment history for ALL active users
SELECT 
  u.email,
  u.plan_name AS current_plan,
  p.plan_name AS payment_plan,
  p.amount,
  p.status,
  p.created_at
FROM payments p
JOIN users u ON u.id = p.user_id
WHERE u.is_active = true
  AND u.payment_status = 'active'
ORDER BY u.email, p.created_at;

-- B4: Plan-wise summary of mismatches
SELECT 
  u.plan_name,
  COUNT(u.id) AS users,
  AVG(u.total_leads_promised) AS avg_promised,
  MIN(u.total_leads_promised) AS min_promised,
  MAX(u.total_leads_promised) AS max_promised,
  AVG(u.total_leads_received) AS avg_received,
  SUM(
    CASE WHEN u.total_leads_received > u.total_leads_promised 
    THEN 1 ELSE 0 END
  ) AS users_over_quota
FROM users u
WHERE u.is_active = true
  AND u.payment_status = 'active'
GROUP BY u.plan_name
ORDER BY u.plan_name;

-- B5: Users who SHOULD be expired but are still active
SELECT 
  u.email,
  u.plan_name,
  u.total_leads_promised,
  u.total_leads_received,
  u.is_active,
  u.payment_status
FROM users u
WHERE u.is_active = true
  AND u.payment_status = 'active'
  AND u.total_leads_received >= u.total_leads_promised
  AND u.total_leads_promised > 0;

-- B6: Latest payment date vs leads received since that date
WITH latest_payment AS (
  SELECT 
    p.user_id,
    MAX(p.created_at) AS last_payment_date
  FROM payments p
  WHERE p.status = 'captured'
  GROUP BY p.user_id
)
SELECT 
  u.email,
  u.plan_name,
  u.total_leads_promised,
  u.total_leads_received AS all_time_counter,
  lp.last_payment_date,
  COUNT(l.id) AS leads_since_last_payment,
  (u.total_leads_received - COUNT(l.id)) AS pre_payment_leads
FROM users u
JOIN latest_payment lp ON lp.user_id = u.id
LEFT JOIN leads l ON l.assigned_to = u.id
  AND l.created_at >= lp.last_payment_date
WHERE u.is_active = true
  AND u.payment_status = 'active'
GROUP BY u.id, u.email, u.plan_name, u.total_leads_promised,
         u.total_leads_received, lp.last_payment_date
ORDER BY u.plan_name, pre_payment_leads DESC;
