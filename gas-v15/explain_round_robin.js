import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Round thresholds from webhook
const ROUND_THRESHOLDS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45];

function getCurrentRound(leadsToday) {
    for (let i = 0; i < ROUND_THRESHOLDS.length; i++) {
        if (leadsToday < ROUND_THRESHOLDS[i]) return i;
    }
    return ROUND_THRESHOLDS.length;
}

function getLeadsNeededForRound(leadsToday) {
    const round = getCurrentRound(leadsToday);
    if (round >= ROUND_THRESHOLDS.length) return 0;
    return ROUND_THRESHOLDS[round] - leadsToday;
}

async function explainRoundRobin() {
    console.log('\n📊 --- ROUND ROBIN SYSTEM EXPLANATION ---\n');

    // Show round structure
    console.log('🎯 ROUND STRUCTURE (Webhook Configuration):\n');
    for (let i = 1; i < ROUND_THRESHOLDS.length; i++) {
        const prevThreshold = ROUND_THRESHOLDS[i - 1];
        const currentThreshold = ROUND_THRESHOLDS[i];
        const leadsInRound = currentThreshold - prevThreshold;
        console.log(`   Round ${i}: ${prevThreshold} → ${currentThreshold} leads (${leadsInRound} leads in this round)`);
    }

    console.log('\n📝 SIMPLE EXPLANATION:\n');
    console.log('   Round 1: User gets 1 lead  (0→1)');
    console.log('   Round 2: User gets 2 MORE leads (1→3 total)');
    console.log('   Round 3: User gets 3 MORE leads (3→6 total)');
    console.log('   Round 4: User gets 4 MORE leads (6→10 total)');
    console.log('   And so on...\n');

    // Get current distribution
    const { data: users } = await supabase
        .from('users')
        .select('name, plan_name, leads_today, daily_limit')
        .eq('is_active', true)
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false });

    console.log('📊 CURRENT DISTRIBUTION PATTERN:\n');
    console.table(users.map(u => {
        const round = getCurrentRound(u.leads_today);
        const needed = getLeadsNeededForRound(u.leads_today);

        return {
            Name: u.name,
            Plan: u.plan_name,
            'Leads': u.leads_today,
            'Current Round': round,
            'Needs for Round': needed,
            'Status': needed === 0 ? '✅ Round Complete' : `⏳ ${needed} more needed`
        };
    }));

    // Analyze if pattern is correct
    console.log('\n🔍 ROUND ROBIN VERIFICATION:\n');

    const roundCounts = {};
    users.forEach(u => {
        const round = getCurrentRound(u.leads_today);
        roundCounts[round] = (roundCounts[round] || 0) + 1;
    });

    console.log('   Users in each round:');
    Object.entries(roundCounts).forEach(([round, count]) => {
        console.log(`   - Round ${round}: ${count} users`);
    });

    console.log('\n💡 HOW IT WORKS:\n');
    console.log('   1. System picks users in LOWER rounds first');
    console.log('   2. Within same round, completes ONE user before moving to next');
    console.log('   3. Example: If User A needs 1 more for Round 2, and User B needs 2 more,');
    console.log('      User A gets the next lead (completes round faster)\n');

    console.log('✅ CORRECT PATTERN:');
    console.log('   - User 1: Gets 1 lead (completes Round 1)');
    console.log('   - User 2: Gets 1 lead (completes Round 1)');
    console.log('   - User 1: Gets 2 leads (completes Round 2)');
    console.log('   - User 2: Gets 2 leads (completes Round 2)');
    console.log('   - And so on...\n');
}

explainRoundRobin();
