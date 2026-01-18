import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeOrphans() {
    console.log('🔍 --- ANALYZING ORPHAN LEADS (Unassigned) ---\n');

    // Fetch leads where user_id is NULL
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .is('user_id', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching leads:', error.message);
        return;
    }

    console.log(`📊 Total Orphan Leads Found: ${leads.length}`);

    if (leads.length === 0) {
        console.log('✅ No orphan leads found.');
        return;
    }

    // Analysis Buckets
    const byDate = {};
    const byHour = {};
    const bySource = {};

    leads.forEach(lead => {
        const d = new Date(lead.created_at);

        // Date Bucket (YYYY-MM-DD)
        const dateKey = d.toISOString().split('T')[0];
        byDate[dateKey] = (byDate[dateKey] || 0) + 1;

        // Hour Bucket (00-23)
        const hourKey = d.getHours().toString().padStart(2, '0') + ':00';
        byHour[hourKey] = (byHour[hourKey] || 0) + 1;

        // Source Bucket
        const source = (lead.source || 'Unknown').split(' - ')[0]; // Simplify source
        bySource[source] = (bySource[source] || 0) + 1;
    });

    // REPORT
    console.log('\n📅 BREAKDOWN BY DATE:');
    console.table(byDate);

    console.log('\n⏰ BREAKDOWN BY HOUR (UTC):');
    // Aggregate hours for clearer view if too many
    console.table(Object.entries(byHour).sort().reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}));

    console.log('\n🌐 BREAKDOWN BY SOURCE:');
    console.table(bySource);

    // Show Sample of 5 Oldest and 5 Newest
    console.log('\n🆕 5 NEWEST ORPHANS:');
    leads.slice(0, 5).forEach(l => console.log(`   - ${l.name} (${l.phone}) | ${l.created_at} | ${l.source}`));

    console.log('\n👴 5 OLDEST ORPHANS:');
    leads.slice(-5).forEach(l => console.log(`   - ${l.name} (${l.phone}) | ${l.created_at} | ${l.source}`));
}

analyzeOrphans();
