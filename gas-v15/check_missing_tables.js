import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMissingTables() {
    console.log('\n🔍 --- CHECKING REMAINING TABLES ---\n');

    const tablesToCheck = [
        'tasks', 'lead_tasks',
        'follow_ups', 'lead_follow_ups',
        'calls', 'lead_calls',
        'emails', 'lead_emails',
        'whatsapp', 'lead_whatsapp',
        'sms', 'lead_sms',
        'logs', 'audit_logs', 'activity_logs', 'system_logs',
        'notifications', 'lead_notifications',
        'assignments', 'lead_assignments',
        'status_changes', 'lead_status_changes',
        'lead_audits', 'lead_versions'
    ];

    const foundTables = [];

    for (const tableName of tablesToCheck) {
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (!error) {
                console.log(`✅ ${tableName}: ${count} records`);
                if (count > 0) foundTables.push(tableName);
            }
        } catch (e) {
            // Ignore
        }
    }

    if (foundTables.length > 0) {
        console.log('\n🕵️ ANALYZING DATA IN FOUND TABLES:\n');
        for (const table of foundTables) {
            const { data } = await supabase.from(table).select('*').limit(3);
            console.log(`Table: ${table}`);
            console.log(JSON.stringify(data, null, 2));
            console.log('-'.repeat(40));
        }
    } else {
        console.log('\n❌ No data found in these specific backup/history tables.\n');
    }
}

checkMissingTables();
