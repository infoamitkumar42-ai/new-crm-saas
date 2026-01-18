import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function parseAndRestore() {
    console.log('\n🔄 --- PARSING LOGS (V3 - Robust Split) ---');

    let logsContent;
    try {
        logsContent = fs.readFileSync('restoration_logs.txt', 'utf8');
    } catch (e) {
        console.error("Error reading file:", e.message);
        return;
    }

    const lines = logsContent.split('\n').reverse();

    const leadDetailRegex = /👤\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(.*)/;
    const assignmentRegex = /✅\s*([^→]+)\s*→\s*([^(]+)\s*\(Round/;

    const restorationCandidates = [];
    let currentLead = null;
    let matchCount = 0;

    for (const line of lines) {
        // Robust Parsing (Right-to-Left)
        // Expected format: | Message | Type | FID | ID | Level | TS |
        // Split by |
        // Note: First and Last elements might be empty strings due to leading/trailing pipes

        const parts = line.split('|').map(s => s.trim());

        // Filter out empty start/end
        const cleanParts = parts.filter(s => s.length > 0);

        // We need at least 6 parts (Msg, Type, FID, ID, Level, TS)
        if (cleanParts.length < 6) continue;

        const timestampStr = cleanParts[cleanParts.length - 1];
        const level = cleanParts[cleanParts.length - 2];
        const id = cleanParts[cleanParts.length - 3];
        const fid = cleanParts[cleanParts.length - 4];
        const type = cleanParts[cleanParts.length - 5];

        // Message is everything before Type
        // Join back parts from index 0 to length-5
        const messageParts = cleanParts.slice(0, cleanParts.length - 5);
        const message = messageParts.join('|'); // Join with pipe in case it was split

        if (!timestampStr.match(/^\d+$/)) continue; // Verify TS is digits

        matchCount++;
        const timestampMicro = parseInt(timestampStr);
        const timestamp = new Date(timestampMicro / 1000).toISOString();

        // 1. Detect Lead Details
        const leadMatch = message.match(leadDetailRegex);
        if (leadMatch) {
            currentLead = {
                name: leadMatch[1].trim(),
                phone: leadMatch[2].trim(),
                city: leadMatch[3].trim(),
                timestamp: timestamp,
                assignedTo: null
            };
        }

        // 2. Detect Assignment
        const assignMatch = message.match(assignmentRegex);
        if (assignMatch && currentLead) {
            const matchedLeadName = assignMatch[1].trim();
            // Check if name matches roughly (first name)
            if (currentLead.name.toLowerCase().includes(matchedLeadName.split(' ')[0].toLowerCase())) {
                currentLead.assignedTo = assignMatch[2].trim();
                restorationCandidates.push({ ...currentLead });
                currentLead = null;
            }
        }

        // 3. Detect "No eligible users"
        if (message.includes('No eligible users') && currentLead) {
            currentLead.assignedTo = null;
            restorationCandidates.push({ ...currentLead });
            currentLead = null;
        }
    }

    console.log(`Matched ${matchCount} valid log rows.`);
    console.log(`Extracted ${restorationCandidates.length} restoration candidates.`);

    if (restorationCandidates.length > 0) {
        console.log('Sample Candidates:', restorationCandidates.slice(0, 3).map(l => `${l.name} -> ${l.assignedTo}`));
    } else {
        console.log("⚠️ Still 0 candidates. Dumping sample parsed messages:");
        lines.slice(0, 5).forEach(l => {
            const p = l.split('|');
            console.log("Raw Split:", p);
        });
        return;
    }

    // --- RESTORATION LOGIC ---

    const { data: users } = await supabase.from('users').select('id, name');
    const userMap = {};
    users.forEach(u => {
        if (u.name) userMap[u.name.toLowerCase()] = u.id;
    });

    let successCount = 0;

    for (const lead of restorationCandidates) {
        // Check Duplicate
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', lead.phone)
            .maybeSingle();

        if (existing) {
            process.stdout.write('.');
            continue;
        }

        let userId = null;
        // Fix for "Himanshu Sharma" sometimes having different casing or match
        if (lead.assignedTo) {
            const normalized = lead.assignedTo.toLowerCase();
            userId = userMap[normalized];
            // Try partial match if failed?
            if (!userId) {
                const partial = Object.keys(userMap).find(k => k.includes(normalized) || normalized.includes(k));
                if (partial) userId = userMap[partial];
            }
        }

        const { error } = await supabase.from('leads').insert({
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
            state: 'unknown',
            status: userId ? 'Assigned' : 'New',
            user_id: userId,
            assigned_to: userId,
            created_at: lead.timestamp,
            assigned_at: userId ? lead.timestamp : null,
            source: 'Log Restoration V3'
        });

        if (!error) successCount++;
    }

    console.log(`\n\n✅ Successfully Restored: ${successCount} leads.`);
}

parseAndRestore();
