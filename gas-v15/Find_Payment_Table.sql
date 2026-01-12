-- ============================================================================
-- 🕵️‍♂️ FIND PAYMENT TABLE NAME
-- ============================================================================

SELECT table_schema, table_name 
FROM information_schema.columns 
WHERE column_name = 'razorpay_payment_id';
