
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function unscheduleCron() {
    console.log("🛑 STOPPING 'process-backlog' CRON job...\n");

    // 1. Unschedule (Stop future runs)
    const { data, error } = await supabase.rpc('unschedule', {
        job_name: 'backlog-sweeper-10min'
    });

    if (error) {
        console.error("❌ Error Stopping Cron:", error);

        // Try fallback: direct delete query if RPC isn't standard
        console.log("   Trying direct SQL query...");
        const { error: sqlError } = await supabase.rpc('exec_sql', {
            sql_query: "SELECT cron.unschedule('backlog-sweeper-10min');"
        });

        if (sqlError) console.error("   ❌ SQL Fallback Failed:", sqlError);
    } else {
        console.log("✅ CRON STOPPED: 'backlog-sweeper-10min' is now unscheduled.");
    }
}

unscheduleCron();
