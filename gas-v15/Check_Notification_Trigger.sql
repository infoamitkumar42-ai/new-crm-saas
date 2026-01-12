-- CHECK TRIGGER
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'leads' 
AND trigger_name = 'on_lead_assigned';
