const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditTeams() {
    console.log("🕵️ STARTING DEEP AUDIT...");
    const today = new Date().toISOString().split('T')[0];

    // 1. Analyze GJ01TEAMFIRE Members
    console.log("\n--- GJ01TEAMFIRE MEMBER AUDIT ---");
    const { data: chiragMembers } = await supabase
        .from('users')
        .select('id, name, email, payment_status, is_active, plan_name, valid_until')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('payment_status', 'active'); // User said 33, I found 40. Let's see.

    console.log(`Found ${chiragMembers.length} 'active' payment status members.`);

    // Check if any should be inactive
    const expiredOrInactive = chiragMembers.filter(u => {
        const expired = u.valid_until && new Date(u.valid_until) < new Date();
        const flaggedInactive = u.is_active === false;
        return expired || flaggedInactive;
    });

    if (expiredOrInactive.length > 0) {
        console.log(`⚠️ POTENTIAL GHOST MEMBERS (${expiredOrInactive.length}):`);
        expiredOrInactive.forEach(u => console.log(`- ${u.name} (${u.email}) [Expired: ${u.valid_until ? 'YES' : 'NO'}, ActiveFlag: ${u.is_active}]`));
    } else {
        console.log("✅ All 40 appear valid based on DB columns. Please verify names.");
    }

    // 2. Analyze Lead Counts (Generated vs Assigned)
    console.log("\n--- LEAD COUNT AUDIT (Today) ---");

    // Fetch all leads for today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, status, user_id, source, created_at')
        .gte('created_at', today);

    if (error) { console.error(error); return; }

    // Group by Team Logic
    // Note: 'team_code' column in leads might be null if assigned to a user directly? 
    // We infer team from the assigned user if possible, or source.

    const stats = {
        'TEAMFIRE': { generated: 0, assigned: 0, queued: 0 },
        'GJ01TEAMFIRE': { generated: 0, assigned: 0, queued: 0 },
        'OTHERS': { generated: 0, assigned: 0, queued: 0 }
    };

    // Helper to get user team
    const { data: allUsers } = await supabase.from('users').select('id, team_code');
    const userTeamMap = {};
    allUsers.forEach(u => userTeamMap[u.id] = u.team_code);

    // Analyze leads
    leads.forEach(l => {
        let team = l.team_code;

        // If lead has no team_code, try to infer from assigned user
        if (!team && l.user_id) {
            team = userTeamMap[l.user_id];
        }

        // Fallback: If source indicates a specific team (heuristic)
        if (!team) {
            if (l.source && l.source.includes('himanshu')) team = 'TEAMFIRE'; // Example
            // Add more heuristics if you know them, otherwise put in OTHERS
        }

        // Normalize team name
        if (team === 'TEAMFIRE') {
            stats['TEAMFIRE'].generated++;
            if (l.user_id) stats['TEAMFIRE'].assigned++;
            else stats['TEAMFIRE'].queued++;
        } else if (team === 'GJ01TEAMFIRE') {
            stats['GJ01TEAMFIRE'].generated++;
            if (l.user_id) stats['GJ01TEAMFIRE'].assigned++;
            else stats['GJ01TEAMFIRE'].queued++;
        } else {
            stats['OTHERS'].generated++;
            if (l.user_id) stats['OTHERS'].assigned++;
            else stats['OTHERS'].queued++;
        }
    });

    console.log("📊 LEAD STATS (INFERRED):");
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n--- QUEUE CHECK ---");
    const { count: pendingCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'New').is('user_id', null).gte('created_at', today);
    console.log(`Total 'New' leads in queue (Unassigned) today: ${pendingCount}`);

    console.log("🛑 END AUDIT");
}

auditTeams();
