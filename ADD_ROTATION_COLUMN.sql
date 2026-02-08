-- ============================================================================
-- 🛠️ ADD MISSING ROTATION COLUMN
-- ============================================================================

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='last_assigned_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_assigned_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Column last_assigned_at added successfully.';
    ELSE
        RAISE NOTICE 'ℹ️ Column last_assigned_at already exists.';
    END IF;
END $$;
