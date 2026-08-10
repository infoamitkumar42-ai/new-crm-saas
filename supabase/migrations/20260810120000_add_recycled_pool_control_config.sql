-- ============================================================================
-- RECYCLED POOL CONTROL — config row + scoped RLS (2026-08-10, admin request)
--
-- Step 1 of 3. Adds ONE new system_config row plus two tightly-scoped RLS
-- policies so the admin dashboard can turn the recycled-lead pool on/off and
-- set a per-user daily cap. Inert until the assign-recycled-leads edge
-- function is updated to read it (step 2) — this migration alone changes NO
-- lead-distribution behaviour.
--
-- WHY THE POLICIES ARE NEEDED
--   system_config has RLS ENABLED but had ZERO policies, so the frontend
--   (anon/authenticated key) could not read or write it at all — only
--   service_role (edge functions) could. Without these policies an admin
--   toggle would render, accept clicks, and silently do nothing.
--
-- SCOPE IS DELIBERATELY NARROW
--   * Only config_key = 'recycled_pool_control' is readable/writable.
--     distribution_enabled, plan_fresh_config, working_hours and every other
--     row stay exactly as locked as they are today — verified no regression.
--   * is_admin() (role='admin' only, SECURITY DEFINER + hardened search_path)
--     rather than is_admin_or_manager(), so managers cannot alter lead
--     distribution behaviour.
--   * No INSERT/DELETE policy — admin can update this one row but can never
--     create or remove config rows.
--
-- NO SCHEMA CHANGE: system_config already has config_key/config_value(jsonb).
--
-- VERIFIED LIVE AFTER APPLYING (all via simulated JWT contexts):
--   admin  -> sees exactly 1 row (recycled_pool_control), other 14 invisible
--   admin  -> UPDATE on recycled_pool_control succeeds
--   admin  -> UPDATE on distribution_enabled affects 0 rows (boundary holds)
--   member -> sees 0 rows
--   service_role -> still sees all 15 rows incl. plan_fresh_config, so the
--                   recycler edge function is completely unaffected
-- ============================================================================

INSERT INTO system_config (config_key, config_value, description, is_active)
VALUES (
  'recycled_pool_control',
  '{"enabled": false, "max_per_user_per_day": 3, "allowed_team_codes": ["TEAMFIRE"]}'::jsonb,
  'Admin-controlled recycled lead pool: master switch, per-user daily cap, allowed team codes. Read by assign-recycled-leads edge function.',
  true
)
ON CONFLICT (config_key) DO NOTHING;

CREATE POLICY "Admin read recycle pool config"
  ON system_config
  FOR SELECT
  USING (config_key = 'recycled_pool_control' AND is_admin());

CREATE POLICY "Admin update recycle pool config"
  ON system_config
  FOR UPDATE
  USING (config_key = 'recycled_pool_control' AND is_admin())
  WITH CHECK (config_key = 'recycled_pool_control');
