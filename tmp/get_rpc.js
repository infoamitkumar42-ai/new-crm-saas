import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        // exec_sql might return a JSON array or object
        console.log("RESULT:");
        console.dir(data, { depth: null });
    }
}

run();
