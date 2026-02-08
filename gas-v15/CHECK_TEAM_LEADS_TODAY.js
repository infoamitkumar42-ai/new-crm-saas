import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getTeamLeadCounts() {
    console.log('📊 TEAM LEAD COUNTS (Today)\n');
    console.log('============================================\n');

    const today = new Date().toISOString().split('T')[0];

    // Chirag Team (GJ01TEAMFIRE)
    console.log('1️⃣ CHIRAG TEAM (GJ01TEAMFIRE):');
    const { data: chiragUsers } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, is_active')
        .eq('team_code', 'GJ01TEAMFIRE')
        .order('leads_today', { ascending: false });

    const chiragTotal = chiragUsers?.reduce((sum, u) => sum + (u.leads_today || 0), 0) || 0;
    const chiragActive = chiragUsers?.filter(u => u.is_active).length || 0;

    console.log(`   Total Team Members: ${chiragUsers?.length || 0}`);
    console.log(`   Active Members: ${chiragActive}`);
    console.log(`   📈 TOTAL LEADS TODAY: ${chiragTotal}`);

    // Top 5 users
    console.log('\n   Top 5 Users:');
    chiragUsers?.slice(0, 5).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name}: ${u.leads_today}/${u.daily_limit} leads`);
    });

    // Himanshu Team (TEAMFIRE)
    console.log('\n\n2️⃣ HIMANSHU TEAM (TEAMFIRE):');
    const { data: himanshuUsers } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, is_active')
        .eq('team_code', 'TEAMFIRE')
        .order('leads_today', { ascending: false });

    const himanshuTotal = himanshuUsers?.reduce((sum, u) => sum + (u.leads_today || 0), 0) || 0;
    const himanshuActive = himanshuUsers?.filter(u => u.is_active).length || 0;

    console.log(`   Total Team Members: ${himanshuUsers?.length || 0}`);
    console.log(`   Active Members: ${himanshuActive}`);
    console.log(`   📈 TOTAL LEADS TODAY: ${himanshuTotal}`);

    // Top 5 users
    console.log('\n   Top 5 Users:');
    himanshuUsers?.slice(0, 5).forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.name}: ${u.leads_today}/${u.daily_limit} leads`);
    });

    // Summary
    console.log('\n\n============================================');
    console.log('📊 SUMMARY:');
    console.log('============================================');
    console.log(`Chirag Team:    ${chiragTotal} leads`);
    console.log(`Himanshu Team:  ${himanshuTotal} leads`);
    console.log(`─────────────────────────────────────────`);
    console.log(`GRAND TOTAL:    ${chiragTotal + himanshuTotal} leads`);
    console.log('============================================\n');
}

getTeamLeadCounts().catch(console.error);
