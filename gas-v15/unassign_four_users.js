import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function unassignFourUsers() {
    console.log('\n🔄 --- UNASSIGNING ALL LEADS FROM 4 USERS ---\n');

    // 1. Find the 4 users
    const targetNames = ['Sandeep Rehaan', 'Rajwinder', 'Rajni', 'Gurnam'];

    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, leads_today')
        .or(targetNames.map(name => `name.ilike.%${name}%`).join(','));

    if (!users || users.length === 0) {
        console.log('❌ No users found!');
        return;
    }

    console.log(`👥 Found ${users.length} users:\n`);
    console.table(users.map(u => ({
        Name: u.name,
        Email: u.email,
        'Current Leads': u.leads_today
    })));

    const userIds = users.map(u => u.id);

    // 2. Get count of leads to unassign
    const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds);

    console.log(`\n📍 Total leads to unassign: ${leadsCount}\n`);

    if (leadsCount === 0) {
        console.log('⚠️ No leads to unassign!\n');
        return;
    }

    // 3. Unassign ALL leads from these users
    const { data: unassigned, error } = await supabase
        .from('leads')
        .update({
            user_id: null,
            assigned_to: null,
            status: 'New',
            assigned_at: null
        })
        .in('user_id', userIds)
        .select('id');

    if (error) {
        console.error('❌ Error unassigning leads:', error);
        return;
    }

    console.log(`✅ Unassigned ${unassigned.length} leads\n`);

    // 4. Reset leads_today counter for all 4 users
    const { error: updateError } = await supabase
        .from('users')
        .update({ leads_today: 0 })
        .in('id', userIds);

    if (updateError) {
        console.error('❌ Error resetting counters:', updateError);
    } else {
        console.log(`✅ Reset leads_today to 0 for all 4 users\n`);
    }

    // Final summary
    console.log('📊 SUMMARY:\n');
    users.forEach(u => {
        console.log(`   ${u.name}: Reset to 0 leads`);
    });

    console.log(`\n✅ All leads from these 4 users are now unassigned and available!\n`);
}

unassignFourUsers();
