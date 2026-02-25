const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

// The 134 emails we know about
const manualEmails = [
    'jashanpreet0479@gmail.com', 'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'mandeep.k21@icloud.com',
    'sakshidigra24@gmail.com', 'husanpreetkaur9899@gmail.com', 's73481109@gmail.com', 'nikkibaljinderkaur@gmail.com',
    'gurnoor1311singh@gmail.com', 'yy861880@gmail.com', 'princyrani303@gmail.com', 'brark5763@gmail.com',
    'payalpuri3299@gmail.com', 'hansmanraj88@gmail.com', 'nitinanku628@gmail.com', 'ssatnam41912@gmail.com',
    'aansh8588@gmail.com', 'my440243@gmail.com', 'preetibrarbrar7@gmail.com', 'ananyakakkar53b@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'kulwantsinghdhaliwalsaab668@gmail.com',
    'harjinderkumarkumar56@gmail.com', 'gurdeepgill613@gmail.com', 'reshamkaur6@gmail.com',
    'arshdeepjnvkauni1606@gmail.com', 'officialrajinderdhillon@gmail.com', 'jasmeensingh188@gmail.com',
    'sujalsankhla11@gmail.com', 'prince@gmail.com', 'chaurasiyasonali56@gmail.com', 'priyaarora50505@gmail.com',
    'rimpy7978@gmail.com', 'rupanasameer551@gmail.com', 'jollypooja5@gmail.com', 'jaspreetkaursarao45@gmail.com',
    'rajveerbrarbrar637@gmail.com', 'goldymahi27@gmail.com', 'sainsachin737@gmail.com', 'ranjodhmomi@gmail.com',
    'loveleensharma530@gmail.com', 'ludhranimohit91@gmail.com', 'harpreetk61988@gmail.com',
    'gurteshwargill098@gmail.com', 'paramjitkaur20890@gmail.com', 'dhawantanu536@gmail.com',
    'gjama1979@gmail.com', 'amritpalkaursohi358@gmail.com', 'arshkaur6395@gmail.com',
    'knavjotkaur113@gmail.com', 'sipreet73@gmail.com', 'mandeepkau340@gmail.com', 'surjitsingh1067@gmail.com',
    'mandeepbrar1325@gmail.com', 'muskanchopra376@gmail.com', 'jk419473@gmail.com', 'aryansandhu652@gmail.com',
    'sharmaanjali93962@gmail.com', 'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'dbrar8826@gmail.com',
    'neharajoria1543@gmail.com', 'sumansumankaur09@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'harmandeepkaurmanes790@gmail.com', 'ashok376652@gmail.com',
    'kaurdeep06164@gmail.com', 'sranjasnoor11@gmail.com', 'ziana4383@gmail.com', 'rajveerkhattra9999@gmail.com',
    'jashandeepkaur6444@gmail.com', 'jasdeepsra68@gmail.com', 'loveleenkaur8285@gmail.com',
    'singhmanbir938@gmail.com', 'brarmandeepkaur7@gmail.com', 'lakhveerkaur219@gmail.com', 'kiran@gmail.com',
    'shivanilead2026@gmail.com'
];

(async () => {
    console.log('--- 👻 GHOST USER HUNT (Feb 1 - Now) 👻 ---');

    // 1. Get ALL leads assigned in Feb
    const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', '2026-02-01T00:00:00Z');

    const leadCounts = {};
    leads.forEach(l => {
        leadCounts[l.assigned_to] = (leadCounts[l.assigned_to] || 0) + 1;
    });

    console.log(`Total Leads Assigned in Feb: ${leads.length}`);

    // 2. Map to Users
    let ghostLeads = 0;
    const ghostUsers = [];

    // Get all users who received leads
    const userIds = Object.keys(leadCounts);

    // Limits batch size if needed, but for <1000 users it's fine
    const { data: users } = await supabase.from('users').select('id, name, email').in('id', userIds);

    for (const u of users) {
        if (!manualEmails.includes(u.email)) {
            const count = leadCounts[u.id];
            ghostLeads += count;
            ghostUsers.push({ name: u.name, email: u.email, leads: count });
        }
    }

    ghostUsers.sort((a, b) => b.leads - a.leads);

    console.log(`\nResults:`);
    console.log(`- Leads to Verified Manual List: ${leads.length - ghostLeads}`);
    console.log(`- Leads to GHOSTS (Not on list): ${ghostLeads}`);

    console.log('\n--- TOP 10 GHOSTS ---');
    console.table(ghostUsers.slice(0, 10));

})();
