const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');

let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function runQueries() {
    const { data: rawUsers, error: errorUsers } = await supabase
        .from('users')
        .select('team_code, is_active, is_online, total_leads_received, total_leads_promised')
        .in('role', ['member', 'manager']);

    if (errorUsers) {
        console.error(errorUsers);
        return;
    }

    const teamStats = {};

    for (const user of rawUsers) {
        const team = user.team_code || 'UNASSIGNED';
        if (!teamStats[team]) {
            teamStats[team] = {
                team_code: team,
                total_members: 0,
                online_active: 0,
                eligible_for_leads: 0,
                total_quota_remaining: 0
            };
        }

        const stats = teamStats[team];
        stats.total_members++;

        if (user.is_active && user.is_online) {
            stats.online_active++;
            if (user.total_leads_received < user.total_leads_promised) {
                stats.eligible_for_leads++;
            }
        }

        if (user.total_leads_promised > user.total_leads_received) {
            stats.total_quota_remaining += (user.total_leads_promised - user.total_leads_received);
        }
    }

    const resultsArray = Object.values(teamStats).sort((a, b) => b.total_quota_remaining - a.total_quota_remaining);
    fs.writeFileSync('tmp/team_query_safe.json', JSON.stringify(resultsArray, null, 2), 'utf8');
}

runQueries();
