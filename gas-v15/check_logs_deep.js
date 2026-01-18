import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLogsForLeads() {
    console.log('\n🔍 --- CHECKING LOGS FOR LEAD DATA ---\n');

    // Check for 'lead' string in any column
    const { data: leadLogs } = await supabase
        .from('logs')
        .select('*')
        .or('action.ilike.%lead%,details.ilike.%lead%')
        .limit(20);

    // Check for 'assign' string
    const { data: assignLogs } = await supabase
        .from('logs')
        .select('*')
        .or('action.ilike.%assign%,details.ilike.%assign%')
        .limit(20);

    const allLogs = [...(leadLogs || []), ...(assignLogs || [])];

    if (allLogs.length > 0) {
        console.log(`✅ FOUND ${allLogs.length} LOGS RELATED TO LEADS/ASSIGNMENT!`);
        console.log(JSON.stringify(allLogs[0], null, 2));
    } else {
        console.log('❌ No lead/assignment logs found in "logs" table.\n');
    }

    // Check unique actions in logs to see what's there
    const { data: uniqueActions } = await supabase
        .from('logs')
        .select('action')
        .limit(500); // get a bunch

    if (uniqueActions) {
        const actions = [...new Set(uniqueActions.map(l => l.action))];
        console.log('Unique Actions in logs:', actions);
    }
}

checkLogsForLeads();
