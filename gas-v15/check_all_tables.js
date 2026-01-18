import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllTables() {
    console.log('\n🔍 --- CHECKING ALL DATABASE TABLES ---\n');

    // Common table names that might exist
    const possibleTables = [
        'leads', 'users', 'profiles',
        'dispositions', 'lead_disposition', 'lead_dispositions',
        'comments', 'lead_comments', 'notes', 'lead_notes',
        'activities', 'lead_activities', 'user_activity',
        'interactions', 'lead_interactions',
        'history', 'lead_history', 'assignment_history',
        'messages', 'lead_messages',
        'tasks', 'lead_tasks',
        'follow_ups', 'lead_follow_ups',
        'calls', 'lead_calls',
        'emails', 'lead_emails',
        'whatsapp', 'lead_whatsapp',
        'sms', 'lead_sms',
        'logs', 'audit_logs', 'activity_logs',
        'notifications', 'lead_notifications',
        'assignments', 'lead_assignments',
        'status_changes', 'lead_status_changes'
    ];

    const foundTables = [];

    for (const tableName of possibleTables) {
        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (!error) {
                foundTables.push({ name: tableName, count: count || 0 });
                console.log(`✅ ${tableName}: ${count || 0} records`);
            }
        } catch (e) {
            // Table doesn't exist
        }
    }

    console.log(`\n📊 Found ${foundTables.length} tables\n`);

    // Now check each found table for user-lead relationships
    console.log('Checking tables for user-lead mapping data...\n');

    for (const table of foundTables) {
        if (table.count === 0) continue;

        const { data: sample } = await supabase
            .from(table.name)
            .select('*')
            .limit(1);

        if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);

            // Check if table has both user and lead references
            const hasUser = columns.some(c => c.includes('user'));
            const hasLead = columns.some(c => c.includes('lead'));

            if (hasUser && hasLead) {
                console.log(`🎯 PROMISING TABLE: ${table.name}`);
                console.log(`   Columns: ${columns.join(', ')}`);
                console.log(`   Records: ${table.count}\n`);

                // Get sample data
                const { data: fullSample } = await supabase
                    .from(table.name)
                    .select('*')
                    .limit(5);

                console.table(fullSample);
                console.log('\n');
            }
        }
    }
}

checkAllTables();
