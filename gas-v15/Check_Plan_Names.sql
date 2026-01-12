-- CHECK PLAN NAMES
SELECT DISTINCT plan_name, count(*) 
FROM users 
WHERE is_active = true 
GROUP BY 1;
