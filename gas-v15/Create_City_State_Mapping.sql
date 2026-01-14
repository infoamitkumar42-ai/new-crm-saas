-- ============================================================================
-- 🗺️ COMPLETE CITY TO STATE MAPPING (FROM GAS CONFIG)
-- All States: Punjab, Chandigarh, Haryana, Delhi, HP, UK, Maharashtra, Rajasthan, J&K
-- ============================================================================

DROP TABLE IF EXISTS city_state_mapping;

CREATE TABLE city_state_mapping (
    id SERIAL PRIMARY KEY,
    city TEXT NOT NULL,
    state TEXT NOT NULL
);

-- ============ PUNJAB (100+ CITIES) ============
INSERT INTO city_state_mapping (city, state) VALUES
('ludhiana', 'Punjab'),('amritsar', 'Punjab'),('jalandhar', 'Punjab'),('patiala', 'Punjab'),
('bathinda', 'Punjab'),('mohali', 'Punjab'),('pathankot', 'Punjab'),('moga', 'Punjab'),
('batala', 'Punjab'),('abohar', 'Punjab'),('malerkotla', 'Punjab'),('khanna', 'Punjab'),
('phagwara', 'Punjab'),('muktsar', 'Punjab'),('barnala', 'Punjab'),('rajpura', 'Punjab'),
('firozpur', 'Punjab'),('kapurthala', 'Punjab'),('hoshiarpur', 'Punjab'),('faridkot', 'Punjab'),
('sangrur', 'Punjab'),('kotkapura', 'Punjab'),('sunam', 'Punjab'),('gurdaspur', 'Punjab'),
('zirakpur', 'Punjab'),('dera bassi', 'Punjab'),('kharar', 'Punjab'),('nangal', 'Punjab'),
('rupnagar', 'Punjab'),('ropar', 'Punjab'),('nawanshahr', 'Punjab'),('sbs nagar', 'Punjab'),
('anandpur sahib', 'Punjab'),('fatehgarh sahib', 'Punjab'),('sirhind', 'Punjab'),
('bassi pathana', 'Punjab'),('mansa', 'Punjab'),('budhlada', 'Punjab'),('sardulgarh', 'Punjab'),
('rampura phul', 'Punjab'),('bhadaur', 'Punjab'),('dhuri', 'Punjab'),('moonak', 'Punjab'),
('lehra', 'Punjab'),('dirba', 'Punjab'),('longowal', 'Punjab'),('bhawanigarh', 'Punjab'),
('samana', 'Punjab'),('patran', 'Punjab'),('nabha', 'Punjab'),('ghanaur', 'Punjab'),
('banur', 'Punjab'),('lalru', 'Punjab'),('dera baba nanak', 'Punjab'),('qadian', 'Punjab'),
('sri hargobindpur', 'Punjab'),('mukerian', 'Punjab'),('dasuya', 'Punjab'),('garhshankar', 'Punjab'),
('balachaur', 'Punjab'),('nurmahal', 'Punjab'),('nakodar', 'Punjab'),('phillaur', 'Punjab'),
('goraya', 'Punjab'),('kartarpur', 'Punjab'),('adampur', 'Punjab'),('bhogpur', 'Punjab'),
('sultanpur lodhi', 'Punjab'),('makhu', 'Punjab'),('zira', 'Punjab'),('talwandi bhai', 'Punjab'),
('jalalabad', 'Punjab'),('fazilka', 'Punjab'),('malout', 'Punjab'),('gidderbaha', 'Punjab'),
('lambi', 'Punjab'),('raikot', 'Punjab'),('jagraon', 'Punjab'),('mullanpur', 'Punjab'),
('samrala', 'Punjab'),('machhiwara', 'Punjab'),('sahnewal', 'Punjab'),('doraha', 'Punjab'),
('payal', 'Punjab'),('ahmedgarh', 'Punjab'),('amargarh', 'Punjab'),('lehragaga', 'Punjab'),
('tarn taran', 'Punjab'),('patti', 'Punjab'),('khadur sahib', 'Punjab'),('goindwal', 'Punjab'),
('rayya', 'Punjab'),('ajnala', 'Punjab'),('majitha', 'Punjab'),('jandiala guru', 'Punjab'),
('beas', 'Punjab'),('harike', 'Punjab'),('ferozepur', 'Punjab'),('ferozpur', 'Punjab'),
('talwara', 'Punjab'),('dhariwal', 'Punjab'),('dinanagar', 'Punjab'),('sujanpur', 'Punjab'),
('bhikhi', 'Punjab'),('maur', 'Punjab'),('jaitu', 'Punjab'),('kot ise khan', 'Punjab'),
('bareta', 'Punjab'),('bhucho mandi', 'Punjab'),('goniana', 'Punjab'),('raman', 'Punjab'),
('kurali', 'Punjab'),('landran', 'Punjab'),('nayagaon', 'Punjab'),('dohla', 'Punjab'),
('sas nagar', 'Punjab'),('bhatinda', 'Punjab'),('ludhiyana', 'Punjab'),('jalandher', 'Punjab'),
('pb', 'Punjab'),('punjab', 'Punjab'),('panjab', 'Punjab'),
('machiwara', 'Punjab'),('roopnagar', 'Punjab'),('sri muktsar sahib', 'Punjab'),
('shri muktsar sahib', 'Punjab'),('sahibzada ajit singh nagar', 'Punjab');

-- ============ CHANDIGARH ============
INSERT INTO city_state_mapping (city, state) VALUES
('chandigarh', 'Chandigarh'),('chd', 'Chandigarh'),('chandigarh city', 'Chandigarh'),
('chandigarh ut', 'Chandigarh'),('sector 17', 'Chandigarh'),('sector 22', 'Chandigarh'),
('sector 35', 'Chandigarh'),('manimajra', 'Chandigarh'),('burail', 'Chandigarh'),
('dhanas', 'Chandigarh'),('maloya', 'Chandigarh'),('behlana', 'Chandigarh'),
('hallomajra', 'Chandigarh'),('kajheri', 'Chandigarh'),('chandigarh university', 'Chandigarh'),
('chdigarh', 'Chandigarh'),('chandighar', 'Chandigarh'),('chandigadh', 'Chandigarh');

-- ============ HARYANA ============
INSERT INTO city_state_mapping (city, state) VALUES
('panchkula', 'Haryana'),('pinjore', 'Haryana'),('kalka', 'Haryana'),('barwala', 'Haryana'),
('raipur rani', 'Haryana'),('morni', 'Haryana'),('ambala', 'Haryana'),('ambala city', 'Haryana'),
('ambala cantonment', 'Haryana'),('ambala cantt', 'Haryana'),('barara', 'Haryana'),
('naraingarh', 'Haryana'),('shahzadpur', 'Haryana'),('mullana', 'Haryana'),('saha', 'Haryana'),
('kurukshetra', 'Haryana'),('thanesar', 'Haryana'),('pehowa', 'Haryana'),('shahabad', 'Haryana'),
('ladwa', 'Haryana'),('babain', 'Haryana'),('karnal', 'Haryana'),('gharaunda', 'Haryana'),
('nilokheri', 'Haryana'),('indri', 'Haryana'),('assandh', 'Haryana'),('taraori', 'Haryana'),
('panipat', 'Haryana'),('samalkha', 'Haryana'),('israna', 'Haryana'),('madlauda', 'Haryana'),
('yamunanagar', 'Haryana'),('jagadhri', 'Haryana'),('chhachhrauli', 'Haryana'),('radaur', 'Haryana'),
('sadhaura', 'Haryana'),('bilaspur', 'Haryana'),('gurugram', 'Haryana'),('gurgaon', 'Haryana'),
('faridabad', 'Haryana'),('rohtak', 'Haryana'),('hisar', 'Haryana'),('sirsa', 'Haryana'),
('sonipat', 'Haryana'),('jhajjar', 'Haryana'),('rewari', 'Haryana'),('mahendragarh', 'Haryana'),
('bhiwani', 'Haryana'),('jind', 'Haryana'),('kaithal', 'Haryana'),('fatehabad', 'Haryana'),
('palwal', 'Haryana'),('nuh', 'Haryana'),('mewat', 'Haryana'),('manesar', 'Haryana'),
('bahadurgarh', 'Haryana'),('narnaul', 'Haryana'),('charkhi dadri', 'Haryana'),('tosham', 'Haryana'),
('loharu', 'Haryana'),('hansi', 'Haryana'),('uklana', 'Haryana'),('ratia', 'Haryana'),
('tohana', 'Haryana'),('jakhal', 'Haryana'),('safidon', 'Haryana'),('julana', 'Haryana'),
('narwana', 'Haryana'),('uchana', 'Haryana'),('ellenabad', 'Haryana'),('dabwali', 'Haryana'),
('rania', 'Haryana'),('kalanwali', 'Haryana'),('dhakoli', 'Haryana'),('baltana', 'Haryana'),
('hr', 'Haryana'),('haryana', 'Haryana'),('hariana', 'Haryana');

-- ============ HIMACHAL PRADESH ============
INSERT INTO city_state_mapping (city, state) VALUES
('shimla', 'Himachal Pradesh'),('kufri', 'Himachal Pradesh'),('fagu', 'Himachal Pradesh'),
('narkanda', 'Himachal Pradesh'),('theog', 'Himachal Pradesh'),('kotkhai', 'Himachal Pradesh'),
('jubbal', 'Himachal Pradesh'),('rohru', 'Himachal Pradesh'),('rampur bushahr', 'Himachal Pradesh'),
('sarahan', 'Himachal Pradesh'),('kumarsain', 'Himachal Pradesh'),('suni', 'Himachal Pradesh'),
('kandaghat', 'Himachal Pradesh'),('chail', 'Himachal Pradesh'),('mashobra', 'Himachal Pradesh'),
('naldehra', 'Himachal Pradesh'),('sanjauli', 'Himachal Pradesh'),('kangra', 'Himachal Pradesh'),
('dharamshala', 'Himachal Pradesh'),('dharamsala', 'Himachal Pradesh'),('mcleodganj', 'Himachal Pradesh'),
('mcleod ganj', 'Himachal Pradesh'),('palampur', 'Himachal Pradesh'),('baijnath', 'Himachal Pradesh'),
('bir', 'Himachal Pradesh'),('billing', 'Himachal Pradesh'),('nagrota bagwan', 'Himachal Pradesh'),
('jaisinghpur', 'Himachal Pradesh'),('jawali', 'Himachal Pradesh'),('nurpur', 'Himachal Pradesh'),
('indora', 'Himachal Pradesh'),('fatehpur', 'Himachal Pradesh'),('dehra gopipur', 'Himachal Pradesh'),
('guler', 'Himachal Pradesh'),('shahpur', 'Himachal Pradesh'),('kangra town', 'Himachal Pradesh'),
('kullu', 'Himachal Pradesh'),('manali', 'Himachal Pradesh'),('bhuntar', 'Himachal Pradesh'),
('kasol', 'Himachal Pradesh'),('manikaran', 'Himachal Pradesh'),('naggar', 'Himachal Pradesh'),
('banjar', 'Himachal Pradesh'),('sainj', 'Himachal Pradesh'),('ani', 'Himachal Pradesh'),
('katrain', 'Himachal Pradesh'),('rohtang', 'Himachal Pradesh'),('solang', 'Himachal Pradesh'),
('malana', 'Himachal Pradesh'),('tosh', 'Himachal Pradesh'),('kheerganga', 'Himachal Pradesh'),
('mandi', 'Himachal Pradesh'),('sundernagar', 'Himachal Pradesh'),('jogindernagar', 'Himachal Pradesh'),
('rewalsar', 'Himachal Pradesh'),('karsog', 'Himachal Pradesh'),('sarkaghat', 'Himachal Pradesh'),
('solan', 'Himachal Pradesh'),('baddi', 'Himachal Pradesh'),('barotiwala', 'Himachal Pradesh'),
('nalagarh', 'Himachal Pradesh'),('parwanoo', 'Himachal Pradesh'),('kasauli', 'Himachal Pradesh'),
('dagshai', 'Himachal Pradesh'),('sabathu', 'Himachal Pradesh'),('arki', 'Himachal Pradesh'),
('dharampur', 'Himachal Pradesh'),('una', 'Himachal Pradesh'),('amb', 'Himachal Pradesh'),
('gagret', 'Himachal Pradesh'),('haroli', 'Himachal Pradesh'),('bangana', 'Himachal Pradesh'),
('mehatpur', 'Himachal Pradesh'),('chintpurni', 'Himachal Pradesh'),('hamirpur', 'Himachal Pradesh'),
('nadaun', 'Himachal Pradesh'),('sujanpur', 'Himachal Pradesh'),('bhoranj', 'Himachal Pradesh'),
('bilaspur hp', 'Himachal Pradesh'),('ghumarwin', 'Himachal Pradesh'),('jhandutta', 'Himachal Pradesh'),
('naina devi', 'Himachal Pradesh'),('swarghat', 'Himachal Pradesh'),('nahan', 'Himachal Pradesh'),
('paonta sahib', 'Himachal Pradesh'),('rajgarh', 'Himachal Pradesh'),('renuka', 'Himachal Pradesh'),
('chamba', 'Himachal Pradesh'),('dalhousie', 'Himachal Pradesh'),('khajjiar', 'Himachal Pradesh'),
('banikhet', 'Himachal Pradesh'),('bharmour', 'Himachal Pradesh'),('reckong peo', 'Himachal Pradesh'),
('kalpa', 'Himachal Pradesh'),('sangla', 'Himachal Pradesh'),('chitkul', 'Himachal Pradesh'),
('keylong', 'Himachal Pradesh'),('kaza', 'Himachal Pradesh'),('tabo', 'Himachal Pradesh'),
('hp', 'Himachal Pradesh'),('himachal', 'Himachal Pradesh'),('himachal pradesh', 'Himachal Pradesh'),
('h.p.', 'Himachal Pradesh'),('old manali', 'Himachal Pradesh'),('vashisht', 'Himachal Pradesh');

-- ============ UTTARAKHAND ============
INSERT INTO city_state_mapping (city, state) VALUES
('dehradun', 'Uttarakhand'),('doon', 'Uttarakhand'),('mussoorie', 'Uttarakhand'),
('rishikesh', 'Uttarakhand'),('haridwar', 'Uttarakhand'),('vikasnagar', 'Uttarakhand'),
('herbertpur', 'Uttarakhand'),('doiwala', 'Uttarakhand'),('premnagar', 'Uttarakhand'),
('clement town', 'Uttarakhand'),('rajpur', 'Uttarakhand'),('sahastradhara', 'Uttarakhand'),
('maldevta', 'Uttarakhand'),('selaqui', 'Uttarakhand'),('chakrata', 'Uttarakhand'),
('roorkee', 'Uttarakhand'),('jwalapur', 'Uttarakhand'),('bhel', 'Uttarakhand'),
('ranipur', 'Uttarakhand'),('laksar', 'Uttarakhand'),('manglaur', 'Uttarakhand'),
('kankhal', 'Uttarakhand'),('har ki pauri', 'Uttarakhand'),('mansa devi', 'Uttarakhand'),
('nainital', 'Uttarakhand'),('haldwani', 'Uttarakhand'),('kathgodam', 'Uttarakhand'),
('bhimtal', 'Uttarakhand'),('naukuchiatal', 'Uttarakhand'),('sattal', 'Uttarakhand'),
('bhowali', 'Uttarakhand'),('ramgarh', 'Uttarakhand'),('mukteshwar', 'Uttarakhand'),
('ramnagar', 'Uttarakhand'),('kaladungi', 'Uttarakhand'),('lalkuan', 'Uttarakhand'),
('almora', 'Uttarakhand'),('ranikhet', 'Uttarakhand'),('kausani', 'Uttarakhand'),
('binsar', 'Uttarakhand'),('jageshwar', 'Uttarakhand'),('dwarahat', 'Uttarakhand'),
('rudrapur', 'Uttarakhand'),('kashipur', 'Uttarakhand'),('jaspur', 'Uttarakhand'),
('khatima', 'Uttarakhand'),('sitarganj', 'Uttarakhand'),('bazpur', 'Uttarakhand'),
('gadarpur', 'Uttarakhand'),('kichha', 'Uttarakhand'),('pantnagar', 'Uttarakhand'),
('pauri', 'Uttarakhand'),('kotdwar', 'Uttarakhand'),('lansdowne', 'Uttarakhand'),
('srinagar garhwal', 'Uttarakhand'),('tehri', 'Uttarakhand'),('new tehri', 'Uttarakhand'),
('narendranagar', 'Uttarakhand'),('devprayag', 'Uttarakhand'),('dhanolti', 'Uttarakhand'),
('gopeshwar', 'Uttarakhand'),('chamoli', 'Uttarakhand'),('joshimath', 'Uttarakhand'),
('badrinath', 'Uttarakhand'),('auli', 'Uttarakhand'),('karnaprayag', 'Uttarakhand'),
('nandprayag', 'Uttarakhand'),('gairsain', 'Uttarakhand'),('valley of flowers', 'Uttarakhand'),
('hemkund sahib', 'Uttarakhand'),('rudraprayag', 'Uttarakhand'),('kedarnath', 'Uttarakhand'),
('gaurikund', 'Uttarakhand'),('guptkashi', 'Uttarakhand'),('chopta', 'Uttarakhand'),
('tungnath', 'Uttarakhand'),('uttarkashi', 'Uttarakhand'),('gangotri', 'Uttarakhand'),
('yamunotri', 'Uttarakhand'),('barkot', 'Uttarakhand'),('harsil', 'Uttarakhand'),
('pithoragarh', 'Uttarakhand'),('dharchula', 'Uttarakhand'),('munsiyari', 'Uttarakhand'),
('gangolihat', 'Uttarakhand'),('champawat', 'Uttarakhand'),('tanakpur', 'Uttarakhand'),
('lohaghat', 'Uttarakhand'),('purnagiri', 'Uttarakhand'),('bageshwar', 'Uttarakhand'),
('uk', 'Uttarakhand'),('uttaranchal', 'Uttarakhand'),('uttarakhand', 'Uttarakhand'),
('dehradoon', 'Uttarakhand'),('hardwar', 'Uttarakhand'),('mussorie', 'Uttarakhand');

-- ============ DELHI NCR ============
INSERT INTO city_state_mapping (city, state) VALUES
('delhi', 'Delhi'),('new delhi', 'Delhi'),('dilli', 'Delhi'),('delhi ncr', 'Delhi'),
('ncr', 'Delhi'),('connaught place', 'Delhi'),('cp', 'Delhi'),('karol bagh', 'Delhi'),
('paharganj', 'Delhi'),('chandni chowk', 'Delhi'),('south delhi', 'Delhi'),('saket', 'Delhi'),
('malviya nagar', 'Delhi'),('hauz khas', 'Delhi'),('green park', 'Delhi'),('lajpat nagar', 'Delhi'),
('defence colony', 'Delhi'),('greater kailash', 'Delhi'),('gk1', 'Delhi'),('gk2', 'Delhi'),
('cr park', 'Delhi'),('nehru place', 'Delhi'),('kalkaji', 'Delhi'),('okhla', 'Delhi'),
('sarita vihar', 'Delhi'),('vasant kunj', 'Delhi'),('vasant vihar', 'Delhi'),('munirka', 'Delhi'),
('north delhi', 'Delhi'),('civil lines', 'Delhi'),('model town', 'Delhi'),('gtb nagar', 'Delhi'),
('mukherjee nagar', 'Delhi'),('rohini', 'Delhi'),('pitampura', 'Delhi'),('shalimar bagh', 'Delhi'),
('east delhi', 'Delhi'),('preet vihar', 'Delhi'),('laxmi nagar', 'Delhi'),('anand vihar', 'Delhi'),
('shahdara', 'Delhi'),('dilshad garden', 'Delhi'),('krishna nagar', 'Delhi'),('mayur vihar', 'Delhi'),
('west delhi', 'Delhi'),('rajouri garden', 'Delhi'),('janakpuri', 'Delhi'),('vikaspuri', 'Delhi'),
('uttam nagar', 'Delhi'),('dwarka', 'Delhi'),('palam', 'Delhi'),('najafgarh', 'Delhi'),
('nangloi', 'Delhi'),('tilak nagar', 'Delhi'),('moti nagar', 'Delhi'),('patel nagar', 'Delhi'),
('noida', 'Delhi'),('greater noida', 'Delhi'),('ghaziabad', 'Delhi'),('newdelhi', 'Delhi'),
('central delhi', 'Delhi'),('south ex', 'Delhi'),('south extension', 'Delhi'),('dl', 'Delhi'),
('aerocity', 'Delhi'),('igi airport', 'Delhi'),('indirapuram', 'Delhi'),('vaishali', 'Delhi');

-- ============ RAJASTHAN ============
INSERT INTO city_state_mapping (city, state) VALUES
('jaipur', 'Rajasthan'),('jodhpur', 'Rajasthan'),('kota', 'Rajasthan'),('bikaner', 'Rajasthan'),
('ajmer', 'Rajasthan'),('udaipur', 'Rajasthan'),('bhilwara', 'Rajasthan'),('alwar', 'Rajasthan'),
('sikar', 'Rajasthan'),('sriganganagar', 'Rajasthan'),('ganganagar', 'Rajasthan'),('pali', 'Rajasthan'),
('chittorgarh', 'Rajasthan'),('tonk', 'Rajasthan'),('kishangarh', 'Rajasthan'),('beawar', 'Rajasthan'),
('hanumangarh', 'Rajasthan'),('dholpur', 'Rajasthan'),('sawai madhopur', 'Rajasthan'),('churu', 'Rajasthan'),
('jhunjhunu', 'Rajasthan'),('baran', 'Rajasthan'),('bundi', 'Rajasthan'),('banswara', 'Rajasthan'),
('nagaur', 'Rajasthan'),('barmer', 'Rajasthan'),('jaisalmer', 'Rajasthan'),('dungarpur', 'Rajasthan'),
('pratapgarh', 'Rajasthan'),('rajsamand', 'Rajasthan'),('jalore', 'Rajasthan'),('sirohi', 'Rajasthan'),
('bhiwadi', 'Rajasthan'),('neemrana', 'Rajasthan'),('mount abu', 'Rajasthan'),('abu road', 'Rajasthan'),
('nathdwara', 'Rajasthan'),('rj', 'Rajasthan'),('raj', 'Rajasthan'),('rajasthan', 'Rajasthan'),
('pink city', 'Rajasthan');

-- ============ MAHARASHTRA ============
INSERT INTO city_state_mapping (city, state) VALUES
('mumbai', 'Maharashtra'),('bombay', 'Maharashtra'),('pune', 'Maharashtra'),('poona', 'Maharashtra'),
('nagpur', 'Maharashtra'),('thane', 'Maharashtra'),('nashik', 'Maharashtra'),('aurangabad', 'Maharashtra'),
('navi mumbai', 'Maharashtra'),('kolhapur', 'Maharashtra'),('solapur', 'Maharashtra'),('sangli', 'Maharashtra'),
('satara', 'Maharashtra'),('ratnagiri', 'Maharashtra'),('ahmednagar', 'Maharashtra'),('latur', 'Maharashtra'),
('nanded', 'Maharashtra'),('akola', 'Maharashtra'),('amravati', 'Maharashtra'),('chandrapur', 'Maharashtra'),
('mh', 'Maharashtra'),('maharashtra', 'Maharashtra');

-- ============ JAMMU & KASHMIR ============
INSERT INTO city_state_mapping (city, state) VALUES
('jammu', 'Jammu & Kashmir'),('srinagar', 'Jammu & Kashmir'),('anantnag', 'Jammu & Kashmir'),
('baramulla', 'Jammu & Kashmir'),('kathua', 'Jammu & Kashmir'),('udhampur', 'Jammu & Kashmir'),
('sopore', 'Jammu & Kashmir'),('leh', 'Jammu & Kashmir'),('ladakh', 'Jammu & Kashmir'),
('kargil', 'Jammu & Kashmir'),('punch', 'Jammu & Kashmir'),('rajouri', 'Jammu & Kashmir'),
('pulwama', 'Jammu & Kashmir'),('kupwara', 'Jammu & Kashmir'),('jk', 'Jammu & Kashmir'),
('j&k', 'Jammu & Kashmir'),('jammu and kashmir', 'Jammu & Kashmir');

-- ============ ALL INDIA (Fallback) ============
INSERT INTO city_state_mapping (city, state) VALUES
('india', 'All India'),('all india', 'All India'),('pan india', 'All India'),
('nationwide', 'All India'),('bharat', 'All India'),('anywhere', 'All India'),
('any city', 'All India'),('flexible', 'All India'),('all over india', 'All India');

-- Create index for faster lookups
CREATE INDEX idx_city_state_city ON city_state_mapping(city);
CREATE INDEX idx_city_state_state ON city_state_mapping(state);

-- Verify counts
SELECT state, COUNT(*) as cities FROM city_state_mapping GROUP BY state ORDER BY cities DESC;
