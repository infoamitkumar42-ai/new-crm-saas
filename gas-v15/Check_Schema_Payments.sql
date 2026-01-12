-- CHECKING SCHEMA FOR PAYMENT COLUMNS

-- 1. Check users table for payment related columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name ILIKE '%pay%';

-- 2. Check for any transaction or subscription tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name ILIKE '%pay%' OR table_name ILIKE '%trans%' OR table_name ILIKE '%sub%');

-- 3. If transactions table exists, check its columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions' OR table_name = 'payments';
