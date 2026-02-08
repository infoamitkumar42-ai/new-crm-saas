
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const rawData = `others	Tejash Chauhan	p:+918141442417	Devaghd baria
student	ગૌરાંગ પટેલ	p:+919328455248	Hn ch t
others	Ashvin Chaudhary	p:+919998551252	Dhanera
job_person	Vipul_C_Malotariya007	p:6353696188	Deesa
housewife	Parmar anjuben	p:9913024794	Kapadwanj
others	𝐊 𝐈 𝐒 𝐇 𝐔 ➣	p:+919313067680	Ahmedabad
housewife	NehaNileshVadgama	p:9638188748	Tatala
housewife	parmar  payal	p:919904278809	Dwarka
student	Soyab Darbar	p:+919870074595	ahemdabad
housewife	Sweta Chauhan	p:+919601848618	Ahmedabad
others	Paresh Bhai Kanabar	p:+919924570956	una
others	Kevin Ghodasara	p:+917874790557	pikhor
job_person	Rohit Thakor	p:+918758231553	Palanpur
job_person	Virendra Rathva	p:+917016263651	Jetpur Pavi
student	DIPAKSINH  ZALA	p:+918799508253	Kalol
business_owner	Jay Goga Reference	p:+919998557161	Surat
others	Suresh	p:9724801248	Tharad
student	𝓅Ⓡυ𝕊н𝐓ｉ	p:+916351391918	Rajkot
others	dipakbhai m.sagar	p:+917405560500	morbi . hadamatiya
others	Virat Prajapati	p:+918799328383	Botad
job_person	Raju desai	p:+919104068662	Sabarmati, ahmedabad
job_person	Jaydip Solanki	p:+919586389185	Ahmedabad
student	Mehul Parmar	p:+919265245427	Vadodara, Gujarat
job_person	Akash Parmar	p:+919925759160	Baroda
job_person	HK Relax	p:7622947663	Mahuva
housewife	Keyuri Patel	p:+919909277458	Vadodara
housewife	Roshni Patel	p:+918866468077	Surat
job_person	Nilesh Gusai	p:+919427818154	Bhuj
housewife	Lata Amrutbhai	p:9265404759	Ahmedabad
housewife	Komal Shiyani	p:+918347295955	Surat
student	Hetalvegad	p:9574133536	Bhavnagar
student	raju_creation__08	p:+919016507832	Rauj
housewife	Asha Yogi	p:+916353558660	Mahesana
student	Maheas Maheas	p:+919978293801	મોરબી
student	Jitrajsinh Rajendrasinh Gohil	p:+919624567454	Gariyadhar
job_person	Jignesh  N. Patel	p:9173902268	Ahmedabad Gujarat
student	jay	p:+918469851562	Surat
housewife	Jugal Patel	p:+919998985933	Unjha
student	Hi	p:+918866101683	ArifJat
business_owner	VB	p:+918128487117	KHEDA
business_owner	Jαgdiѕh Gαjjαr	p:+919879970888	Palanpur
student	Prince Munnu	p:+919925668718	Bhavanagar
job_person	apps_ king	p:+917600437507	Amadavad
business_owner	Prakash Mithpara	p:+919104552983	Surendranagar
others	Vishal Raval	p:+919313564606	Kadi
others	Vinay Chavda	p:9662170855	Kutch
others	Jigar Ja Ratĥoď	p:+919328298491	Datrai
job_person	Jadeja Pruthavirajsinh	p:+916355680762	Bhuj
housewife	Khushbu	p:+919724212639	Ahmedanad
housewife	Virali shihora	p:8401944047	Surat
student	Vishnu Chaudhari	p:+918320202488	ℂ𝕙𝕒𝕖𝕞𝕓𝕦𝕧𝕒 𝔹𝕙𝕒𝕓𝕙𝕒𝕣 𝔾𝕦𝕛𝕣𝕒𝕥
housewife	Nanda Parmar	p:+917383526338	Vadodara
others	RP__	p:+919727556133	Harij
business_owner	Pradipsinh Vaghela	p:+919825028082	Ahmedabad
job_person	Aman mali	p:+919510238889	Vadodara
housewife	Anjali Harsh shah	p:+917096710407	Ahmedabad
housewife	Doli Kotak	p:9724715097	Rajkot
housewife	kคຖคຖi.	p:8140298721	Surat
others	Nisha Dobaria	p:+918980042709	Surat
others	Bharat Parmar	p:968786258	Bhatiya
housewife	Umang Bhanushali	p:+919106974167	Unjha
housewife	꧁༒☬!સ્ટેટ ઓફ રામાધણી!☬༒꧂	p:+919601916383	Patna
student	desai _shakshi	p:9724673646	Gandhinagar
housewife	Aarti Solanki	p:7405915480	Surat gujrat
housewife	Minal Patel	p:+917874864296	Ahmedabad
housewife	Swati Joshi	p:+919427499633	Ahmedabad
business_owner	Prabhu Lal Regar	p:+919680922519	Bhilwara
business_owner	Vaibhavi Raval	p:+917600659402	Vadodara
others	Mayur Umavanshi	p:+919979973848	Ahmedabad
housewife	Sarvan Thakur Thakur	p:+918849550498	ભાભર
others	Rahul Anand	p:+919898718745	Khambhat
job_person	G.J.BHARWAD	p:+919979255582	Ahmedabad
job_person	Kush@l__P@rm@r	p:+918347915291	mangrol
student	Jay Sikoter	p:+917984502864	જેતપુર
housewife	Vaghela Rasila	p:+919016286774	Rajkot
housewife	Js Patel	p:+917096563688	Junagadh
housewife	Priya Shingala	p:+919727784004	Kamrej
others	RAKESH LADHEL..	p:+919173161790	Gandhinagar
housewife	Ekta Patel	p:+919979427233	Nadiad
housewife	Rami minaxi dharmendara bhai	p:9913363565	Gandhinagar Gujarat
business_owner	Manish.Baldaniya	p:+917434927424	Rajkot
others	Tofik Sarvadi	p:+917600844586	junagadh
job_person	Jignesh Maheta	p:+918401156732	Rajkot
job_person	BHAVADIP Avaiya	p:+918866181406	Ahmedabad`;

async function crossVerify() {
    console.log("🕵️‍♂️ CROSS-VERIFYING YOUR LIST AGAINST DATABASE...");

    const rows = rawData.split('\n');
    const results = [];
    let missingFromDb = 0;
    let unassignedInDb = 0;
    let assignedCorrectly = 0;

    for (const r of rows) {
        const parts = r.split('\t');
        if (parts.length < 3) continue;

        const name = parts[1];
        let phone = parts[2].replace('p:', '').replace('+91', '').trim();
        phone = phone.replace(/[^0-9]/g, '');

        // Search in Database
        const { data: lead } = await supabase.from('leads')
            .select('id, status, assigned_to, source, name')
            .eq('phone', phone)
            .limit(1)
            .maybeSingle();

        if (!lead) {
            missingFromDb++;
            results.push({ Name: name, Phone: phone, Status: '❌ MISSING FROM SYSTEM' });
        } else if (!lead.assigned_to) {
            unassignedInDb++;
            results.push({ Name: name, Phone: phone, Status: '⚠️ SYSTEM HAS IT BUT UNASSIGNED', Source: lead.source });
        } else {
            assignedCorrectly++;
            // Optional: You can list assigned one too if needed
            // results.push({ Name: name, Phone: phone, Status: '✅ ASSIGNED', Source: lead.source });
        }
    }

    console.log(`\n📊 CROSS-VERIFY SUMMARY:`);
    console.log(`✅ Assigned Properly: ${assignedCorrectly}`);
    console.log(`⚠️ Unassigned in DB: ${unassignedInDb}`);
    console.log(`❌ Missing Entirely: ${missingFromDb}`);

    if (results.length > 0) {
        console.log("\n🚩 DETAILED ISSUES (Missing or Unassigned):");
        console.table(results);
    } else {
        console.log("\n🎉 ALL GOOD! All leads in your list are already assigned in the system.");
    }
}

crossVerify();
