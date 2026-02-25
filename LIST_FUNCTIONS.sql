SELECT 
    n.nspname as schema, 
    p.proname as name, 
    pg_get_function_identity_arguments(p.oid) as args 
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE p.proname = 'get_best_assignee_for_team';
