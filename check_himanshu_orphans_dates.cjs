const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const HIMANSHU_SOURCES = [
    'new year ad himanshu 7/1/26',
    'Meta - Work With Himanshu Sharma 2',
    'Meta - Work With Himanshu Sharma',
    'Meta - TFE 6444 Community (Himanshu)',
    'Meta - Digital Skills India - By Himanshu Sharma',
    'new scale campaing',
    'facebook',
    'Realtime',
    'new year ad himanshu 7/1/26 – Copy',
    'new punjab ad'
];

async function main() {
    console.log("📊 Himanshu Page Orphan Leads - Date-wise Breakdown\n");

    let allOrphans = [];

    for (let src of HIMANSHU_SOURCES) {
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, created_at, source')
            .eq('source', src)
            .is('assigned_to', null)
            .order('created_at', { ascending: true });

        if (leads && leads.length > 0) {
            allOrphans = allOrphans.concat(leads);
        }
    }

    console.log(`Total Himanshu-Page Orphan Leads: ${allOrphans.length}\n`);

    // Date-wise breakdown
    const dateWise = {};
    const sourceWise = {};

    allOrphans.forEach(l => {
        // Convert to IST date
        const d = new Date(l.created_at);
        const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
        const dateStr = istDate.toISOString().split('T')[0];

        if (!dateWise[dateStr]) dateWise[dateStr] = 0;
        dateWise[dateStr]++;

        const src = l.source || 'Unknown';
        if (!sourceWise[src]) sourceWise[src] = { total: 0, oldest: dateStr, newest: dateStr };
        sourceWise[src].total++;
        if (dateStr < sourceWise[src].oldest) sourceWise[src].oldest = dateStr;
        if (dateStr > sourceWise[src].newest) sourceWise[src].newest = dateStr;
    });

    console.log("=== DATE-WISE BREAKDOWN ===");
    const sortedDates = Object.entries(dateWise).sort((a, b) => a[0].localeCompare(b[0]));
    sortedDates.forEach(([date, count]) => {
        console.log(`  ${date}: ${count} orphan leads`);
    });

    console.log("\n=== SOURCE-WISE SUMMARY ===");
    Object.entries(sourceWise).sort((a, b) => b[1].total - a[1].total).forEach(([src, info]) => {
        console.log(`  ${src}: ${info.total} leads (${info.oldest} to ${info.newest})`);
    });

    // How old are they?
    const today = new Date('2026-02-21');
    const oldestDate = sortedDates.length > 0 ? new Date(sortedDates[0][0]) : today;
    const newestDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1][0]) : today;

    const oldestDays = Math.floor((today - oldestDate) / (1000 * 60 * 60 * 24));
    const newestDays = Math.floor((today - newestDate) / (1000 * 60 * 60 * 24));

    console.log(`\n=== AGE ANALYSIS ===`);
    console.log(`Oldest orphan lead: ${sortedDates[0]?.[0]} (${oldestDays} days old)`);
    console.log(`Newest orphan lead: ${sortedDates[sortedDates.length - 1]?.[0]} (${newestDays} days old)`);
    console.log(`\nTotal assignable to TEAMFIRE: ${allOrphans.length}`);
}

main().catch(console.error);
