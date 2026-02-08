
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

// LEADS DATA (Batch 2 - Next ~100 Leads)
const leadsData = [
    { name: 'Jayrajsinh Mori', phone: '7874438788', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Alfaj Juneja', phone: '9274973224', city: '691732012727', source: 'New chirag campaing (ig)' },
    { name: 'બજાણીયા કપિલ ભાઈ', phone: '7861821292', city: 'Koo', source: 'New chirag campaing (ig)' },
    { name: 'Akshay', phone: '6351475532', city: 'DAHOD.', source: 'New chirag campaing (ig)' },
    { name: 'Rajput Natubha', phone: '9106359885', city: 'Patan', source: 'New chirag campaing (ig)' },
    { name: '~KING OF PARMAR~', phone: '7567692798', city: 'Nada', source: 'New chirag campaing (ig)' },
    { name: 'Barot Amit', phone: '6354064928', city: 'Gandhinagar', source: 'New chirag campaing (ig)' },
    { name: 'CHAUHAN Vishnu', phone: '7041008578', city: 'Dholka', source: 'New chirag campaing (ig)' },
    { name: 'فيضان', phone: '6356301619', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: '𝚅𝙸𝚂𝙷𝚄✯࿐GJ❸➍', phone: '8849524954', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Sunil', phone: '9638076144', city: 'Surendernagar', source: 'New chirag campaing (ig)' },
    { name: 'Kaliya Chamka', phone: '6263065188', city: 'Jhabua', source: 'New chirag campaing (ig)' },
    { name: 'Sonara dinesh', phone: '9173475678', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'પપ્પુ... હઠીલા', phone: '9726801573', city: 'Paup', source: 'New chirag campaing (ig)' },
    { name: 'll  Vipul_ raider', phone: '9879534384', city: 'Vipul Bhai', source: 'New chirag campaing (ig)' },
    { name: 'mehul.artist.m.p.chamunda..', phone: '9265878922', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: '_@hir_aadarsh_', phone: '9724225782', city: 'Hamuva', source: 'New chirag campaing (ig)' },
    { name: 'Raj Mistri', phone: '9408346846', city: 'Hi', source: 'New chirag campaing (ig)' },
    { name: 'ɪᴛᴀʟɪʏᴀ ᴅᴀᴋsʜ', phone: '9725396063', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Vaghasiya Hemish', phone: '9879857780', city: 'ahemdabad', source: 'New chirag campaing (ig)' },
    { name: 'Zala Lalasih', phone: '9723750920', city: 'Agartala', source: 'New chirag campaing (ig)' },
    { name: 'Rahim Nakani', phone: '9925748549', city: 'Pipar tha kalawad Jamnagar', source: 'New chirag campaing (ig)' },
    { name: 'Mukesh', phone: '9712927751', city: 'Tharad', source: 'New chirag campaing (ig)' },
    { name: 'Parmar', phone: '9510598752', city: 'Patan', source: 'New chirag campaing (ig)' },
    { name: 'Barad Nitin', phone: '9274319616', city: 'Gir Somnath', source: 'New chirag campaing (ig)' },
    { name: 'Tanu___DJ_JOKER', phone: '8320047889', city: 'Pradip', source: 'New chirag campaing (ig)' },
    { name: 'Kajalba Jadeja', phone: '9875060267', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'VIPULBHAI Barjod', phone: '9099814028', city: 'Jayesh', source: 'New chirag campaing (ig)' },
    { name: 'Raju. Vahoniya', phone: '9687478496', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'Talpada Jignesh', phone: '8780526749', city: 'Nadiad', source: 'New chirag campaing (ig)' },
    { name: 'Rajput', phone: '8469167921', city: 'Student', source: 'New chirag campaing (ig)' },
    { name: 'DAMOR PRATAP', phone: '9913841972', city: 'DAHOD', source: 'New chirag campaing (ig)' },
    { name: 'કીરીટ ડાભી', phone: '9173211832', city: 'Kirit', source: 'New chirag campaing (ig)' },
    { name: 'K Vaghela', phone: '7201980700', city: 'Jetpur', source: 'New chirag campaing (ig)' },
    { name: '3.50', phone: '9558907397', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'Rohitji Thakor', phone: '9099248374', city: 'Gandhinagar', source: 'New chirag campaing (ig)' },
    { name: 'Paresh Kamaliya', phone: '9924867150', city: 'Gorakhamadhi', source: 'New chirag campaing (ig)' },
    { name: 'Prakash Parmar', phone: '9510914360', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Chaudhary Shailesh', phone: '9714875463', city: 'Tharad', source: 'New chirag campaing (ig)' },
    { name: 'Kaushik-143', phone: '6353197589', city: 'Valsad', source: 'New chirag campaing (ig)' },
    { name: '𝕍𝙰𝙽𝚉𝙰𝚁𝙰', phone: '9898807732', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Jigs Chauhan', phone: '9033323181', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'રામજી આહિર', phone: '9913037692', city: 'Kachchh', source: 'New chirag campaing (ig)' },
    { name: 'Shivam Parmar', phone: '9510321020', city: 'Ahmadabad', source: 'New chirag campaing (ig)' },
    { name: 'Mansi Patel', phone: '9426309697', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'ANNU_OFFICIAL', phone: '7069110187', city: 'ᴅᴀʜᴏᴅ', source: 'New chirag campaing (ig)' },
    { name: 'miss shumi rtw 107', phone: '9327007438', city: 'Godhra', source: 'New chirag campaing (ig)' },
    { name: 'Pradip Gohil', phone: '7046931109', city: 'Gadhada', source: 'New chirag campaing (ig)' },
    { name: 'Palas Sanjay Bhai', phone: '9081729641', city: 'Godhra', source: 'New chirag campaing (ig)' },
    { name: 'જાદવ સિધ્ધરાજસિહ. બનાસકાંઠાન', phone: '9328641204', city: 'જાદવ.', source: 'New chirag campaing (ig)' },
    { name: 'hitesh patel', phone: '9510704748', city: 'Mahisagar', source: 'New chirag campaing (ig)' },
    { name: 'HITESH', phone: '9773191137', city: 'HITESH BHIL', source: 'New chirag campaing (ig)' },
    { name: 'Jig\'s Gohel', phone: '6351302441', city: 'Anand', source: 'New chirag campaing (ig)' },
    { name: 'Ramesh Parmar', phone: '7567669858', city: 'thara', source: 'New chirag campaing (fb)' },
    { name: '___S--R___', phone: '9974181272', city: '好吧999', source: 'New chirag campaing (ig)' },
    { name: 'Mr.Shiva-124', phone: '9824898890', city: 'Jamnagar', source: 'New chirag campaing (ig)' },
    { name: 'Hitesh parmar', phone: '9624851032', city: 'Anand', source: 'New chirag campaing (ig)' },
    { name: 'parash bochiya', phone: '8160675686', city: 'રામપુરા થરાદ', source: 'New chirag campaing (ig)' },
    { name: 'Aravid Bhai Heemat Bhai Tank', phone: '8758546381', city: 'savar kundla', source: 'New chirag campaing (fb)' },
    { name: 'Rajput Bhavesh', phone: '9723285871', city: 'Gir somnath', source: 'New chirag campaing (fb)' },
    { name: 'Kalpesh Rathod', phone: '7990581389', city: 'Kalpesh', source: 'New chirag campaing (ig)' },
    { name: 'Ankita Pandya', phone: '7383809567', city: 'vadodara', source: 'New chirag campaing (fb)' },
    { name: 'विपुल सथवारा', phone: '9974282041', city: 'Surendra nagar', source: 'New chirag campaing (ig)' },
    { name: 'Manoj Shiyal', phone: '9016552138', city: 'રરર', source: 'New chirag campaing (ig)' },
    { name: 'Popatji Thakor', phone: '9586597366', city: 'idar', source: 'New chirag campaing (fb)' },
    { name: 'Darshan Dhameliya', phone: '9712109363', city: 'Ahemdabad', source: 'New chirag campaing (ig)' },
    { name: 'Jignesh Thakor', phone: '8849480711', city: 'Thangadh', source: 'New chirag campaing (ig)' },
    { name: 'Mafabhai Prajapati', phone: '9913086245', city: 'Tharad', source: 'New chirag campaing (ig)' },
    { name: 'Brijesh Prajapati', phone: '9106767818', city: 'Dhrangadhra', source: 'New chirag campaing (fb)' },
    { name: 'M Chauhan', phone: '9574581560', city: 'gujarat', source: 'New chirag campaing (fb)' },
    { name: 'Hareshbai Ravat', phone: '9510679343', city: 'mahesana', source: 'New chirag campaing (fb)' },
    { name: 'Pravin Galchar', phone: '8347062731', city: 'Dhanera', source: 'New chirag campaing (ig)' },
    { name: 'Jodhani Lay', phone: '9712299597', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Mitesh Rabari', phone: '9662427049', city: 'Vadodara city', source: 'New chirag campaing (ig)' },
    { name: 'Bholu', phone: '7203804436', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'vishubha', phone: '9327366186', city: 'Vishyrajsinh', source: 'New chirag campaing (ig)' },
    { name: 'payal kukadiya', phone: '9173833111', city: 'Tankara', source: 'New chirag campaing (ig)' },
    { name: 'Nwab Baba Nwab', phone: '9687730421', city: 'Amreli', source: 'New chirag campaing (ig)' },
    { name: 'Bhavik', phone: '9924475885', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Umesh Bhabhor Umesh Bhabhor', phone: '9016380559', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'AR_THAKOR_9094', phone: '8849540481', city: 'મહેસાણા', source: 'New chirag campaing (ig)' },
    { name: 'R. A. V. I.', phone: '9737309190', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: '𝕾𝖆𝖓𝖏𝖆𝖞 𝕻𝖆𝖓𝖈𝖍𝖆𝖑', phone: '9427257902', city: 'Danta', source: 'New chirag campaing (ig)' },
    { name: 'Rahul Trivedi', phone: '9726235902', city: 'Unjha', source: 'New chirag campaing (fb)' },
    { name: 'jayraj', phone: '9725485305', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Asha Bhoi', phone: '9023488322', city: 'Dhesiya', source: 'New chirag campaing (ig)' },
    { name: 'Dalsukh Rathod', phone: '9825889981', city: 'Palitana', source: 'New chirag campaing (ig)' },
    { name: 'BambhNiya Rajesh B', phone: '9904659045', city: 'Gir somnath', source: 'New chirag campaing (ig)' },
    { name: 'Royel Kanudo', phone: '9099589163', city: 'Vavdi', source: 'New chirag campaing (ig)' },
    { name: 'Vishal', phone: '9274945864', city: 'વિશાલ', source: 'New chirag campaing (ig)' },
    { name: 'નરેન્દ્ર કુમાર તખાભાઇ', phone: '9023497068', city: 'ઠાકોર નરેન્દ્ર કુમાર', source: 'New chirag campaing (ig)' },
    { name: 'mr.munna __313', phone: '7984777507', city: 'Palanpur', source: 'New chirag campaing (ig)' },
    { name: 'Imran dubliya', phone: '9724701036', city: 'Palnpur', source: 'New chirag campaing (ig)' },
    { name: 'Shebaun chavada', phone: '9998703923', city: 'गांधीधाम', source: 'New chirag campaing (ig)' },
    { name: 'ram', phone: '9714627137', city: 'Junagadh', source: 'New chirag campaing (fb)' },
    { name: '0052', phone: '9316424050', city: 'Gujrat', source: 'New chirag campaing (ig)' },
    { name: ' Umesh', phone: '9316519275', city: 'Mandor', source: 'New chirag campaing (ig)' },
    { name: '𝙼𝚁 𝙹𝙰𝙲𝙺', phone: '8154838830', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Bharat Bharavad', phone: '7041125577', city: 'Gandhinagar', source: 'New chirag campaing (ig)' },
    { name: '𝐘𝐀𝐃𝐀𝐕', phone: '7487990698', city: 'Keshod', source: 'New chirag campaing (ig)' },
    { name: 'Soham Rathod', phone: '9537860657', city: 'Vansda', source: 'New chirag campaing (ig)' },
    { name: 'Naresh Thakor', phone: '9512897482', city: 'Bhiloda', source: 'New chirag campaing (ig)' },
    { name: 'SHRIMALI DHRUV', phone: '9586390177', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Laljibhai Parmar', phone: '9824065025', city: 'Khambhat ANAND', source: 'New chirag campaing (fb)' },
    { name: 'Hitesh Thakkar', phone: '9909210810', city: 'Thara', source: 'New chirag campaing (ig)' },
    { name: 'bareiya prakash', phone: '9512126916', city: 'Gujarat', source: 'New chirag campaing (fb)' },
    { name: 'Omdevsinh Sinh Rana', phone: '9773487898', city: 'Limbdi', source: 'New chirag campaing (fb)' },
    { name: '⇨ⱽᶤcķ𝓎.', phone: '9773452150', city: 'Vikram', source: 'New chirag campaing (ig)' },
    { name: 'Vivek Kariya', phone: '7878814320', city: 'Veraval', source: 'New chirag campaing (ig)' },
    { name: 'Pambhar Lavashik', phone: '6352610092', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'RAJVEER', phone: '9313909462', city: 'Godhra', source: 'New chirag campaing (ig)' },
    { name: 'ISHVAR..0786', phone: '6355231802', city: 'Sabarkantha', source: 'New chirag campaing (ig)' },
    { name: 'ગૌરાંગ પટેલ', phone: '9328455248', city: 'Hn ch t', source: 'New chirag campaing (ig)' },
    { name: 'Ashvin Chaudhary', phone: '9998551252', city: 'Dhanera', source: 'New chirag campaing (ig)' },
    { name: 'Vipul_C_Malotariya007', phone: '6353696188', city: 'Deesa', source: 'New chirag campaing (ig)' },
    { name: 'Parmar anjuben', phone: '9913024794', city: 'Kapadwanj', source: 'New chirag campaing (ig)' },
    { name: '𝐊 𝐈 𝐒 𝐇 𝐔 ➣', phone: '9313067680', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'NehaNileshVadgama', phone: '9638188748', city: 'Tatala', source: 'New chirag campaing (ig)' },
    { name: 'parmar  payal', phone: '9904278809', city: 'Dwarka', source: 'New chirag campaing (ig)' },
    { name: 'Nilesh J Lapasiya', phone: '9909844117', city: 'Mundra', source: 'New chirag campaing – 2 (ig)' },
    { name: 'मुसाफिर', phone: '9510204546', city: 'Bhuj', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Manish Dayra', phone: '6353043020', city: 'Pipalod', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Harsh Parmar', phone: '8160325490', city: 'Ahmedabad', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Ashvin Joja', phone: '7802079579', city: 'Tharad', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Ankit Kalsariya', phone: '9016380438', city: 'Surat', source: 'New chirag campaing – 2 (ig)' },
    { name: 'VAGHELA NIHAL', phone: '9737170866', city: 'Bayad', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Avani Pandya Joshi', phone: '7046162142', city: 'Rajkot', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Bharat Chauhan', phone: '7878785400', city: 'Kirch Jesar', source: 'New chirag campaing – 2 (ig)' },
    { name: 'Ramesh Pranami', phone: '9429811324', city: 'Vadodara', source: 'New chirag campaing – 2 (ig)' }
];

async function distribute() {
    console.log(`🚀 STARTING DISTRIBUTION OF BATCH 2 (${leadsData.length} LEADS) FOR TEAM ${TEAM_CODE}...`);

    const { data: team, error: tError } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .in('plan_name', ['starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost']);

    if (tError || !team || team.length === 0) {
        console.error("❌ NO ACTIVE TEAM MEMBERS FOUND! Aborting.", tError);
        return;
    }

    console.log(`✅ Active Members: ${team.length}`);
    let assignedCount = 0;

    for (let i = 0; i < leadsData.length; i++) {
        const lead = leadsData[i];
        const targetUser = team[i % team.length];

        // 1. Check Existence
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', lead.phone)
            .maybeSingle();

        const payload = {
            phone: lead.phone,
            name: lead.name,
            city: lead.city,
            source: lead.source,
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            // Force Update Dates to NOW so they appear on Top
            created_at: new Date().toISOString(),
            assigned_at: new Date().toISOString()
        };

        if (existing) {
            console.log(`.. Updating Lead ${lead.phone}`);
            await supabase.from('leads').update(payload).eq('id', existing.id);
        } else {
            await supabase.from('leads').insert(payload);
        }

        assignedCount++;

        // 2. Notification
        await supabase.from('notifications').insert({
            user_id: targetUser.id,
            title: 'New Lead Assigned',
            message: `Lead: ${lead.name}`,
            type: 'lead_assignment'
        });
    }

    console.log(`\n🎉 BATCH 2 DONE! Processed: ${assignedCount} leads.`);
}

distribute();
