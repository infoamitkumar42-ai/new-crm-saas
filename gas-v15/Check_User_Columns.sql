-- CHECK IF COLUMNS EXIST
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('target_gender', 'target_state');
