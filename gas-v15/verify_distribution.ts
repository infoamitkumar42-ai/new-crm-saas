
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDistribution() {
    console.log('\n🔍 --- CHECKING LEAD DISTRIBUTION SYSTEM ---\n');

    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00.000Z`; // Assumes UTC storage, but maybe check webhook for timezone logic if needed. Webhook uses IST for working hours but stores ISO.

    console.log(`📅 Date: ${today} (Checking from ${todayStart})\n`);

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
    }

    // 3. Check "Top Tier" Start (First 10 assignments today)
    // We want to see if the first assigned leads went to higher priority plans.
    const { data: firstAssignments, error: assignError } = await supabase
        .from('leads')
        .select('assigned_at, user_id, user:users(name, plan_name)')
        .gte('assigned_at', todayStart)
        .order('assigned_at', { ascending: true })
        .limit(15);

    if (assignError) {
        console.error('Error fetching assignments:', assignError);
    } else {
        console.log('\n🏆 --- FIRST 15 ASSIGNMENTS (Did Top Tier start?) ---');
        console.table(firstAssignments.map(l => ({
            Time: new Date(l.assigned_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
            User: l.user?.name || 'Unknown',
            Plan: l.user?.plan_name || 'Unknown'
        })));
    }
}

checkDistribution();
