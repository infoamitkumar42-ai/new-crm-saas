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

async function checkSignupIntent() {
    console.log('--- VERIFYING SIGNUP TEAM INTENT ---');

    // 1. Get all column names for users table
    const { data: colsRaw, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'users' });

    // If RPC doesn't exist, we'll just select one full user record
    const { data: sampleUser } = await supabase.from('users').select('*').limit(1).single();
    if (sampleUser) {
        console.log('Available User Columns:', Object.keys(sampleUser));
    }

    // 2. Check Jashanpreet's registration metadata if stored in any JSON field
    const email = "jashanpreet0479@gmail.com";
    const { data: user } = await supabase.from('users').select('*').ilike('email', email).single();

    if (user) {
        console.log(`\nTechnical data for ${user.email}:`);
        console.log(`- Manager ID: ${user.manager_id}`);
        console.log(`- metadata:`, user.metadata || user.raw_user_meta_data || 'No JSON meta found');
    }

    // 3. Check for a table that might store signup logs
    const { data: tables } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
    // Note: The above might fail due to RLS/permissions, let's try a simpler approach if it does.
}

checkSignupIntent();
