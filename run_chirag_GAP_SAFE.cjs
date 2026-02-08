
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

// GAP LIST (~200 Leads missed in the middle)
const gapLeads = [
    { name: 'Jignesh Parma', phone: '7990571922', city: 'Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'gnasva', phone: '7016599877', city: 'Port Blair', source: 'New chirag campaing (ig)' },
    { name: 'Navalsinh', phone: '9316599320', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'Hardik Suthar', phone: '8320566532', city: 'Himmatnagar', source: 'New chirag campaing (ig)' },
    { name: 'MR SMIT GHOGHALIYA', phone: '9016592584', city: 'Dwarka', source: 'New chirag campaing (ig)' },
    { name: 'Navinchaudhary', phone: '9157281262', city: 'Tharad', source: 'New chirag campaing (ig)' },
    { name: 'Dhaval Dodiya', phone: '8160122436', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'Mahesh Patosaniya', phone: '8780603391', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'maahibaba', phone: '9909685217', city: 'Bhimnath', source: 'New chirag campaing (ig)' },
    { name: 'Geeta parmar', phone: '9724972359', city: 'Devbhoomi dwarka', source: 'New chirag campaing (ig)' },
    { name: 'Mayank Gorwadiya', phone: '9137638901', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Akshay Ratod', phone: '9462509155', city: 'Amdaabad', source: 'New chirag campaing (ig)' },
    { name: 'Pravin thakor', phone: '9723933944', city: 'Palanpur', source: 'New chirag campaing (ig)' },
    { name: 'Kamlesh Patel', phone: '9904001229', city: 'Amadavad', source: 'New chirag campaing (ig)' },
    { name: 'Sureshbhai Masrhuji Dhrangi', phone: '6352809681', city: 'Palnapur', source: 'New chirag campaing (ig)' },
    { name: 'Harish', phone: '9173317672', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'SanjayKumar ravat', phone: '9712549108', city: 'Limkheda', source: 'New chirag campaing (ig)' },
    { name: 'Meet Vekariya', phone: '8200331736', city: 'Jetpur', source: 'New chirag campaing (ig)' },
    { name: 'Ashok', phone: '7575829698', city: 'Tahrad', source: 'New chirag campaing (ig)' },
    { name: 'Pruthvi Aayar', phone: '7861954080', city: 'Lathi', source: 'New chirag campaing (ig)' },
    { name: 'Ajay Pargi', phone: '9327832517', city: 'meghraj', source: 'New chirag campaing (ig)' },
    { name: 'Waghela Mayur', phone: '9586956658', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Manoj Doriya', phone: '9913865202', city: 'Amdabad', source: 'New chirag campaing (ig)' },
    { name: 'Parmar Naresh', phone: '9687228915', city: 'Gujrat', source: 'New chirag campaing (ig)' },
    { name: 'Mosinkhan', phone: '9723762682', city: 'Junagadhb', source: 'New chirag campaing (ig)' },
    { name: 'OM', phone: '9978533003', city: 'Yes', source: 'New chirag campaing (ig)' },
    { name: 'ྀིशिव सदा सहायते ྀི', phone: '8469792279', city: 'Nisw', source: 'New chirag campaing (ig)' },
    { name: 'Brijesh', phone: '8128638283', city: 'bhuj', source: 'New chirag campaing (fb)' },
    { name: 'Tejash Chauhan', phone: '8141442417', city: 'Devaghd baria', source: 'New chirag campaing (ig)' },
    { name: 'jay hanumanji', phone: '9824905898', city: 'Raval', source: 'New chirag campaing (ig)' },
    { name: 'Paras Parekh', phone: '9687877875', city: 'SAMKHIYALI', source: 'New chirag campaing (fb)' },
    { name: 'Jaydip hirani', phone: '9099454615', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'Chirag Gohil', phone: '9909055990', city: 'Rajkot', source: 'New chirag campaing (fb)' },
    { name: 'Ramoliya pratik', phone: '8141268634', city: 'Jetpur', source: 'New chirag campaing (fb)' },
    { name: 'Zala Ramsinh', phone: '9624148590', city: 'Mahemdavad', source: 'New chirag campaing (fb)' },
    { name: 'Ramesh Mali', phone: '9428196502', city: 'ગંભીરપુરા', source: 'New chirag campaing (fb)' },
    { name: 'Jayesh', phone: '9727581524', city: 'Amadavad', source: 'New chirag campaing (fb)' },
    { name: 'Kush@l__P@rm@r', phone: '8347915291', city: 'mangrol', source: 'New chirag campaing (ig)' },
    { name: 'Jay Sikoter', phone: '7984502864', city: 'જેતપુર', source: 'New chirag campaing (ig)' },
    { name: 'Vaghela Rasila', phone: '9016286774', city: 'Rajkot', source: 'New chirag campaing (fb)' },
    { name: 'Js Patel', phone: '7096563688', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'Priya Shingala', phone: '9727784004', city: 'Kamrej', source: 'New chirag campaing (ig)' },
    { name: 'RAKESH LADHEL..', phone: '9173161790', city: 'Gandhinagar', source: 'New chirag campaing (ig)' },
    { name: 'Ekta Patel', phone: '9979427233', city: 'Nadiad', source: 'New chirag campaing (ig)' },
    { name: 'Rami minaxi dharmendara bhai', phone: '9913363565', city: 'Gandhinagar Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'Manish.Baldaniya', phone: '7434927424', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Tofik Sarvadi', phone: '7600844586', city: 'junagadh', source: 'New chirag campaing (fb)' },
    { name: 'Jignesh Maheta', phone: '8401156732', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'BHAVADIP Avaiya', phone: '8866181406', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Miss you mummy', phone: '8980397391', city: 'Baroda', source: 'New chirag campaing (ig)' },
    { name: 'Nilesh Chavda Nilesh', phone: '6352511618', city: 'Hhhhhbb', source: 'New chirag campaing (ig)' },
    { name: 'ᑭOOᒍᗩ', phone: '7778977830', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Viram dodiya', phone: '6353075298', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Zohra kadri mohmmad hussain', phone: '9537751098', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Maheshwari Shah', phone: '9737821294', city: 'Navsari', source: 'New chirag campaing (ig)' },
    { name: 'પટેલ ભાઈ', phone: '7984087051', city: 'Rajkot 360004', source: 'New chirag campaing (ig)' },
    { name: 'Bharti Sojitra', phone: '9909263808', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'shivamjoshi', phone: '8758487611', city: 'Bhachau', source: 'New chirag campaing (ig)' },
    { name: 'Mamta Patel', phone: '9904855909', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Raj Dudhrejiya', phone: '8160998997', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'કાનો રાધા', phone: '7862987573', city: 'Hitesh', source: 'New chirag campaing (ig)' },
    { name: 'Patel Rohit', phone: '9574249895', city: 'Sardarpur', source: 'New chirag campaing (ig)' },
    { name: 'Dasharth Parma', phone: '9925108676', city: 'Ahmedabad', source: 'New chirag campaing (fb)' },
    { name: 'GOVIND SHURESH RABARI', phone: '8488894893', city: 'Vadodara', source: 'New chirag campaing (fb)' },
    { name: 'Punam Baa', phone: '9712813442', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Govind Rana', phone: '9265851613', city: 'Gujarat kapasiya', source: 'New chirag campaing (ig)' },
    { name: 'im_Vijay_502', phone: '9913506588', city: '9913506588', source: 'New chirag campaing (ig)' },
    { name: 'Bhartiben Rajeshkumar Jasani', phone: '7359599799', city: 'Jamnagar', source: 'New chirag campaing (ig)' },
    { name: 'Nirav Patel', phone: '9510541129', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'mis rami', phone: '8160806927', city: 'Vakaner', source: 'New chirag campaing (ig)' },
    { name: 'Rita Ben', phone: '9773041338', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Priyanka dabhi', phone: '9879094725', city: 'Khadbrahma', source: 'New chirag campaing (ig)' },
    { name: 'Dharmendra Solanki', phone: '7046229248', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Chetan Metya Chetan Metya', phone: '6359382950', city: 'Ggy', source: 'New chirag campaing (ig)' },
    { name: 'જયેશ પરમાર', phone: '9265199229', city: '242886', source: 'New chirag campaing (fb)' },
    { name: 'Gopal Bharwad', phone: '8487986818', city: 'Palitana', source: 'New chirag campaing (ig)' },
    { name: 's p baraiya', phone: '8141229424', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Vishal Thakor Vishal Thakor', phone: '8780475691', city: 'Vishal', source: 'New chirag campaing (ig)' },
    { name: 'Hiru', phone: '9512825594', city: 'Pindakhai', source: 'New chirag campaing (ig)' },
    { name: 'Dipa Chandarana', phone: '9377311668', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Naresh Prajapati', phone: '7048381662', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: ',mayur  rajput raj meldi', phone: '8758211815', city: 'Halol', source: 'New chirag campaing (ig)' },
    { name: 'Somabhai Raygor', phone: '9313658204', city: 'આશાબેન સોમાભાઈ', source: 'New chirag campaing (ig)' },
    { name: 'Dhara Sathwara', phone: '9714978232', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'seju parmar', phone: '6355247934', city: 'Tana', source: 'New chirag campaing (ig)' },
    { name: 'Pragna Vora', phone: '8433551898', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'દશરથભાઈ', phone: '9081720298', city: 'ડૌરીયા', source: 'New chirag campaing (ig)' },
    { name: 'Juhi Pradip Makwana', phone: '9328619166', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Guddi Guddi', phone: '6355774206', city: 'Cg Road', source: 'New chirag campaing (ig)' },
    { name: 'Shital Prajapati', phone: '9512405564', city: 'surat', source: 'New chirag campaing (fb)' },
    { name: 'Smeet Patel', phone: '9409218149', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Munafkhan Pathan', phone: '9925119558', city: 'Y', source: 'New chirag campaing (ig)' },
    { name: 'જય મેલડી માં', phone: '9974766439', city: 'Dhanera', source: 'New chirag campaing (ig)' },
    { name: 'Shilesah Shilesh', phone: '7359613523', city: 'Bicholim', source: 'New chirag campaing (ig)' },
    { name: 'Aarti Pranami', phone: '9099907955', city: 'Adipur', source: 'New chirag campaing (fb)' },
    { name: 'kajalvansh', phone: '6353826540', city: 'Kodinar', source: 'New chirag campaing (ig)' },
    { name: 'ભુપત ભારાઈ', phone: '9106415201', city: '9106415201', source: 'New chirag campaing (ig)' },
    { name: 'Komal Shiyani', phone: '8347295955', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Hetalvegad', phone: '9574133536', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'raju_creation__08', phone: '9016507832', city: 'Rauj', source: 'New chirag campaing (ig)' },
    { name: 'Asha Yogi', phone: '6353558660', city: 'Mahesana', source: 'New chirag campaing (ig)' },
    { name: 'Maheas Maheas', phone: '9978293801', city: 'મોરબી', source: 'New chirag campaing (ig)' },
    { name: 'Leena N Patel', phone: '9638869527', city: 'Bayad', source: 'New chirag campaing (ig)' },
    { name: 'Desai Krishna', phone: '9586579262', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Hetal Chaudhari', phone: '8141077253', city: 'Zankhvav', source: 'New chirag campaing (ig)' },
    { name: 'Panna Patel', phone: '6353510032', city: 'Vijapur', source: 'New chirag campaing (ig)' },
    { name: 'Vasava Manish', phone: '8140747035', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Renu Rajesh Mehta', phone: '9374725220', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'MD', phone: '9409156202', city: 'Mahuva', source: 'New chirag campaing (ig)' },
    { name: 'Purva patel', phone: '9106069259', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'urmilaba d hudad', phone: '9265762674', city: 'Rajkot Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'Parvati ahir', phone: '9512509484', city: 'Anjar', source: 'New chirag campaing (ig)' },
    { name: 'Komal Panchal', phone: '9725067412', city: 'https://www.google.com/search?q=xxxxl+shirts+2024&oq=xxxx&gs_lcrp=EgZjaHJvbWUqCggDEAAYsQMYgAQyBggAEEUYOTINCAEQABiDARixAxiABDINCAIQABiDARixAxiABDIKCAMQABixAxiABDIKCAQQABixAxiABDINCAUQABiDARixAxiABDIKCAYQABixAxiABDIKCAcQABixAxiABDIHCAgQABiABDINCAkQABiDARixAxiABDIQCAoQABiDARixAxiABBiKBTIKCAsQABixAxiABDINCAwQABiDARixAxiABDINCA0QABiDARixAxiABDINCA4QABiDARixAxiABNIBCDg4OTBqMGo0qAICsAIB8QVRkO2R0tqpOfEFUZDtkdLaqTk&client=ms-android-samsung-ss&sourceid=chrome-mobile&ie=UTF-8', source: 'New chirag campaing (ig)' },
    { name: 'Rathod King', phone: '6351328263', city: 'Sardargh', source: 'New chirag campaing (ig)' },
    { name: 'm_A_makrani', phone: '8153013575', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'Bina Mori', phone: '9904490688', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Vinita vadaliya', phone: '8488091208', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Jyoti Pawar - Khanvilkar', phone: '9727819954', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Anita Patel', phone: '8780921878', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: '@k@sh ki kir@n', phone: '9023313218', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Deep Joshi', phone: '9327182391', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'Sima Bhatesa', phone: '9979246209', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'kishuu_3010', phone: '8980098223', city: 'Paradise kudalmal Madina 62', source: 'New chirag campaing (ig)' },
    { name: '@od__nishu__9514', phone: '7984698158', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Anjali Harsh shah', phone: '7096710407', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Doli Kotak', phone: '9724715097', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'kคຖคຖi.', phone: '8140298721', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Nisha Dobaria', phone: '8980042709', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Bharat Parmar', phone: '968786258', city: 'Bhatiya', source: 'New chirag campaing (ig)' },
    { name: 'Umang Bhanushali', phone: '9106974167', city: 'Unjha', source: 'New chirag campaing (ig)' },
    { name: '꧁༒☬!સ્ટેટ ઓફ રામાધણી!☬༒꧂', phone: '9601916383', city: 'Patna', source: 'New chirag campaing (ig)' },
    { name: 'desai _shakshi', phone: '9724673646', city: 'Gandhinagar', source: 'New chirag campaing (ig)' },
    { name: 'Aarti Solanki', phone: '7405915480', city: 'Surat gujrat', source: 'New chirag campaing (ig)' },
    { name: 'Minal Patel', phone: '7874864296', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Swati Joshi', phone: '9427499633', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Prabhu Lal Regar', phone: '9680922519', city: 'Bhilwara', source: 'New chirag campaing (ig)' },
    { name: 'Vaibhavi Raval', phone: '7600659402', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'ASMIT_DARBAR_1K', phone: '9601640608', city: 'Anand', source: 'New chirag campaing (ig)' },
    { name: 'jay__hinglaj___maa1', phone: '7575840098', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Ganesh Nagar', phone: '9313211373', city: 'Bhuj', source: 'New chirag campaing (ig)' },
    { name: 'Jadeja amarjeetsinh', phone: '7487960459', city: 'Gundala road gondal', source: 'New chirag campaing (ig)' },
    { name: 'dgdugd', phone: '7499332403', city: 'ઞટઠડડ', source: 'New chirag campaing (ig)' },
    { name: 'Aashik Rathva', phone: '9023365867', city: 'Chhota Udepur', source: 'New chirag campaing (ig)' },
    { name: 'Parmar Mukesh', phone: '7016768811', city: 'Gujara', source: 'New chirag campaing (ig)' },
    { name: 'Naresh Raval', phone: '7874241502', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'જય માંધાતા', phone: '9265904087', city: 'Dhandhalpur', source: 'New chirag campaing (ig)' },
    { name: 'll ..Royal_..Rathva..ll', phone: '7990175368', city: 'Ahmedabad', source: 'New chirag campaing (ig)' },
    { name: 'Vanzara Vishal', phone: '9265903131', city: 'Vagarota', source: 'New chirag campaing (ig)' },
    { name: 'રુહી ગજેરા', phone: '9313463176', city: 'પઞડઘઃદ', source: 'New chirag campaing (ig)' },
    { name: 'ARAB ARMAN', phone: '7984007371', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Hiteshkumar Dayaji Gehlot', phone: '7859890729', city: 'Palanpur', source: 'New chirag campaing (ig)' },
    { name: '!!_anu_sinh_chauhan_1706_!!', phone: '8320979628', city: 'Hmt', source: 'New chirag campaing (ig)' },
    { name: 'N B Zala', phone: '9725086061', city: 'Surendra nagar', source: 'New chirag campaing (ig)' },
    { name: 'Ravji Makavana', phone: '8320251671', city: 'ઓજ', source: 'New chirag campaing (ig)' },
    { name: '|| Ɽ₳₮ⱧØĐ ₥łⱧłⱤ Ɽ.||', phone: '8401403879', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: '⃝⃟Mukesh⃝⃟', phone: '9978733991', city: 'Kukama', source: 'New chirag campaing (ig)' },
    { name: 'Darshan Majethiya', phone: '9558123834', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'gohil_2005', phone: '8799026075', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Mihir Chaudhary', phone: '6354956367', city: 'Mahesana', source: 'New chirag campaing (ig)' },
    { name: '⇝ꭱà𝚖à𝕕んà𝙣ῖ⇝', phone: '9313774963', city: 'Samsherpura', source: 'New chirag campaing (ig)' },
    { name: 'Mr Vraj', phone: '9714246002', city: 'Vraj maisuriya', source: 'New chirag campaing (ig)' },
    { name: 'Madhvi akbari', phone: '6352683035', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Dinesh Kumar b luhar', phone: '8866625257', city: 'Jamnagar Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'Dipali Vyas', phone: '9925660579', city: 'Rajpipla', source: 'New chirag campaing (ig)' },
    { name: 'Vikrambhaib822@gmail.com', phone: '8758368839', city: 'Vilma', source: 'New chirag campaing (ig)' },
    { name: 'Kavita aakash', phone: '8799924671', city: 'Surat Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'sejuuuu', phone: '9023908379', city: 'Bilimora', source: 'New chirag campaing (ig)' },
    { name: 'Solanki Sumit', phone: '9924094867', city: 'Bayad', source: 'New chirag campaing (ig)' },
    { name: 'mrs_shingala', phone: '8140603851', city: 'Amdavad', source: 'New chirag campaing (ig)' },
    { name: '尺ɪÐнΛ௱', phone: '7041048348', city: 'Dhoraji', source: 'New chirag campaing (ig)' },
    { name: '𝔻𝕒𝕣𝕛𝕚 𝔻𝕒𝕣𝕤𝕙𝕒𝕟', phone: '7069742616', city: 'Mujpur', source: 'New chirag campaing (ig)' },
    { name: 'jaydiip_dabhi', phone: '6359415667', city: 'Hjd', source: 'New chirag campaing (ig)' },
    { name: 'rajput__mahavir._', phone: '6352302891', city: '1', source: 'New chirag campaing (ig)' },
    { name: 'Vasu Dalvaniya', phone: '9574199539', city: 'Palanpur banaskantha', source: 'New chirag campaing (ig)' },
    { name: 'Desai Kamlesh', phone: '9408995277', city: 'Subir', source: 'New chirag campaing (ig)' },
    { name: 'Thakorlaxmi', phone: '7016989919', city: 'Gujarat', source: 'New chirag campaing (ig)' },
    { name: 'Rajeshkidesha Rajeshkidesha', phone: '9687192977', city: 'dhokadava', source: 'New chirag campaing (fb)' },
    { name: 'Dhaval Mehta', phone: '8980681800', city: 'Anjar', source: 'New chirag campaing (ig)' },
    { name: 'jay goga', phone: '7016465103', city: 'Palak rabari', source: 'New chirag campaing (ig)' },
    { name: 'Vanaliya Shailesh', phone: '9727149938', city: 'Botad', source: 'New chirag campaing (ig)' },
    { name: 'Garaiya bhavna m.', phone: '9898933236', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Rahulsinh Solanki', phone: '7096754057', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Sanghani Prakash', phone: '7990213242', city: 'Jamnagar', source: 'New chirag campaing (fb)' },
    { name: 'Bhil dhiraj', phone: '7201941860', city: 'Vijapur', source: 'New chirag campaing (ig)' },
    { name: 'Vikram', phone: '9714991897', city: 'Kheralu', source: 'New chirag campaing (ig)' },
    { name: 'Thakor Shaileshb', phone: '9638089320', city: 'Bhuj', source: 'New chirag campaing (ig)' },
    { name: 'दिपेश भेदा', phone: '8980267865', city: 'Gujarat', source: 'New chirag campaing (fb)' },
    { name: 'A A Y U S H  ࿐', phone: '9327504920', city: 'Halvad', source: 'New chirag campaing (ig)' },
    { name: 'Parmar Yuvraj', phone: '6355853437', city: 'Talod', source: 'New chirag campaing (ig)' },
    { name: 'Hemang', phone: '9898181865', city: 'Radhanpur', source: 'New chirag campaing (ig)' },
    { name: 'Chirag Bapu Rathod', phone: '8140840797', city: 'Keda', source: 'New chirag campaing (ig)' },
    { name: 'Manvi rathod', phone: '6352546222', city: 'Botad', source: 'New chirag campaing (ig)' },
    { name: 'TadviJashukumar', phone: '6354194784', city: 'Rajpipla', source: 'New chirag campaing (ig)' },
    { name: 'Royal devipujak', phone: '9909954959', city: 'Dhaboi', source: 'New chirag campaing (ig)' },
    { name: 'HARPALSINH __1172', phone: '6351551172', city: 'India', source: 'New chirag campaing (ig)' },
    { name: 'OM', phone: '9974000001', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Himat Sarvaiya', phone: '7041153744', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Karan gohel', phone: '9727958732', city: 'ભાવનગર', source: 'New chirag campaing (ig)' },
    { name: 'Gujarsing Rathva', phone: '9327494073', city: 'Gujarsing', source: 'New chirag campaing (ig)' },
    { name: 'Kalpesh Katara', phone: '9251286626', city: 'Kalpesh', source: 'New chirag campaing (ig)' },
    { name: 'paras dholakiya', phone: '7041882402', city: 'જસદણ', source: 'New chirag campaing (ig)' },
    { name: 'RONAk SOMAIYA', phone: '7874251281', city: '361006', source: 'New chirag campaing (ig)' },
    { name: 'Mitul Kher', phone: '9265821010', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'Tushar Sarvaiya', phone: '9106407078', city: 'Mahuva', source: 'New chirag campaing (ig)' },
    { name: 'Mandaviya Rakesh', phone: '9426201924', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'ẞSagar Charola 4', phone: '1910517324', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Sunil Thakor', phone: '8128133340', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Koli Amit Patel', phone: '9327647319', city: 'Dwarkadhish Ato Gerej', source: 'New chirag campaing (ig)' },
    { name: 'jayshree thakor', phone: '8160423571', city: '123456', source: 'New chirag campaing (ig)' },
    { name: 'Dhavalhirani Patidar', phone: '9723042160', city: 'Morbi', source: 'New chirag campaing (ig)' },
    { name: 'V._N_bana  320', phone: '9979960398', city: 'Solanki', source: 'New chirag campaing (ig)' },
    { name: 'ms_kãbir_ñehu..', phone: '8141479415', city: 'Mahuva', source: 'New chirag campaing (ig)' },
    { name: 'Parmar Rijavn', phone: '7069928791', city: 'Rajula', source: 'New chirag campaing (ig)' },
    { name: 'Fancy Font Generator - 𝕋𝕖𝕩𝕥 (༺𝐂𝐨𝐩𝐲 𝐚𝐧𝐝 𝐏𝐚𝐬𝐭𝐞༻)', phone: '7878719402', city: 'Deepak', source: 'New chirag campaing (ig)' },
    { name: 'Vipul Kukasiya', phone: '8469889118', city: 'Gandhinagar', source: 'New chirag campaing (ig)' },
    { name: 'HamirKumar Kantilal Parmar', phone: '9714787011', city: 'Patan', source: 'New chirag campaing (ig)' },
    { name: 'òffiçiàl_kàñudò_07', phone: '9998243925', city: 'Porbandar', source: 'New chirag campaing (ig)' },
    { name: 'Sachin Kumar', phone: '9979539238', city: 'HBV', source: 'New chirag campaing (ig)' },
    { name: 'Thakor Vijaythakor Vijay', phone: '9574274647', city: 'AHEMDABAD', source: 'New chirag campaing (ig)' },
    { name: 'Makvana Jaydipsinh', phone: '8320041281', city: 'Himatnagar', source: 'New chirag campaing (ig)' },
    { name: 'mithani mohammad aamir', phone: '9106416450', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'મનસૂખ', phone: '9714848779', city: 'Bhavnagar', source: 'New chirag campaing (ig)' },
    { name: 'adi__550__', phone: '9426814822', city: 'Aditya', source: 'New chirag campaing (ig)' },
    { name: 'Partap Solnaki', phone: '9054331815', city: '90453 31815', source: 'New chirag campaing (ig)' },
    { name: 'Prhkash Koliprhkashkoli', phone: '9023910719', city: 'Shyam Ji', source: 'New chirag campaing (ig)' },
    { name: 'M0hit Modi', phone: '9428984490', city: 'Amdavad', source: 'New chirag campaing (ig)' },
    { name: 'Raja_Khodal_Choru_08PN  માં', phone: '9978503436', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    { name: 'Nh Mevasi', phone: '7434978536', city: 'Godhra live city', source: 'New chirag campaing (ig)' },
    { name: 'Sabir Sameja', phone: '9033563403', city: 'Bhuj Kutch', source: 'New chirag campaing (ig)' },
    { name: 'mr_kartik_1204', phone: '7863051294', city: 'Sanand', source: 'New chirag campaing (ig)' },
    { name: 'Jay ', phone: '9106740749', city: 'Naroda', source: 'New chirag campaing (ig)' },
    { name: 'vipulsinh_rajput_8748', phone: '7043068493', city: 'Diyodar', source: 'New chirag campaing (ig)' },
    { name: 'Roshni Panchal', phone: '9824645446', city: 'Valsad', source: 'New chirag campaing (ig)' },
    { name: '...shiv_.!!', phone: '8238590110', city: 'ARVALLI', source: 'New chirag campaing (ig)' },
    { name: 'Jigar Rtd', phone: '7041167784', city: '123456788', source: 'New chirag campaing (ig)' },
    { name: 'રાઠોડ. રાકેશ ભાઈ.', phone: '9925829043', city: 'રાઠોઠ', source: 'New chirag campaing (ig)' },
    { name: 'd__k__007', phone: '8292447711', city: 'Rajkot', source: 'New chirag campaing (ig)' },
    { name: 'Rajdip Thakor', phone: '7284953421', city: 'Banas kantha', source: 'New chirag campaing (ig)' },
    { name: 'Jodhatar Rizwan', phone: '9714509596', city: 'Palitana', source: 'New chirag campaing (ig)' },
    { name: 'Radhe shyam', phone: '6354296532', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Dinesh sadabhai jadav', phone: '9974985183', city: 'Ahmedabad', source: 'New chirag campaing (fb)' },
    { name: '♛ DARBAR ♛', phone: '6351094197', city: 'Rakhiyal', source: 'New chirag campaing (ig)' },
    { name: 'Karishma Prajapati', phone: '8160217173', city: 'Sure', source: 'New chirag campaing (ig)' },
    { name: 'Subhash Halpati', phone: '8141795597', city: 'Navsari', source: 'New chirag campaing (ig)' },
    { name: 'Suresh Gesapra', phone: '8200096672', city: 'suresh', source: 'New chirag campaing (ig)' },
    { name: 'Alimamad jat', phone: '9586148904', city: 'Bhuj', source: 'New chirag campaing (ig)' },
    { name: 'રનજીત ગુજરીયા', phone: '7203873951', city: 'Ghfhfjvc', source: 'New chirag campaing (ig)' },
    { name: 'dahod on top', phone: '9313369537', city: 'Dahod', source: 'New chirag campaing (ig)' },
    { name: 'Chirag Sojitra', phone: '8866641039', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'VIShal randlo', phone: '7096569320', city: 'Khera', source: 'New chirag campaing (ig)' },
    { name: 'Ꭵ°᭄ᶫᵒᵛᵉ.jAAn࿐, 𝑰 𝑳𝑶𝑽𝑬𝄟✿𝕵𝖆𝖆𝖓 ...', phone: '6353084528', city: 'gona', source: 'New chirag campaing (ig)' },
    { name: 'Ram Bhai', phone: '9737001756', city: 'Pune', source: 'New chirag campaing (ig)' },
    { name: 'AKhtar Manek', phone: '8672870741', city: 'Jamnagar', source: 'New chirag campaing (ig)' },
    { name: '꧁P҉i҉y҉u҉s҉h҉ ꧂', phone: '9727141185', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Lalu Raval', phone: '9023112309', city: 'Botad', source: 'New chirag campaing (ig)' },
    { name: 'kashyap_Mehta_07', phone: '8320805188', city: 'Junagadh', source: 'New chirag campaing (ig)' },
    { name: 'Chetan Thakor', phone: '9265211002', city: 'Zidifi', source: 'New chirag campaing (ig)' },
    { name: 'Vaghela Khushal', phone: '9723651938', city: 'કરિયાણા', source: 'New chirag campaing (ig)' },
    { name: 'Pintu Rathod', phone: '7487925861', city: 'Ahemdabad', source: 'New chirag campaing (ig)' },
    { name: 'raj', phone: '9081505139', city: 'Viramgam', source: 'New chirag campaing (ig)' },
    { name: 'Afjal Pathan', phone: '9714504907', city: 'પઠાણ', source: 'New chirag campaing (ig)' },
    { name: 'Bharat Taviyad', phone: '7572925093', city: 'Santrampur', source: 'New chirag campaing (ig)' },
    { name: 'Anju_MY_Life', phone: '9328687689', city: 'India', source: 'New chirag campaing (ig)' },
    { name: 'Gohil Jayendra', phone: '9429037536', city: 'Rajpipla', source: 'New chirag campaing (ig)' },
    { name: 'Shah Gunjan kantilal', phone: '9913099254', city: 'Ahmedabad', source: 'New chirag campaing (ig)' }
];

async function distribute() {
    console.log(`🚀 STARTING GAP BATCH (MIDDLE CHUNK - ${gapLeads.length} LEADS) - SAFE MODE...`);

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
    let insertedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < gapLeads.length; i++) {
        const lead = gapLeads[i];
        const targetUser = team[i % team.length];

        // 1. Check Existence (Strict Skip or Insert)
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', lead.phone)
            .maybeSingle();

        if (existing) {
            console.log(`.. SKIPPING Lead ${lead.name} (${lead.phone}) - Exists`);
            skippedCount++;
            continue; // STRICT SKIP
        }

        // 2. Insert New
        const payload = {
            phone: lead.phone,
            name: lead.name,
            city: lead.city,
            source: lead.source,
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            created_at: new Date().toISOString(),
            assigned_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from('leads').insert(payload);

        if (insertError) {
            console.log(`.. Failed to insert ${lead.phone}:`, insertError.message);
            skippedCount++;
        } else {
            insertedCount++;
            // 3. Notification
            await supabase.from('notifications').insert({
                user_id: targetUser.id,
                title: 'New Lead Assigned',
                message: `Lead: ${lead.name}`,
                type: 'lead_assignment'
            });
        }
    }

    console.log(`\n🎉 GAP BATCH DONE!`);
    console.log(`   newly Inserted: ${insertedCount}`);
    console.log(`   Skipped (Old): ${skippedCount}`);
}

distribute();
