
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function listLeadsColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { t_name: 'leads' });

    if (error) {
        // Fallback: If RPC doesn't exist, try a simple query that might fail but give us info
        const { error: err2 } = await supabase.from('leads').select('*').limit(1);
        console.log("Columns from error or data:", err2);
    } else {
        console.table(data);
    }
}

// Since I don't know the RPC name, let's try a different approach.
// I'll check a script I saw earlier: check_schema_keys.cjs
async function runCheckSchema() {
    const { data, error } = await supabase.from('leads').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Lead columns:", Object.keys(data[0]));
    } else {
        console.log("No data to infer columns.");
    }
}

runCheckSchema();
