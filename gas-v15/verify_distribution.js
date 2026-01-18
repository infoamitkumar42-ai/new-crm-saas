
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDistribution() {
    console.log('\n🔍 --- CHECKING LEAD DISTRIBUTION SYSTEM (Node.js) ---\n');

    // Get today's date in IST
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`; // UTC start of today

    console.log(`📅 Date: ${today} (Checking from ${todayStart} UTC)\n`);

    // 1. Check Total Leads Today
    const { count: totalLeads, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

    if (countError) console.error('Error counting leads:', countError);
    else console.log(`📊 Total Leads Generated Today: ${totalLeads}`);

    // 2. Check Assignments per User
    const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('name, plan_name, leads_today, daily_limit, is_active')
        .eq('is_active', true)
        .order('leads_today', { ascending: false });

    if (userError) {
        console.error('Error fetching users:', userError);
    } else {
        console.log('\n👤 --- USER DISTRIBUTION OVERVIEW ---');
        console.table(userStats.map(u => ({
            Name: u.name,
            Plan: u.plan_name,
            'Leads Today': u.leads_today,
            'Limit': u.daily_limit,
            'Status': u.leads_today >= u.daily_limit ? '🔴 Full' : '🟢 Active'
        })));

        const starved = userStats.filter(u => u.leads_today === 0);
        if (starved.length > 0) {
            console.log('\n⚠️ Users with 0 leads today:', starved.map(u => u.name).join(', '));
        }

        const totalDistributed = userStats.reduce((sum, u) => sum + (u.leads_today || 0), 0);
        console.log(`\nTOTAL Distributed (Sum of users): ${totalDistributed}`);
    }

    // 3. Check "Top Tier" Start (First 15 assignments today)
    // Using users!leads_user_id_fkey as suggested by error
    // If that fails, we can try avoiding the relation join and just getting user IDs, then mapping.
    // But let's try strict relation first.
    const { data: firstAssignments, error: assignError } = await supabase
        .from('leads')
        .select('assigned_at, user_id, status, user:users!leads_user_id_fkey(name, plan_name)')
        .gte('assigned_at', todayStart)
        .order('assigned_at', { ascending: true })
        .limit(15);

    if (assignError) {
        console.error('Error fetching assignments:', assignError);
    } else {
        console.log('\n🏆 --- FIRST 15 ASSIGNMENTS (Did Top Tier start?) ---');
        if (!firstAssignments || firstAssignments.length === 0) {
            console.log('No assignments found yet today.');
        } else {
            console.table(firstAssignments.map(l => ({
                Time: l.assigned_at ? new Date(l.assigned_at).toISOString().split('T')[1].split('.')[0] : 'N/A',
                User: l.user?.name || 'Unknown',
                Plan: l.user?.plan_name || 'Unknown',
                Status: l.status
            })));
        }
    }

    // 4. Check Unassigned leads
    const { count: unassignedCount, error: pendingError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .is('user_id', null);

    if (pendingError) console.error('Error checking unassigned:', pendingError);
    else console.log(`\n⚠️ Unassigned/New Leads Today: ${unassignedCount}`);
}

checkDistribution();
