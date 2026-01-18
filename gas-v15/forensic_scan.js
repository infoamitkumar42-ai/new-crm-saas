import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deepForensicSearch() {
    console.log('\n🔍 --- DEEP FORENSIC DATABASE SCAN ---\n');

    // 1. Get ALL tables from public schema
    const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) {
        console.error('Error fetching tables:', error);
        return;
    }

    console.log(`Scanning ${tables.length} tables for data...\n`);

    const tablesWithData = [];

    for (const t of tables) {
        const tableName = t.table_name;

        // Skip the main tables we know about for a moment to focus on others
        // if (['leads', 'users'].includes(tableName)) continue;

        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (!error && count > 0) {
                tablesWithData.push({ name: tableName, count });
            }
        } catch (e) {
            // Ignore errors
        }
    }

    console.log('📊 TABLES WITH DATA:\n');
    console.table(tablesWithData);

    // 2. Analyze candidate tables for Linkage (user_id + lead_id)
    console.log('\n🕵️ ANALYZING CANDIDATES FOR RESTORATION:\n');

    for (const t of tablesWithData) {
        // Skip users table, it doesn't link leads
        if (t.name === 'users') continue;

        const { data: sample } = await supabase
            .from(t.name)
            .select('*')
            .limit(1);

        if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            const strCols = columns.join(', ').toLowerCase();

            // Loose matching for columns
            const hasUser = strCols.includes('user') || strCols.includes('owner') || strCols.includes('agent');
            const hasLead = strCols.includes('lead');

            if (hasUser && hasLead) {
                console.log(`✅ MATCH FOUND: ${t.name}`);
                console.log(`   Columns: ${columns.join(', ')}`);
                console.log(`   Potential to restore: ${t.count} links\n`);

                // Show a sample record to confirm
                const { data: fullSample } = await supabase
                    .from(t.name)
                    .select('*')
                    .limit(3);
                console.log('   Sample Data:', JSON.stringify(fullSample, null, 2));
                console.log('-'.repeat(50));
            }
        }
    }

    // 3. Special Check on Leads Columns again (just in case)
    console.log('\n🧐 DOUBLE CHECKING LEADS TABLE COLUMNS:\n');
    const { data: leadCols } = await supabase.from('leads').select('*').limit(1);
    if (leadCols && leadCols.length > 0) {
        console.log(Object.keys(leadCols[0]));
    }
}

deepForensicSearch();
