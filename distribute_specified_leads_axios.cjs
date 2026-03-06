const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Fix DNS timeout issues
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

const PLAN_CONFIG = {
    starter: { totalLeads: 50, maxReplacements: 5 },
    supervisor: { totalLeads: 105, maxReplacements: 10 },
    manager: { totalLeads: 160, maxReplacements: 16 },
    weekly_boost: { totalLeads: 84, maxReplacements: 8 },
    turbo_boost: { totalLeads: 98, maxReplacements: 10 }
};

function getPlanValues(planName) {
    if (!planName) return { promised: 0, replacements: 0 };
    const p = planName.toLowerCase().replace(/[\s-]+/g, '_');
    if (PLAN_CONFIG[p]) return PLAN_CONFIG[p];
    if (p.includes('turbo')) return { totalLeads: 98, maxReplacements: 10 };
    if (p.includes('weekly')) return { totalLeads: 84, maxReplacements: 8 };
    if (p.includes('manager')) return { totalLeads: 160, maxReplacements: 16 };
    if (p.includes('supervisor')) return { totalLeads: 105, maxReplacements: 10 };
    if (p.includes('starter')) return { totalLeads: 50, maxReplacements: 5 };
    return { promised: 0, replacements: 0 };
}

async function fetchAll(table, query = '') {
    let allData = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const joinChar = query ? '&' : '?';
        const url = `/${table}${query}${joinChar}limit=${limit}&offset=${offset}`;
        const res = await axiosInstance.get(url);
        const data = res.data;
        if (data.length === 0) hasMore = false;
        else {
            allData = allData.concat(data);
            offset += limit;
            if (data.length < limit) hasMore = false;
        }
    }
    return allData;
}

// Ensure string matches
const formatPhone = (p) => {
    let cp = String(p).replace(/\D/g, '');
    if (cp.startsWith('91') && cp.length == 12) cp = cp.slice(2);
    return cp;
}

async function run() {
    try {
        console.log('1. Reading new raw leads...');
        const lines = fs.readFileSync('new_raw_leads.txt', 'utf8').split('\n').filter(l => l.trim().length > 0);
        let newLeadsToInsert = [];

        // Skip header if exists
        const startIdx = lines[0].toLowerCase().includes('what_is') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const cols = lines[i].split('\t');
            if (cols.length >= 5) {
                const name = cols[2].trim();
                const phoneStr = cols[3].trim();
                const city = cols[4].trim();
                let cleanPhone = formatPhone(phoneStr);
                if (cleanPhone.length >= 10 && name.length > 0) {
                    newLeadsToInsert.push({
                        name: name,
                        phone: cleanPhone,
                        city: city,
                        source: 'Manual Insertion',
                        status: 'Fresh',
                        created_at: new Date().toISOString()
                    });
                }
            }
        }

        console.log(`Parsed ${newLeadsToInsert.length} valid fresh leads. Inserting...`);
        // We will insert them and ignore duplicates based on phone (if there is a unique constraint)
        const insertedLeads = [];
        for (const lead of newLeadsToInsert) {
            try {
                // Check if exists
                const existing = await axiosInstance.get(`/leads?phone=eq.${lead.phone}`);
                if (existing.data && existing.data.length > 0) {
                    // skip
                } else {
                    const ins = await axiosInstance.post('/leads', lead);
                    if (ins.data && ins.data[0]) {
                        insertedLeads.push(ins.data[0]);
                    }
                }
            } catch (e) { /* ignore single errors */ }
        }
        console.log(`Inserted ${insertedLeads.length} NEW leads into database.`);

        console.log('2. Fetching Users...');
        const users = await fetchAll('users', '?select=*');
        const payments = await fetchAll('payments', '?select=*&status=eq.captured');
        const targetUsers = users.filter(u => requests[u.email] !== undefined);
        console.log(`Found ${targetUsers.length} out of ${Object.keys(requests).length} target users.`);

        // Gather metrics for exactly these target users
        for (const user of targetUsers) {
            const reqAmount = requests[user.email];

            // Calculate pending limits
            const uPayments = payments.filter(p => p.user_id === user.id);
            let total_leads_promised = 0;
            let total_replacement_allowed = 0;

            if (uPayments.length > 0) {
                for (const p of uPayments) {
                    const vals = getPlanValues(p.plan_name);
                    total_leads_promised += vals.totalLeads;
                    total_replacement_allowed += vals.maxReplacements;
                }
            } else if (user.is_active && user.plan_name && user.plan_name !== 'none') {
                const vals = getPlanValues(user.plan_name);
                total_leads_promised += vals.promised || vals.totalLeads;
                total_replacement_allowed += vals.replacements || vals.maxReplacements;
            }

            const welcomeBonus = (uPayments.length > 0 || user.is_active) ? 5 : 0;
            const max_leads_entitled = total_leads_promised + total_replacement_allowed + welcomeBonus;

            // Re-fetch accurate current count
            const uLeadsRes = await axiosInstance.get(`/leads?assigned_to=eq.${user.id}&select=id`);
            const currentReceived = uLeadsRes.data.length;

            const pendingLimit = Math.max(0, max_leads_entitled - currentReceived);

            console.log(`- ${user.email} | Requested: ${reqAmount} | Max Entitled: ${max_leads_entitled} | Current Received: ${currentReceived} | Allowed Pending: ${pendingLimit}`);

            user._maxAllowed = pendingLimit;
            user._reqAmount = reqAmount;
            user._actualReceived = currentReceived;
        }

        console.log('3. Staging Unassigned Leads...');
        // get all unassigned leads to use as pool
        const unassignedList = await fetchAll('leads', '?assigned_to=is.null');
        console.log(`Available unassigned leads pool: ${unassignedList.length}`);

        let poolIndex = 0;
        let totalAssignedSession = 0;

        for (const user of targetUsers) {
            let amountToAssign = user._reqAmount;
            if (amountToAssign > user._maxAllowed) {
                console.warn(`⚠️ Warning: ${user.email} requested ${amountToAssign} but pending quota is only ${user._maxAllowed}. Capping at ${user._maxAllowed}.`);
                amountToAssign = user._maxAllowed;
            }

            const leadsForUser = [];
            while (leadsForUser.length < amountToAssign && poolIndex < unassignedList.length) {
                leadsForUser.push(unassignedList[poolIndex]);
                poolIndex++;
            }

            if (leadsForUser.length < amountToAssign) {
                console.error(`❌ CRITICAL: Ran out of unassigned leads! Wanted ${amountToAssign} for ${user.email} but only had ${leadsForUser.length}.`);
            }

            console.log(`Assigning ${leadsForUser.length} leads to ${user.email} (${user.id})...`);

            // Update the leads
            for (const lead of leadsForUser) {
                await axiosInstance.patch(`/leads?id=eq.${lead.id}`, {
                    assigned_to: user.id,
                    assigned_at: new Date().toISOString(),
                    status: 'Fresh'
                });
            }

            // Manually recalculate their new total_leads_received value
            const newTotal = user._actualReceived + leadsForUser.length;
            const newIsActive = newTotal >= (user._maxAllowed + user._actualReceived) ? false : true;

            await axiosInstance.patch(`/users?id=eq.${user.id}`, {
                total_leads_received: newTotal,
                is_active: newIsActive ? user.is_active : false, // auto stop if they hit limit
                updated_at: new Date().toISOString()
            });

            console.log(`   ✅ Success! ${user.email} new total_leads_received: ${newTotal}`);
            totalAssignedSession += leadsForUser.length;
        }

        console.log(`\n🎉 FINISHED! Successfully distributed ${totalAssignedSession} leads to target users.`);

    } catch (e) {
        console.error('Fatal Error:', e.response?.data || e.message);
    }
}

run();
