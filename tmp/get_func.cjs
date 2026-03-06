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
    const query = `
    SELECT pg_get_functiondef(oid) as def
    FROM pg_proc 
    WHERE proname = 'get_best_assignee_for_team';
  `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });

    if (error) {
        console.error('Error executing SQL:', error);
    } else {
        // Write out the result nicely to a text file for easy extraction
        console.log("SQL EXECUTION SUCCESS.");
        fs.writeFileSync('tmp/rpc_output.txt', JSON.stringify(data, null, 2));
    }
}

run();
