
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function triggerBacklog() {
    console.log('🚀 Manually Invoking process-backlog...');

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('process-backlog', {
        body: { manual: true }
    });

    if (error) {
        console.error('❌ Function Error:', error);
    } else {
        console.log('✅ Function Response:', data);
    }
}

triggerBacklog();
