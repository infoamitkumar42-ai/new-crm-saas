const fs = require('fs');

const requests = [
    { email: 'mandeepkau340@gmail.com', amount: 53 },
    { email: 'singhmanbir938@gmail.com', amount: 25 },
    { email: 'dhawantanu536@gmail.com', amount: 25 },
    { email: 'harmandeepkaurmanes790@gmail.com', amount: 23 },
    { email: 'gurnoor1311singh@gmail.com', amount: 23 },
    { email: 'sainsachin737@gmail.com', amount: 22 },
    { email: 'harpreetk61988@gmail.com', amount: 21 },
    { email: 'kulwantsinghdhaliwalsaab668@gmail.com', amount: 13 },
    { email: 'prince@gmail.com', amount: 12 },
    { email: 'ranjodhmomi@gmail.com', amount: 10 },
    { email: 'rupanasameer551@gmail.com', amount: 1 },
    { email: 'priyajotgoyal@gmail.com', amount: 36 },
    { email: 'salonirajput78690@gmail.com', amount: 31 },
    { email: 'dw656919@gmail.com', amount: 27 },
    { email: 'komalkomal96534@gmail.com', amount: 18 }
];

const formatPhone = (p) => {
    let cp = String(p).replace(/\D/g, '');
    if (cp.startsWith('91') && cp.length == 12) cp = cp.slice(2);
    return cp;
}

const lines = fs.readFileSync('new_raw_leads.txt', 'utf8').split('\n').filter(l => l.trim().length > 0);
let newLeadsToInsert = [];
const startIdx = lines[0].toLowerCase().includes('what_is') ? 1 : 0;

for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols.length >= 5) {
        const name = cols[2].trim().replace(/'/g, "''");
        const phoneStr = cols[3].trim();
        const city = cols[4].trim().replace(/'/g, "''");
        let cleanPhone = formatPhone(phoneStr);
        if (cleanPhone.length >= 10 && name.length > 0) {
            newLeadsToInsert.push(`('${name}', '${cleanPhone}', '${city}', 'Manual Insertion', 'Fresh')`);
        }
    }
}

let sql = `-- ==============================================================================
-- 1. INSERT NEW LEADS IN BULK
-- ==============================================================================
INSERT INTO leads (name, phone, city, source, status)
VALUES
${newLeadsToInsert.join(',\n')}
ON CONFLICT DO NOTHING; -- Assuming conflict prevention, or ignore if no constraint

-- ==============================================================================
-- 2. EXACT ALLOCATION LOGIC (PL/PGSQL)
-- ==============================================================================
DO $$ 
DECLARE
    target RECORD;
    lead_rec RECORD;
    leads_to_assign INT;
    assigned_count INT;
    max_allowed INT;
    current_received INT;
    new_total INT;
    plan_record RECORD;
BEGIN
    -- Temporary array of requests
    CREATE TEMP TABLE IF NOT EXISTS temp_assignments (
        email TEXT,
        requested_amount INT
    );
    TRUNCATE temp_assignments;
    
`;

requests.forEach(r => {
    sql += `    INSERT INTO temp_assignments (email, requested_amount) VALUES ('${r.email}', ${r.amount});\n`;
});

sql += `
    FOR target IN 
        SELECT u.id, u.email, t.requested_amount, u.plan_name, u.is_active,
               u.total_leads_promised, u.total_leads_received 
        FROM temp_assignments t
        JOIN users u ON u.email = t.email
    LOOP
        -- Determine exactly how many they are allowed globally
        max_allowed := COALESCE(target.total_leads_promised, 0);
        current_received := (SELECT COUNT(*) FROM leads WHERE assigned_to = target.id);
        
        -- Default to giving exactly what was asked if limits aren't strictly calculable or exist
        leads_to_assign := target.requested_amount;
        
        IF max_allowed > 0 THEN
            IF leads_to_assign > (max_allowed - current_received) THEN
                leads_to_assign := (max_allowed - current_received);
            END IF;
        END IF;

        IF leads_to_assign > 0 THEN
            assigned_count := 0;
            
            -- Fetch specific unassigned leads for this user and assign them one by one
            FOR lead_rec IN 
                SELECT id FROM leads WHERE assigned_to IS NULL ORDER BY created_at ASC LIMIT leads_to_assign
            LOOP
                UPDATE leads 
                SET assigned_to = target.id, 
                    assigned_at = NOW(), 
                    status = 'Fresh' 
                WHERE id = lead_rec.id;
                
                assigned_count := assigned_count + 1;
            END LOOP;
            
            -- Recalculate and update the user's total active leads received precisely
            new_total := current_received + assigned_count;
            
            UPDATE users 
            SET total_leads_received = new_total,
                is_active = CASE 
                                WHEN max_allowed > 0 AND new_total >= max_allowed THEN false 
                                ELSE is_active 
                            END,
                updated_at = NOW()
            WHERE id = target.id;
            
            RAISE NOTICE 'Assigned % leads to %. New total: %.', assigned_count, target.email, new_total;
        ELSE
            RAISE NOTICE 'Skipping %. Target amount exceeded or reached.', target.email;
        END IF;
    END LOOP;
    
    DROP TABLE temp_assignments;
END $$;
`;

fs.writeFileSync('manual_lead_distribution_pure_sql.sql', sql);
console.log('SQL File built perfectly. No network calls executed locally.');
