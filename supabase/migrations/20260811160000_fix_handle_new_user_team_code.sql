-- Fix handle_new_user(): stop forcing team_code=NULL for member signups.
--
-- Root cause of a recurring bug (3 confirmed hits: Priya Bhatiya 2026-07-07,
-- Harmandeep kaur 2026-08-08, Parampreet kaur 2026-08-11) where new paying
-- members had team_code=NULL in public.users despite the signup form
-- correctly sending the right team_code in raw_user_meta_data. With
-- team_code=NULL, a member is invisible to every team-based lead-routing
-- check (get_best_assignee_for_team RPC, process-backlog, sheet-lead-intake),
-- so they silently under-received leads until someone noticed and manually
-- patched their row.
--
-- The old function had an explicit block forcing team_code=NULL whenever
-- role='member' (the default for all normal signups) — i.e. this was
-- guaranteed for every single new member, not a rare glitch. The actual
-- lead-routing code filters on users.team_code directly, never via a
-- manager_id join, so the override was never actually consumed correctly
-- anywhere downstream.
--
-- Fix: team_code is now taken directly from signup metadata for both
-- member and manager roles, same as manager_id already was. Nothing else
-- in the function changes.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_manager_id uuid;
  v_team_code text;
BEGIN
  -- Extract metadata
  v_team_code := NEW.raw_user_meta_data->>'team_code';
  v_manager_id := CASE
    WHEN NEW.raw_user_meta_data->>'manager_id' IS NOT NULL
    THEN (NEW.raw_user_meta_data->>'manager_id')::uuid
    ELSE NULL
  END;

  -- team_code now always taken directly from signup metadata for both
  -- members and managers (2026-08-11 fix — the old "member => force NULL"
  -- override caused every new member signup to have team_code=NULL,
  -- making them invisible to team-based lead routing until manually fixed).

  INSERT INTO public.users (
    id, email, name, role, team_code, manager_id,
    payment_status, plan_name, plan_weight, daily_limit,
    leads_today, total_leads_received, filters, is_active,
    days_extended, total_leads_promised, created_at, updated_at,
    sheet_url, valid_until
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    v_team_code,
    v_manager_id,
    'inactive', 'none', 1, 0, 0, 0,
    '{"pan_india": true}'::jsonb, false, 0, 0,
    NOW(), NOW(), '', NULL
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Trigger error: %', SQLERRM;
  RETURN NEW;
END;
$function$;
