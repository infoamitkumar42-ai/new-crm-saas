const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkNullTeams() {
    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, team_code, role')
        .is('team_code', null)
        .eq('role', 'member')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- USERS WITH NULL TEAM_CODE ---');
    users.forEach(u => console.log(`- ${u.name} | ${u.email}`));
}

checkNullTeams();
