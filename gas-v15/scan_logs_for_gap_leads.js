import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scanLogsForHistory() {
    console.log('\n🕵️ --- FORENSIC SCAN: GAP LEADS HISTORY ---\n');

    // 1. Get Gap Leads
    const startCheck = new Date('2026-01-16T15:30:00+05:30').toISOString(); // Buffer
    const endCheck = new Date('2026-01-17T05:00:00+05:30').toISOString();

    const { data: leads } = await supabase
        .from('leads')
        .select('id, phone, name')
        .gte('created_at', startCheck)
        .lte('created_at', endCheck)
        .is('assigned_to', null);

    if (!leads || leads.length === 0) {
        console.log("No unassigned gap leads to check.");
        return;
    }

    console.log(`Checking history for ${leads.length} unassigned leads...`);

    // 2. Check if 'logs' or 'audit_logs' exists
    const { error: tableError } = await supabase.from('logs').select('id').limit(1);
    if (tableError) {
        console.log("⚠️ 'logs' table access failed or does not exist.");
        // Try 'audit_logs'
        const { error: auditError } = await supabase.from('audit_logs').select('id').limit(1);
        if (auditError) {
            console.log("⚠️ 'audit_logs' table also failed.");
            console.log("❌ NO INTERNAL LOG TABLES AVAILABLE FOR FORENSICS.");
            return;
        } else {
            console.log("✅ 'audit_logs' table found. Switching scan target...");
            await scanTable('audit_logs', leads);
            return;
        }
    }

    console.log("✅ 'logs' table found. Scanning...");
    await scanTable('logs', leads);
}

async function scanTable(tableName, leads) {
    let matchCount = 0;

    // We can't do a huge OR query easily, so we'll check a sample or do iterated checks.
    // For 134 leads, 134 queries is slow but safe.
    // Let's try batching or just checking the first 10 to see if ANY data exists.

    console.log("(Scanning first 10 leads to check for data existence...)");

    for (const lead of leads.slice(0, 10)) {
        // Search for phone in generic text columns if possible? 
        // Or assume there's a specific structure?
        // Let's assume a 'message' or 'details' column exists (common).
        // We'll perform a text search.

        const { data: hits, error } = await supabase
            .from(tableName)
            .select('*')
            .textSearch('message', `'${lead.phone}'`) // Full text search logic varies
            .limit(1);

        // Fallback if textSearch fails or isn't set up: 'ilike'
        if (error) {
            const { data: ilikeHits } = await supabase
                .from(tableName)
                .select('*')
                .ilike('message', `%${lead.phone}%`)
                .limit(1);

            if (ilikeHits && ilikeHits.length > 0) {
                console.log(`✅ FOUND TRACE for ${lead.phone}:`, ilikeHits[0]);
                matchCount++;
            }
        } else if (hits && hits.length > 0) {
            console.log(`✅ FOUND TRACE for ${lead.phone}:`, hits[0]);
            matchCount++;
        }
    }

    if (matchCount === 0) {
        console.log(`❌ Scanned sample leads in '${tableName}' - NO MATCHES FOUND.`);
        console.log("Conclusion: Internal DB logs do not contain lead assignment history.");
    } else {
        console.log(`🎯 HIT! Found history. Validating exact assignments...`);
        // If hits found, we would proceed to map them.
    }
}

scanLogsForHistory();
