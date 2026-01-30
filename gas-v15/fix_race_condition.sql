-- 🔒 FIX RACE CONDITION & ALLOW MANUAL IMPORT
-- This trigger uses ROW LOCKING (FOR UPDATE) to prevent race conditions.
-- It forces leads to be processed one-by-one for the same user.

CREATE OR REPLACE FUNCTION check_lead_limit_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    current_leads INT;
    max_limit INT;
    user_name TEXT;
    today_start TIMESTAMP;
BEGIN
    -- ✅ 1. BYPASS LIMIT FOR MANUAL IMPORT (Unlimited)
    IF NEW.source = 'Manual Import' THEN
        RETURN NEW;
    END IF;

    -- ✅ 2. STANDARD CHECK (With Serialization)
    IF NEW.status = 'Assigned' AND NEW.assigned_to IS NOT NULL THEN
        
        -- A. LOCK THE USER ROW
        -- This forces other transactions trying to assign to THIS user to WAIT.
        -- This prevents concurrent reads of stale data.
        PERFORM 1 FROM users WHERE id = NEW.assigned_to FOR UPDATE;

        -- B. Get User Limit
        SELECT daily_limit, name 
        INTO max_limit, user_name
        FROM users 
        WHERE id = NEW.assigned_to;
        
        max_limit := COALESCE(max_limit, 0);

        -- C. REAL-TIME COUNT (From Leads Table)
        -- We count committed leads for today.
        -- Since we hold the lock on 'users', no one else can insert/commit for this user right now.
        today_start := CURRENT_DATE::timestamp;
        
        SELECT COUNT(*) INTO current_leads
        FROM leads
        WHERE user_id = NEW.assigned_to
        AND created_at >= today_start;

        -- D. THE CHECK
        IF current_leads >= max_limit THEN
            RAISE EXCEPTION '⛔ BLOCKED: User % is Full (%/%). Race Condition Prevented.', user_name, current_leads, max_limit;
        END IF;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
