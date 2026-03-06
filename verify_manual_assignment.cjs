const axios = require('axios');

require('dns').setDefaultResultOrder('ipv4first');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const axiosInstance = axios.create({
    baseURL: `${SUPABASE_URL}/rest/v1`,
    headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    timeout: 30000
});

const requests = {
    'mandeepkau340@gmail.com': 53,
    'singhmanbir938@gmail.com': 25,
    'dhawantanu536@gmail.com': 25,
    'harmandeepkaurmanes790@gmail.com': 23,
    'gurnoor1311singh@gmail.com': 23,
    'sainsachin737@gmail.com': 22,
    'harpreetk61988@gmail.com': 21,
    'kulwantsinghdhaliwalsaab668@gmail.com': 13,
    'prince@gmail.com': 12,
    'ranjodhmomi@gmail.com': 10,
    'rupanasameer551@gmail.com': 1,
    'priyajotgoyal@gmail.com': 36,
    'salonirajput78690@gmail.com': 31,
    'dw656919@gmail.com': 27,
    'komalkomal96534@gmail.com': 18
};

async function fetchAll(table, query = '') {
    let allData = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const joinChar = query ? '&' : '?';
        const url = `/${table}${query}${joinChar}limit=${limit}&offset=${offset}`;
        try {
            const res = await axiosInstance.get(url);
            const data = res.data;
            if (data.length === 0) hasMore = false;
            else {
                allData = allData.concat(data);
                offset += limit;
                if (data.length < limit) hasMore = false;
            }
        } catch (e) {
            console.error(`Error fetching ${table}:`, e.message);
            throw e;
        }
    }
    return allData;
}

async function run() {
    try {
        console.log('Fetching Users...');
        const users = await fetchAll('users', '?select=id,email,name');
        const targetUsers = users.filter(u => requests[u.email] !== undefined);
        console.log(`Found ${targetUsers.length} target users.\n`);

        const userMap = {};
        for (let u of targetUsers) {
            userMap[u.id] = u.email;
        }

        // Fetch leads assigned today (or recently)
        const gteDate = new Date();
        gteDate.setHours(0, 0, 0, 0);
        const dateStr = gteDate.toISOString();

        console.log(`Fetching leads assigned since ${dateStr}...`);

        // Build an IN query for user IDs
        const userIds = targetUsers.map(u => u.id).join(',');
        const query = `?assigned_to=in.(${userIds})&assigned_at=gte.${dateStr}&select=id,assigned_to,assigned_at,notes,source`;

        const recentLeads = await fetchAll('leads', query);
        console.log(`Found ${recentLeads.length} leads assigned to target users today.\n`);

        const summary = {};
        for (let email in requests) {
            summary[email] = {
                requested: requests[email],
                received_today: 0,
                timestamps: [],
                notes_status: { null_count: 0, with_content: 0, sample_notes: [] },
                source_counts: {}
            };
        }

        for (let l of recentLeads) {
            const email = userMap[l.assigned_to];
            if (email && summary[email]) {
                summary[email].received_today++;

                // Track timestamps
                summary[email].timestamps.push(l.assigned_at);

                // Track notes
                if (l.notes === null || l.notes === undefined || String(l.notes).trim() === '') {
                    summary[email].notes_status.null_count++;
                } else {
                    summary[email].notes_status.with_content++;
                    if (summary[email].notes_status.sample_notes.length < 2) {
                        summary[email].notes_status.sample_notes.push(l.notes);
                    }
                }

                // Track Source
                summary[email].source_counts[l.source] = (summary[email].source_counts[l.source] || 0) + 1;
            }
        }

        console.log("=== DISTRIBUTION VERIFICATION REPORT ===\n");
        let totalAssignedToday = 0;
        let globalNotesNull = 0;
        let globalNotesFilled = 0;

        let allTimestamps = [];

        for (let email in summary) {
            const stat = summary[email];
            const check = stat.received_today >= stat.requested ? '✅' : '❌';
            console.log(`${check} ${email}: Requested ${stat.requested} | Received today: ${stat.received_today}`);
            totalAssignedToday += stat.received_today;

            globalNotesNull += stat.notes_status.null_count;
            globalNotesFilled += stat.notes_status.with_content;

            allTimestamps = allTimestamps.concat(stat.timestamps);
        }

        console.log(`\n=== TIMESTAMPS OVERVIEW ===`);
        if (allTimestamps.length > 0) {
            // Sort to find min/max
            allTimestamps.sort();
            const minTime = new Date(allTimestamps[0]);
            const maxTime = new Date(allTimestamps[allTimestamps.length - 1]);

            console.log(`Earliest Assignment Today: ${minTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
            console.log(`Latest Assignment Today:   ${maxTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        } else {
            console.log("No assignments found today for these users!");
        }

        console.log(`\n=== NOTES VERIFICATION ===`);
        console.log(`Total leads with NULL/Empty notes: ${globalNotesNull}`);
        console.log(`Total leads with populated notes:  ${globalNotesFilled}`);

        if (globalNotesFilled > 0) {
            console.log("Samples of populated notes found:");
            for (let email in summary) {
                if (summary[email].notes_status.with_content > 0) {
                    console.log(`- ${email}: ${summary[email].notes_status.sample_notes[0]}`);
                }
            }
        } else {
            console.log("✅ Verified: ALL assigned leads have NULL/Empty notes as expected.");
        }

    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

run();
