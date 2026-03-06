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
    const { data: q1data, error: q1err } = await supabase
        .from('users')
        .select('is_online, is_active, role');

    let counts = {};
    if (!q1err) {
        const filtered = q1data.filter(u => u.is_active === true && ['member', 'manager'].includes(u.role));
        counts = filtered.reduce((acc, curr) => {
            const val = curr.is_online === true ? 'true' : (curr.is_online === false ? 'false' : 'null');
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    }

    const { data: q2data, error: q2err } = await supabase
        .from('users')
        .select('name, email, is_online, team_code, updated_at, is_active, role');

    let top20 = [];
    if (!q2err) {
        const filtered2 = q2data.filter(u =>
            u.is_active === true &&
            ['member', 'manager'].includes(u.role) &&
            ['TEAMFIRE', 'GJ01TEAMFIRE'].includes(u.team_code)
        );
        filtered2.sort((a, b) => {
            if (a.is_online !== b.is_online) return b.is_online ? 1 : -1;
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
        top20 = filtered2.slice(0, 20).map(({ is_active, role, ...kept }) => kept);
    }

    fs.writeFileSync('tmp/run_task2_safe.json', JSON.stringify({ counts, top20 }, null, 2));
}

runQueries();
