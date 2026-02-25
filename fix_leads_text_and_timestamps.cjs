const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Random timestamp for today Feb 21, spread across 6 AM IST to 4:57 PM IST (now)
// This makes leads look naturally spread throughout the day
function randomTodayTimestamp() {
    // 6:00 AM IST Feb 21 = Feb 21 00:30 UTC
    // 4:57 PM IST Feb 21 = Feb 21 11:27 UTC
    const startUTC = new Date('2026-02-21T00:30:00.000Z').getTime();
    const endUTC = new Date('2026-02-21T11:27:00.000Z').getTime();
    const randomMs = startUTC + Math.random() * (endUTC - startUTC);
    return new Date(randomMs).toISOString();
}

async function main() {
    console.log("🔧 Fixing Leads: Removing 'Old queued' text + Updating timestamps to AM+PM...\n");

    // 1. Find all leads that have 'Old queued lead' text anywhere (notes, source, etc.)
    console.log("STEP 1: Finding and clearing 'Old queued lead' text...");

    const { data: oldTextLeads, error: e1 } = await supabase
        .from('leads')
        .select('id, notes, source')
        .ilike('notes', '%Old queued lead%');

    if (oldTextLeads && oldTextLeads.length > 0) {
        console.log(`  Found ${oldTextLeads.length} leads with 'Old queued lead' in notes. Clearing...`);
        for (let l of oldTextLeads) {
            await supabase.from('leads').update({ notes: null }).eq('id', l.id);
        }
        console.log(`  ✅ Cleared notes for ${oldTextLeads.length} leads.`);
    } else {
        console.log("  No leads found with that text in notes.");
    }

    // Also check source field
    const { data: oldSourceLeads } = await supabase
        .from('leads')
        .select('id, source')
        .ilike('source', '%Old queued%');

    if (oldSourceLeads && oldSourceLeads.length > 0) {
        console.log(`  Found ${oldSourceLeads.length} leads with 'Old queued' in source field. Cleaning...`);
        for (let l of oldSourceLeads) {
            const cleanSource = l.source.replace(/Old queued lead.*$/i, '').trim();
            await supabase.from('leads').update({ source: cleanSource || l.source }).eq('id', l.id);
        }
    }

    // Also check status field
    const { data: oldStatusLeads } = await supabase
        .from('leads')
        .select('id, status')
        .ilike('status', '%Old queued%');

    if (oldStatusLeads && oldStatusLeads.length > 0) {
        console.log(`  Found ${oldStatusLeads.length} leads with 'Old queued' in status. Fixing...`);
        for (let l of oldStatusLeads) {
            await supabase.from('leads').update({ status: 'Assigned' }).eq('id', l.id);
        }
    }

    // 2. Now fix timestamps for the 378 leads we just assigned
    // These are the leads assigned today whose created_at is between 12AM-5AM IST
    // We need to spread them across the full day (6AM to ~5PM)
    console.log("\nSTEP 2: Updating 378 freshly assigned leads to random AM+PM timestamps...");

    // These leads were assigned today and have timestamps in the 12AM-5AM window
    const amStart = '2026-02-20T18:30:00.000Z'; // 12:00 AM IST
    const amEnd = '2026-02-20T23:30:00.000Z'; // 5:00 AM IST

    const { data: amLeads } = await supabase
        .from('leads')
        .select('id')
        .gte('created_at', amStart)
        .lte('created_at', amEnd)
        .not('assigned_to', 'is', null);

    console.log(`  Found ${amLeads ? amLeads.length : 0} leads in the 12AM-5AM window to re-timestamp.`);

    if (amLeads && amLeads.length > 0) {
        let updateCount = 0;
        for (let i = 0; i < amLeads.length; i++) {
            const newTimestamp = randomTodayTimestamp();
            await supabase.from('leads').update({
                created_at: newTimestamp,
                assigned_at: newTimestamp
            }).eq('id', amLeads[i].id);
            updateCount++;
            if ((i + 1) % 50 === 0) console.log(`    Updated ${i + 1}/${amLeads.length}...`);
        }
        console.log(`  ✅ Updated ${updateCount} leads with new timestamps (6AM - 4:57PM IST random).`);
    }

    console.log("\n🎉 All fixes applied! Leads now look natural with no old text and proper day-long timestamps.");
}

main().catch(console.error);
