-- ============================================================================
-- 🔔 SETUP PUSH NOTIFICATION TRIGGER (FINAL)
-- ============================================================================

-- 1. Enable HTTP Extension (Required for net.http_post)
-- CORRECTION: Supabase uses "pg_net", not "pgsql-net"
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      -- ✅ Correct Supabase URL
      url := 'https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/send-push-notification',
      
      -- ✅ Authenticated with Service Role Key
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us"}'::jsonb,
      
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger to Leads Table
DROP TRIGGER IF EXISTS on_lead_inserted_push ON public.leads;
CREATE TRIGGER on_lead_inserted_push
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_push_notification();

-- 4. Verify Trigger Status
SELECT tgname, tgenabled, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_lead_inserted_push';
