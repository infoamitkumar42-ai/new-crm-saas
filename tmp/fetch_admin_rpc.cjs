const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_admin_dashboard_data';" });
    if (error) {
        console.error(error);
    } else {
        fs.writeFileSync('tmp/get_admin_dashboard_data.sql', JSON.stringify(data, null, 2));
        console.log('Saved to tmp/get_admin_dashboard_data.sql');
    }
}

run();
