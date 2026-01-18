import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeJan17() {
    console.log('🔍 --- ANALYZING JAN 17 LEADS (IST) ---\n');

    // Fetch leads created on Jan 17 UTC (The ones we distributed)
    // Note: We distributed based on UTC Jan 17
    const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at, source')
        .gte('created_at', '2026-01-17T00:00:00.000Z')
        .lt('created_at', '2026-01-18T00:00:00.000Z');

    if (error) { console.error(error); return; }

    console.log(`📊 Total Leads in Jan 17 UTC Batch: ${leads.length}`);

    // Bucket by IST Hour
    const hourlyStart = {};
    const hourlyEnd = {}; // Just to track range

    leads.forEach(l => {
        // Convert to IST
        const dateUTC = new Date(l.created_at);
        const dateIST = new Date(dateUTC.getTime() + (5.5 * 60 * 60 * 1000));

        const hour = dateIST.getHours();
        const hourStr = hour % 12 || 12; // 12-hour format number
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${hourStr} ${ampm} (${dateIST.getDate()} Jan)`;

        // Sort key (YearMonthDayHour)
        const sortKey = dateIST.toISOString().slice(0, 13); // YYYY-MM-DDTHH

        if (!hourlyStart[sortKey]) hourlyStart[sortKey] = { label, count: 0, sortKey };
        hourlyStart[sortKey].count++;
    });

    // Sort and Print
    const sortedHours = Object.values(hourlyStart).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    console.log('\n⏰ HOURLY BREAKDOWN (IST):');
    console.log('------------------------------------------------');
    console.log('| Time Slot (IST)      | Lead Count            |');
    console.log('------------------------------------------------');

    sortedHours.forEach(h => {
        console.log(`| ${h.label.padEnd(20)} | ${h.count.toString().padEnd(21)} |`);
    });
    console.log('------------------------------------------------');

    // Backlog vs Active calculation
    const before10PM = sortedHours.filter(h => {
        const hour = parseInt(h.sortKey.split('T')[1]);
        // 17th Jan, Hour < 22 (10 PM) AND Hour >= 8 (8 AM)
        return h.sortKey.includes('2026-01-17') && hour >= 8 && hour < 22;
    }).reduce((sum, h) => sum + h.count, 0);

    const nightLeads = leads.length - before10PM;

    console.log(`\n🧐 ANALYSIS:`);
    console.log(`- Day Shift (8 AM - 10 PM IST): ${before10PM} Leads (Should have been distributed)`);
    console.log(`- Night/Off Hours: ${nightLeads} Leads (Correctly Orphaned/Backlog)`);
}

analyzeJan17();
