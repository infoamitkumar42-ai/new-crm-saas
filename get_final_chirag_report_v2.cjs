
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

async function generateFinalReport() {
    console.log(`📊 FINAL POST-FIX REPORT: TEAM ${TEAM_CODE}`);
    console.log(`   Period: Yesterday (Feb 5) + Today (Feb 6)\n`);

    // 1. Get Active Members
    const { data: team, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .order('name');

    if (error) { console.error(error); return; }

    console.log(`✅ Total Active Members: ${team.length}`);
    console.log("------------------------------------------------------------");
    console.log(
        "NAME".padEnd(30) +
        "| LEADS (Feb 5+6)".padEnd(20) +
        "| TOTAL (All Time)"
    );
    console.log("------------------------------------------------------------");

    let grandTotalRecent = 0;
    let grandTotalAll = 0;

    for (const member of team) {
        // Count Recent (Feb 5 onwards)
        const { count: recentCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', member.id)
            .gte('created_at', '2026-02-05T00:00:00+05:30');

        // Count All Time
        const { count: totalCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', member.id);

        grandTotalRecent += (recentCount || 0);
        grandTotalAll += (totalCount || 0);

        console.log(
            member.name.padEnd(30) +
            `| ${recentCount.toString().padEnd(18)}` +
            `| ${totalCount}`
        );
    }

    console.log("------------------------------------------------------------");
    console.log(`🏆 TOTAL RECENT (Last 2 Days): ${grandTotalRecent}`);
    console.log(`🏆 TOTAL ALL TIME:             ${grandTotalAll}`);
}

generateFinalReport();
