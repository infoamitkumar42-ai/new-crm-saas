-- =====================================================
-- ADD PLAN ACTIVATION DELAY COLUMNS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add new columns for delayed plan activation
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_activation_time TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_plan_pending BOOLEAN DEFAULT false;

-- Set existing active users as NOT pending (they are already active)
UPDATE users 
SET is_plan_pending = false 
WHERE plan_name IS NOT NULL AND plan_name != 'none';

-- Verify columns added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan_activation_time', 'is_plan_pending');
