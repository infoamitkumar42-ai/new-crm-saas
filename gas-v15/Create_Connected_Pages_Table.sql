-- ============================================================================
-- 🔗 FIX: Drop and Recreate Connected Pages Table
-- ============================================================================

-- Drop existing table (if exists)
DROP TABLE IF EXISTS connected_pages;

-- Create fresh table
CREATE TABLE connected_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT NOT NULL UNIQUE,
    page_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMP,
    manager_id UUID,
    manager_name TEXT,
    manager_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_connected_pages_page_id ON connected_pages(page_id);

-- Insert Himanshu's page
INSERT INTO connected_pages (page_id, page_name, access_token, token_expires_at, manager_name, manager_email)
VALUES (
    '901700013018340',
    'Work With Himanshu Sharma',
    'EAAMp6Xu8vQ8BQZAVBuZCCaCtwCDOGrBmodiXddVGkIurJpt8HF7YQLDMRn6Lp8Mv0prPwnZCG8Qifwmoyc0hZBiOR22ZAEvIpUbShi9btNmVaUjyGW3JSPW2M9p9qbFfnZCxPTUozssDAET8t24HcUrTeBaD5jovPETTKlUAo4DnYuOSGQWAmZBmiRRlK91ZBM2VbkKGDUgO',
    '2026-03-14',
    'Himanshu Sharma',
    'admin@leadflow.com'
);

-- Verify
SELECT * FROM connected_pages;
