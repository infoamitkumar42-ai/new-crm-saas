const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
// Note: Usually schema changes require SERVICE_ROLE key, but we'll try with what we have or just log instructions if permission fails. 
// Ideally we need the Service Role Key for DDL (ALTER TABLE), which I don't see explicitly in recent context EXCEPT in the webhook file (Deno.env.get).
// Since I cannot access Deno env here, I will output the instructions if this fails.
// WAIT! I see `service_role` key was NOT provided in the snippet user gave earlier, only ANON.
// But wait, the user's previous steps had success with UPDATE commands on users table.
// DDL (ALTER TABLE) might be restricted.

// Let's TRY to run it via a direct SQL function if it exists, or suggest user runs it in Editor.
// Actually, the most reliable way right now given the environment is to ASK THE USER to run the migration SQL in their Supabase Editor.
// But I will create a verification script to CHECK if they have done it.

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function applyMigration() {
    console.log("🛡️ APPLYING IRON DOME MIGRATION (Adding team_id)...\n");

    // We try to use RPC if available, otherwise we just warn.
    // Since we likely can't run DDL via Anon key, we will log the SQL for the user.

    console.log("⚠️ AUTOMATIC MIGRATION MIGHT FAIL WITHOUT SERVICE ROLE KEY.");
    console.log("👉 PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:\n");

    console.log(`
    -- IRON DOME MIGRATION
    BEGIN;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'TEAM_PUNJAB';
    ALTER TABLE meta_pages ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'TEAM_PUNJAB';
    UPDATE users SET team_id = 'TEAM_PUNJAB' WHERE team_id IS NULL;
    UPDATE meta_pages SET team_id = 'TEAM_PUNJAB' WHERE team_id IS NULL;
    COMMIT;
    `);

    // Verification check
    const { data, error } = await supabase.from('users').select('team_id').limit(1);

    if (error && error.message.includes('column "team_id" does not exist')) {
        console.log("\n❌ Migration NOT applied yet. Please run the SQL above.");
    } else if (data) {
        console.log("\n✅ MIGRATION SEEMS SUCCESSFUL! 'team_id' column detected.");
    } else {
        console.log("\n❓ Could not verify migration status. Error: " + (error?.message || 'Unknown'));
    }
}

applyMigration();
