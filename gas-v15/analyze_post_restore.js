import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzePostRestore() {
    console.log('\n📊 --- ANALYZING POST-RESTORE STATE ---\n');

    // 1. Check Latest Lead Date (Did we lose today's data?)
    const { data: latest } = await supabase
        .from('leads')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (latest && latest.length > 0) {
        console.log(`🕒 LATEST LEAD IS FROM: ${latest[0].created_at}`);

        const lastDate = new Date(latest[0].created_at);
        const now = new Date();
        const diffHours = (now - lastDate) / (1000 * 60 * 60);
        console.log(`   (That is ${diffHours.toFixed(1)} hours ago)\n`);
    }

    // 2. Analyze Orphans (603 leads)
    const { data: orphans } = await supabase
        .from('leads')
        .select('created_at, status')
        .is('user_id', null);

    console.log(`🔍 Analyzing ${orphans.length} Orphan Leads:`);

    let oldOrphans = 0; // Older than Jan 16 (Backup time)
    let newOrphans = 0; // Newer than Jan 16
    let statusCounts = {};

    // Backup timestamp approx: Jan 16, 15:00 UTC
    const backupTime = new Date('2026-01-16T15:00:00Z');

    orphans.forEach(l => {
        const d = new Date(l.created_at);
        if (d < backupTime) oldOrphans++;
        else newOrphans++;

        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.log(`   - OLD Orphans (Pre-Backup): ${oldOrphans}`);
    console.log(`   - NEW Orphans (Post-Backup): ${newOrphans}`);

    console.log('\n   Orphan Status Breakdown:');
    console.log(JSON.stringify(statusCounts, null, 2));
}

analyzePostRestore();
