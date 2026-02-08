
-- Add access_token column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meta_pages' AND column_name = 'access_token') THEN
        ALTER TABLE meta_pages ADD COLUMN access_token TEXT;
    END IF;
END $$;
