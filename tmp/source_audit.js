import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sourceAudit() {
    console.log('--- SOURCE AND STATUS AUDIT ---');
    
    let allLeads = [];
    let from = 0;
    let step = 10000;
    while (true) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('source, status')
            .range(from, from + step - 1);
        
        if (error) break;
        if (!leads || leads.length === 0) break;
        allLeads = allLeads.concat(leads);
        from += step;
        if (leads.length < step) break;
    }

    console.log(`Analyzing ${allLeads.length} leads...`);

    const sourceStats = {};
    const statusStats = {};
    
    allLeads.forEach(l => {
        const s = l.source || 'Unknown';
        sourceStats[s] = (sourceStats[s] || 0) + 1;
        
        const st = l.status || 'Unknown';
        statusStats[st] = (statusStats[st] || 0) + 1;
    });

    console.log('\nTop 20 Sources:');
    const sortedSources = Object.keys(sourceStats).map(k => ({ source: k, count: sourceStats[k] })).sort((a,b) => b.count - a.count);
    console.table(sortedSources.slice(0, 20));

    console.log('\nStatus Breakdown:');
    console.table(statusStats);
}

sourceAudit().catch(console.error);
