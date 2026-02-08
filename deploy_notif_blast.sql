
-- Create a function to batch insert notifications
CREATE OR REPLACE FUNCTION send_notification_blast(payload JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        INSERT INTO notifications (user_id, title, message, type, created_at)
        VALUES (
            (item->>'user_id')::UUID,
            item->>'title',
            item->>'message',
            item->>'type',
            NOW()
        );
    END LOOP;
END;
$$;
