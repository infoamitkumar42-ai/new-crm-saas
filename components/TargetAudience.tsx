/**
 * ============================================================================
 * TARGET AUDIENCE - COMPLETE VERSION WITH ALL CITIES
 * ============================================================================
 * All cities from Config.gs included
 * 100% Crash Proof with safeArray()
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MapPin, Users, Check, Save, AlertCircle, ArrowLeft,
  ChevronDown, Globe, Loader2, X, Home, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================================
// SAFE HELPERS - PREVENT ALL CRASHES
// ============================================================
const safeArray = (val: unknown): string[] => {
  if (!val) return [];
  if (!Array.isArray(val)) return [];
  return val.filter((item): item is string => typeof item === 'string');
};

// ============================================================
// COMPLETE STATE-CITY DATA (FROM CONFIG.GS)
// ============================================================
const STATE_CITIES: Record<string, string[]> = {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUNJAB - ALL 23 DISTRICTS + MAJOR TOWNS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Punjab': [
    // Major Cities
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali',
    'Pathankot', 'Moga', 'Batala', 'Abohar', 'Malerkotla', 'Khanna',
    'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala',
    'Hoshiarpur', 'Faridkot', 'Sangrur', 'Kotkapura', 'Sunam', 'Gurdaspur',
    
    // Towns & Tehsils
    'Zirakpur', 'Dera Bassi', 'Kharar', 'Nangal', 'Rupnagar', 'Ropar',
    'Nawanshahr', 'SBS Nagar', 'Anandpur Sahib', 'Fatehgarh Sahib', 'Sirhind',
    'Bassi Pathana', 'Mansa', 'Budhlada', 'Sardulgarh', 'Rampura Phul',
    'Bhadaur', 'Dhuri', 'Moonak', 'Lehra', 'Dirba', 'Longowal', 'Bhawanigarh',
    'Samana', 'Patran', 'Nabha', 'Ghanaur', 'Banur', 'Lalru',
    'Dera Baba Nanak', 'Qadian', 'Sri Hargobindpur', 'Mukerian', 'Dasuya',
    'Garhshankar', 'Balachaur', 'Nurmahal', 'Nakodar', 'Phillaur', 'Goraya',
    'Kartarpur', 'Adampur', 'Bhogpur', 'Sultanpur Lodhi', 'Makhu', 'Zira',
    'Talwandi Bhai', 'Jalalabad', 'Fazilka', 'Malout', 'Gidderbaha',
    'Raikot', 'Jagraon', 'Mullanpur', 'Samrala', 'Machhiwara',
    'Sahnewal', 'Doraha', 'Payal', 'Ahmedgarh', 'Amargarh',
    'Lehragaga', 'Tarn Taran', 'Patti', 'Khadur Sahib', 'Goindwal',
    'Rayya', 'Ajnala', 'Majitha', 'Jandiala Guru', 'Beas', 'Harike',
    'Ferozepur City', 'Ferozepur Cantonment', 'Talwara', 'Dhariwal',
    'Dinanagar', 'Sujanpur', 'Bhikhi', 'Maur', 'Jaitu'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHANDIGARH (Union Territory)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Chandigarh': [
    'Chandigarh', 'Manimajra', 'Burail', 'Dhanas', 'Maloya', 
    'Behlana', 'Hallomajra', 'Kajheri', 'Sector 17', 'Sector 22',
    'Sector 35', 'Sector 43', 'Industrial Area'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HARYANA - ALL 22 DISTRICTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Haryana': [
    // Panchkula & Nearby
    'Panchkula', 'Pinjore', 'Kalka', 'Barwala', 'Raipur Rani', 'Morni',
    
    // Ambala
    'Ambala', 'Ambala City', 'Ambala Cantonment', 'Barara', 'Naraingarh', 'Shahzadpur',
    
    // Kurukshetra
    'Kurukshetra', 'Thanesar', 'Pehowa', 'Shahabad', 'Ladwa', 'Babain',
    
    // Karnal
    'Karnal', 'Gharaunda', 'Nilokheri', 'Indri', 'Assandh', 'Taraori',
    
    // Panipat
    'Panipat', 'Samalkha', 'Israna', 'Madlauda', 'Bapoli',
    
    // Yamunanagar
    'Yamunanagar', 'Jagadhri', 'Chhachhrauli', 'Radaur', 'Sadhaura', 'Bilaspur',
    
    // Major Cities
    'Gurugram', 'Gurgaon', 'Faridabad', 'Rohtak', 'Hisar', 'Sirsa',
    'Sonipat', 'Jhajjar', 'Rewari', 'Mahendragarh', 'Bhiwani', 'Jind',
    'Kaithal', 'Fatehabad', 'Palwal', 'Nuh', 'Mewat', 'Manesar',
    'Bahadurgarh', 'Narnaul', 'Charkhi Dadri', 'Tosham', 'Loharu',
    'Hansi', 'Uklana', 'Ratia', 'Tohana', 'Jakhal',
    'Safidon', 'Julana', 'Narwana', 'Uchana', 'Ellenabad', 'Dabwali',
    'Rania', 'Kalanwali',
    
    // Tricity Area
    'Peer Muchalla', 'Dhakoli', 'Baltana', 'Nayagaon', 'Ramgarh', 'Surajpur'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELHI NCR - ALL 11 DISTRICTS + AREAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Delhi': [
    // Central Delhi
    'Connaught Place', 'Karol Bagh', 'Paharganj', 'Chandni Chowk', 
    'Daryaganj', 'ITO', 'Mandi House', 'Rajiv Chowk',
    
    // South Delhi
    'Saket', 'Malviya Nagar', 'Hauz Khas', 'Green Park', 'Lajpat Nagar',
    'Defence Colony', 'Greater Kailash', 'GK1', 'GK2', 'CR Park',
    'Nehru Place', 'Kalkaji', 'Govindpuri', 'Okhla', 'Jasola', 
    'Sarita Vihar', 'Badarpur', 'Tughlakabad', 'Mehrauli', 
    'Vasant Kunj', 'Vasant Vihar', 'Munirka', 'RK Puram',
    
    // North Delhi
    'Civil Lines', 'Model Town', 'GTB Nagar', 'Mukherjee Nagar',
    'Kamla Nagar', 'Shakti Nagar', 'Gulabi Bagh', 'Sadar Bazar',
    'Kashmere Gate', 'Burari', 'Jahangirpuri', 'Adarsh Nagar',
    'Azadpur', 'Shalimar Bagh', 'Ashok Vihar', 'Wazirpur', 'Pitampura',
    'Rohini', 'Rithala', 'Badli', 'Narela', 'Alipur',
    
    // East Delhi
    'Preet Vihar', 'Laxmi Nagar', 'Nirman Vihar', 'Anand Vihar',
    'Kaushambi', 'Vaishali', 'Indirapuram', 'Karkardooma',
    'Shahdara', 'Dilshad Garden', 'Seelampur', 'Welcome',
    'Krishna Nagar', 'Gandhi Nagar', 'Patparganj', 'Mayur Vihar',
    'Trilokpuri', 'Kalyanpuri', 'Geeta Colony', 'Vivek Vihar',
    
    // West Delhi
    'Rajouri Garden', 'Subhash Nagar', 'Tagore Garden', 'Janakpuri',
    'Vikaspuri', 'Uttam Nagar', 'Dwarka', 'Palam', 'Dabri',
    'Najafgarh', 'Nangloi', 'Mundka', 'Hari Nagar', 'Tilak Nagar',
    'Moti Nagar', 'Kirti Nagar', 'Patel Nagar', 'Rajinder Nagar',
    'Naraina', 'Mayapuri',
    
    // South West Delhi
    'Bijwasan', 'Kapashera', 'Mahipalpur', 'Aerocity', 'IGI Airport',
    
    // NCR Areas
    'Noida', 'Greater Noida', 'Ghaziabad', 'Faridabad', 'Gurugram'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HIMACHAL PRADESH - ALL 12 DISTRICTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Himachal Pradesh': [
    // Shimla District
    'Shimla', 'Kufri', 'Fagu', 'Narkanda', 'Theog', 'Kotkhai', 
    'Jubbal', 'Rohru', 'Rampur Bushahr', 'Sarahan', 'Kumarsain',
    'Suni', 'Kandaghat', 'Chail', 'Mashobra', 'Naldehra',
    
    // Kangra District
    'Kangra', 'Dharamshala', 'McLeodganj', 'Palampur', 'Baijnath', 
    'Bir', 'Billing', 'Nagrota Bagwan', 'Jaisinghpur', 'Jawali', 
    'Nurpur', 'Indora', 'Fatehpur', 'Dehra Gopipur', 'Shahpur',
    
    // Kullu District
    'Kullu', 'Manali', 'Bhuntar', 'Kasol', 'Manikaran', 'Naggar',
    'Banjar', 'Sainj', 'Ani', 'Katrain', 'Solang', 'Rohtang',
    
    // Mandi District
    'Mandi', 'Sundernagar', 'Jogindernagar', 'Rewalsar', 'Karsog',
    'Sarkaghat', 'Pandoh', 'Aut', 'Barot',
    
    // Solan District
    'Solan', 'Baddi', 'Barotiwala', 'Nalagarh', 'Parwanoo', 'Kasauli',
    'Dagshai', 'Subathu', 'Arki', 'Dharampur',
    
    // Una District
    'Una', 'Amb', 'Gagret', 'Haroli', 'Bangana', 'Chintpurni',
    
    // Hamirpur District
    'Hamirpur', 'Nadaun', 'Sujanpur', 'Bhoranj', 'Barsar',
    
    // Bilaspur District
    'Bilaspur', 'Ghumarwin', 'Naina Devi', 'Swarghat',
    
    // Sirmaur District
    'Nahan', 'Paonta Sahib', 'Rajgarh', 'Renuka',
    
    // Chamba District
    'Chamba', 'Dalhousie', 'Khajjiar', 'Banikhet', 'Bharmour',
    
    // Kinnaur District
    'Reckong Peo', 'Kalpa', 'Sangla', 'Chitkul', 'Nako',
    
    // Lahaul Spiti
    'Keylong', 'Kaza', 'Tabo', 'Kibber', 'Langza', 'Dhankar'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTTARAKHAND - ALL 13 DISTRICTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Uttarakhand': [
    // Dehradun District
    'Dehradun', 'Mussoorie', 'Rishikesh', 'Vikasnagar', 'Doiwala',
    'Premnagar', 'Clement Town', 'Rajpur', 'Sahastradhara', 'Selaqui',
    'Maldevta', 'Chakrata', 'Kalsi',
    
    // Haridwar District
    'Haridwar', 'Roorkee', 'Jwalapur', 'BHEL', 'Laksar', 'Manglaur',
    'Kankhal', 'Har Ki Pauri', 'Bahadrabad',
    
    // Nainital District
    'Nainital', 'Haldwani', 'Kathgodam', 'Bhimtal', 'Naukuchiatal',
    'Sattal', 'Bhowali', 'Ramgarh', 'Mukteshwar', 'Ramnagar',
    
    // Almora District
    'Almora', 'Ranikhet', 'Kausani', 'Binsar', 'Jageshwar',
    
    // Udham Singh Nagar
    'Rudrapur', 'Kashipur', 'Jaspur', 'Khatima', 'Sitarganj',
    'Bazpur', 'Gadarpur', 'Pantnagar', 'Kichha',
    
    // Pauri Garhwal
    'Pauri', 'Kotdwar', 'Lansdowne', 'Srinagar Garhwal', 'Satpuli',
    
    // Tehri Garhwal
    'Tehri', 'New Tehri', 'Chamba', 'Narendranagar', 'Devprayag',
    'Dhanolti', 'Kanatal',
    
    // Chamoli District
    'Gopeshwar', 'Chamoli', 'Joshimath', 'Badrinath', 'Auli',
    'Karnaprayag', 'Valley of Flowers',
    
    // Rudraprayag District
    'Rudraprayag', 'Kedarnath', 'Gaurikund', 'Guptkashi', 'Chopta',
    
    // Uttarkashi District
    'Uttarkashi', 'Gangotri', 'Yamunotri', 'Barkot', 'Harsil',
    
    // Pithoragarh District
    'Pithoragarh', 'Dharchula', 'Munsiyari', 'Gangolihat',
    
    // Champawat District
    'Champawat', 'Tanakpur', 'Lohaghat', 'Purnagiri',
    
    // Bageshwar District
    'Bageshwar', 'Kanda', 'Garur'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAHARASHTRA - ALL 36 DISTRICTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Maharashtra': [
    // Mumbai & Suburbs
    'Mumbai', 'South Mumbai', 'Colaba', 'Fort', 'Churchgate', 'Marine Drive',
    'Worli', 'Lower Parel', 'Prabhadevi', 'Dadar', 'Matunga', 'Wadala',
    'Sion', 'Kurla', 'Chembur', 'Ghatkopar', 'Vikhroli', 'Powai',
    'Andheri', 'Andheri East', 'Andheri West', 'Jogeshwari', 'Goregaon',
    'Malad', 'Kandivali', 'Borivali', 'Dahisar', 'Bandra', 'Santacruz',
    'Vile Parle', 'Juhu', 'Versova', 'Lokhandwala', 'Mulund', 'Thane',
    'Kalyan', 'Dombivli', 'Badlapur', 'Ambernath', 'Ulhasnagar',
    'Vasai', 'Virar', 'Nalasopara', 'Palghar', 'Boisar', 'Mira Road', 'Bhayandar',
    
    // Navi Mumbai
    'Navi Mumbai', 'Vashi', 'Nerul', 'Belapur', 'CBD Belapur', 'Kharghar',
    'Panvel', 'Airoli', 'Ghansoli', 'Kopar Khairane', 'Turbhe', 'Sanpada',
    'Seawoods', 'Ulwe', 'Kamothe', 'Kalamboli', 'Taloja',
    
    // Pune & Around
    'Pune', 'Shivajinagar', 'Deccan', 'FC Road', 'JM Road',
    'Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Kharadi', 'Hadapsar',
    'Magarpatta', 'Aundh', 'Baner', 'Balewadi', 'Pashan', 'Hinjewadi',
    'Wakad', 'Pimple Saudagar', 'Pimple Nilakh', 'Pimple Gurav', 'Sangvi',
    'Dapodi', 'Khadki', 'Vishrantwadi', 'Yerwada', 'Mundhwa', 'Kondhwa',
    'Bibvewadi', 'Katraj', 'Sinhagad Road', 'Warje', 'Kothrud', 'Bavdhan',
    'Pimpri', 'Chinchwad', 'PCMC', 'Nigdi', 'Pradhikaran', 'Akurdi', 'Ravet',
    'Talegaon', 'Lonavala', 'Khandala', 'Chakan', 'Alandi', 'Bhosari',
    
    // Nagpur & Vidarbha
    'Nagpur', 'Sitabuldi', 'Dharampeth', 'Civil Lines Nagpur', 'Sadar',
    'Wardha', 'Amravati', 'Akola', 'Yavatmal', 'Chandrapur', 'Gondia', 'Bhandara',
    
    // Nashik & North Maharashtra
    'Nashik', 'Nashik Road', 'Panchavati', 'Satpur', 'CIDCO Nashik',
    'Deolali', 'Igatpuri', 'Manmad', 'Malegaon', 'Trimbakeshwar',
    'Dhule', 'Jalgaon', 'Bhusawal', 'Nandurbar',
    
    // Aurangabad & Marathwada
    'Aurangabad', 'Sambhajinagar', 'Jalna', 'Parbhani', 'Latur', 
    'Nanded', 'Osmanabad', 'Beed', 'Hingoli',
    
    // Kolhapur & Western Maharashtra
    'Kolhapur', 'Sangli', 'Satara', 'Solapur', 'Ichalkaranji', 'Miraj', 'Karad',
    
    // Konkan
    'Ratnagiri', 'Sindhudurg', 'Raigad', 'Alibaug', 'Murud', 'Matheran', 
    'Mahabaleshwar', 'Panchgani'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RAJASTHAN - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner',
    'Alwar', 'Bhilwara', 'Sikar', 'Sri Ganganagar', 'Pali',
    'Bharatpur', 'Jhunjhunu', 'Churu', 'Nagaur', 'Tonk',
    'Beawar', 'Kishangarh', 'Pushkar', 'Mount Abu', 'Chittorgarh',
    'Barmer', 'Jaisalmer', 'Hanumangarh', 'Sawai Madhopur'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GUJARAT - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar',
    'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad',
    'Morbi', 'Mehsana', 'Bharuch', 'Vapi', 'Navsari',
    'Veraval', 'Porbandar', 'Godhra', 'Bhuj', 'Gandhidham',
    'Palanpur', 'Valsad', 'Surendranagar', 'Dwarka'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTTAR PRADESH - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut',
    'Prayagraj', 'Allahabad', 'Noida', 'Greater Noida', 'Bareilly',
    'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Faizabad',
    'Ayodhya', 'Mathura', 'Vrindavan', 'Jhansi', 'Muzaffarnagar',
    'Shahjahanpur', 'Rampur', 'Firozabad', 'Hapur', 'Etawah',
    'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi',
    'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich',
    'Modinagar', 'Unnao', 'Lakhimpur', 'Banda', 'Hathras'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MADHYA PRADESH - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain',
    'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa',
    'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind',
    'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Damoh',
    'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur', 'Hoshangabad'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BIHAR - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga',
    'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger',
    'Chhapra', 'Samastipur', 'Hajipur', 'Sasaram', 'Dehri',
    'Siwan', 'Motihari', 'Nawada', 'Bagaha', 'Buxar',
    'Kishanganj', 'Sitamarhi', 'Jamalpur', 'Jehanabad', 'Aurangabad Bihar'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WEST BENGAL - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri',
    'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur',
    'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia',
    'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri',
    'Balurghat', 'Basirhat', 'Bankura', 'Darjeeling', 'Alipurduar'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // KARNATAKA - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Karnataka': [
    'Bengaluru', 'Bangalore', 'Mysuru', 'Mysore', 'Hubli', 'Dharwad',
    'Mangaluru', 'Mangalore', 'Belgaum', 'Belagavi', 'Gulbarga',
    'Kalaburagi', 'Davanagere', 'Bellary', 'Ballari', 'Vijayapura',
    'Shimoga', 'Shivamogga', 'Tumkur', 'Tumakuru', 'Raichur',
    'Bidar', 'Hospet', 'Gadag', 'Udupi', 'Hassan', 'Chitradurga',
    'Madikeri', 'Coorg', 'Chikmagalur', 'Mandya', 'Kolar', 'Bagalkot'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAMIL NADU - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Trichy',
    'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore',
    'Thoothukkudi', 'Thoothukudi', 'Dindigul', 'Thanjavur',
    'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Ooty',
    'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumarapalayam',
    'Karaikkudi', 'Neyveli', 'Cuddalore', 'Kumbakonam', 'Tiruvannamalai',
    'Pollachi', 'Rajapalayam', 'Gudiyatham', 'Pudukkottai', 'Vaniyambadi'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TELANGANA - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Telangana': [
    'Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar',
    'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad',
    'Suryapet', 'Miryalaguda', 'Siddipet', 'Mancherial', 'Jagtial'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANDHRA PRADESH - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vizag', 'Vijayawada', 'Guntur', 'Nellore',
    'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa',
    'Anantapur', 'Vizianagaram', 'Eluru', 'Ongole', 'Nandyal',
    'Machilipatnam', 'Adoni', 'Tenali', 'Proddatur', 'Chittoor',
    'Hindupur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // KERALA - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Kerala': [
    'Thiruvananthapuram', 'Trivandrum', 'Kochi', 'Cochin', 'Kozhikode',
    'Calicut', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha',
    'Alleppey', 'Kannur', 'Kottayam', 'Kasaragod', 'Malappuram',
    'Pathanamthitta', 'Idukki', 'Munnar', 'Wayanad', 'Ernakulam',
    'Thalassery', 'Manjeri', 'Vatakara', 'Tirur', 'Ottapalam',
    'Kayamkulam', 'Changanassery', 'Punalur', 'Nilambur', 'Cherthala'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ODISHA - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur',
    'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda',
    'Jeypore', 'Bargarh', 'Brahmapur', 'Angul', 'Dhenkanal',
    'Konark', 'Paradip', 'Koraput', 'Rayagada', 'Kendujhar'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ASSAM - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon',
    'Tinsukia', 'Tezpur', 'Bongaigaon', 'Diphu', 'North Lakhimpur',
    'Dhubri', 'Karimganj', 'Sivasagar', 'Goalpara', 'Barpeta'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // JHARKHAND - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar',
    'Hazaribagh', 'Giridih', 'Ramgarh', 'Phusro', 'Medininagar',
    'Chirkunda', 'Chaibasa', 'Dumka', 'Adityapur', 'Godda'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHHATTISGARH - MAJOR CITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg',
    'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Chirmiri',
    'Dhamtari', 'Mahasamund', 'Kumhari', 'Kawardha', 'Bemetara'
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GOA - ALL AREAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  'Goa': [
    'Panaji', 'Panjim', 'Margao', 'Vasco da Gama', 'Mapusa',
    'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim',
    'Calangute', 'Candolim', 'Baga', 'Anjuna', 'Vagator',
    'Arambol', 'Morjim', 'Colva', 'Benaulim', 'Palolem', 'Agonda'
  ]
};

const STATES = Object.keys(STATE_CITIES);

// ============================================================
// TYPES
// ============================================================
interface Filters {
  pan_india: boolean;
  panIndia?: boolean;
  states: string[];
  cities: string[];
  gender: string;
}

const DEFAULT_FILTERS: Filters = {
  pan_india: true,
  states: [],
  cities: [],
  gender: 'all'
};

// ============================================================
// SAFE PARSE FUNCTION
// ============================================================
const parseFilters = (data: unknown): Filters => {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_FILTERS };
  }
  
  const obj = data as Record<string, unknown>;
  
  return {
    pan_india: obj.pan_india === true || obj.panIndia === true,
    states: safeArray(obj.states),
    cities: safeArray(obj.cities),
    gender: typeof obj.gender === 'string' ? obj.gender : 'all'
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export const TargetAudience: React.FC = () => {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================
  // LOAD FILTERS
  // ============================================================
  const loadFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please login to continue');
        setLoading(false);
        return;
      }
      
      setUserId(user.id);
      
      const { data } = await supabase
        .from('users')
        .select('filters')
        .eq('id', user.id)
        .single();
      
      const parsedFilters = parseFilters(data?.filters);
      setFilters(parsedFilters);
      
    } catch (err) {
      console.error('Load error:', err);
      setFilters(DEFAULT_FILTERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // ============================================================
  // SAVE FILTERS
  // ============================================================
  const handleSave = async () => {
    if (!userId) {
      setError('User not found');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSaved(false);
    
    try {
      const { error: saveError } = await supabase
        .from('users')
        .update({
          filters: {
            pan_india: filters.pan_india,
            panIndia: filters.pan_india,
            states: filters.states,
            cities: filters.cities,
            gender: filters.gender
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (saveError) throw saveError;
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TOGGLE HANDLERS
  // ============================================================
  const togglePanIndia = () => {
    setFilters(prev => ({
      ...prev,
      pan_india: !prev.pan_india,
      states: [],
      cities: []
    }));
  };

  const toggleState = (state: string) => {
    setFilters(prev => {
      const currentStates = safeArray(prev.states);
      const isSelected = currentStates.includes(state);
      
      const newStates = isSelected
        ? currentStates.filter(s => s !== state)
        : [...currentStates, state];
      
      const stateCities = STATE_CITIES[state] || [];
      const currentCities = safeArray(prev.cities);
      const newCities = isSelected
        ? currentCities.filter(c => !stateCities.includes(c))
        : currentCities;
      
      return {
        ...prev,
        pan_india: false,
        states: newStates,
        cities: newCities
      };
    });
  };

  const toggleCity = (city: string) => {
    setFilters(prev => {
      const currentCities = safeArray(prev.cities);
      const isSelected = currentCities.includes(city);
      
      return {
        ...prev,
        pan_india: false,
        cities: isSelected
          ? currentCities.filter(c => c !== city)
          : [...currentCities, city]
      };
    });
  };

  const selectAllCitiesInState = (state: string) => {
    const stateCities = STATE_CITIES[state] || [];
    setFilters(prev => {
      const currentCities = safeArray(prev.cities);
      const newCities = [...new Set([...currentCities, ...stateCities])];
      return { ...prev, cities: newCities };
    });
  };

  const deselectAllCitiesInState = (state: string) => {
    const stateCities = STATE_CITIES[state] || [];
    setFilters(prev => {
      const currentCities = safeArray(prev.cities);
      const newCities = currentCities.filter(c => !stateCities.includes(c));
      return { ...prev, cities: newCities };
    });
  };

  // ============================================================
  // SAFE DERIVED VALUES
  // ============================================================
  const safeStates = safeArray(filters.states);
  const safeCities = safeArray(filters.cities);
  
  const isStateSelected = (state: string): boolean => safeStates.includes(state);
  const isCitySelected = (city: string): boolean => safeCities.includes(city);
  
  const getCityCountForState = (state: string): number => {
    const stateCities = STATE_CITIES[state] || [];
    return safeCities.filter(c => stateCities.includes(c)).length;
  };
  
  const canSave = filters.pan_india || safeStates.length > 0;

  // Filter states by search query
  const filteredStates = searchQuery
    ? STATES.filter(state => 
        state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (STATE_CITIES[state] || []).some(city => 
          city.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : STATES;

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading preferences...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Target Audience</h1>
                <p className="text-xs text-slate-500">
                  {safeStates.length} states, {safeCities.length} cities selected
                </p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Home size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">

        {/* Alerts */}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
            <Check size={20} className="text-green-600" />
            <span className="font-medium">Preferences saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Gender Selection */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Users size={20} className="text-purple-600" />
            Gender Preference
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'all', label: '👥 All' },
              { key: 'male', label: '👨 Male' },
              { key: 'female', label: '👩 Female' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilters(prev => ({ ...prev, gender: key }))}
                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                  filters.gender === key
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-100 hover:border-slate-300 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Pan India Toggle */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={togglePanIndia}
            className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
              filters.pan_india
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex gap-4 items-center">
              <div className={`p-3 rounded-full ${filters.pan_india ? 'bg-green-200' : 'bg-slate-100'}`}>
                <Globe size={24} className={filters.pan_india ? 'text-green-700' : 'text-slate-400'} />
              </div>
              <div className="text-left">
                <span className={`block font-bold text-lg ${filters.pan_india ? 'text-green-800' : 'text-slate-700'}`}>
                  All India (Pan India)
                </span>
                <span className="text-sm text-slate-500">
                  Receive leads from anywhere in India
                </span>
              </div>
            </div>
            
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              filters.pan_india ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'
            }`}>
              {filters.pan_india && <Check size={18} className="text-white" />}
            </div>
          </button>
        </div>

        {/* State/City Selection */}
        {!filters.pan_india && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2 text-slate-800">
                <MapPin size={20} className="text-blue-600" />
                Select Locations
              </h2>
              
              {safeStates.length > 0 && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, states: [], cities: [] }))}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search states or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              )}
            </div>

            {/* Summary */}
            {safeStates.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-700 text-sm font-medium">
                  📍 {safeStates.length} state(s) • {safeCities.length} city(ies) selected
                </span>
              </div>
            )}

            {/* State List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {filteredStates.map(state => {
                const isSelected = isStateSelected(state);
                const isExpanded = expandedState === state;
                const cities = STATE_CITIES[state] || [];
                const selectedCityCount = getCityCountForState(state);
                const allCitiesSelected = selectedCityCount === cities.length && cities.length > 0;

                return (
                  <div
                    key={state}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      isSelected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
                    }`}
                  >
                    {/* State Header */}
                    <div className="p-4 flex justify-between items-center">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => toggleState(state)}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        
                        <div>
                          <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {state}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">
                            ({cities.length} cities)
                          </span>
                          {selectedCityCount > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                              {selectedCityCount} selected
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedState(isExpanded ? null : state);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                        >
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Cities (Expanded) */}
                    {isExpanded && isSelected && (
                      <div className="px-4 pb-4 border-t border-blue-100">
                        {/* Select All / Deselect All */}
                        <div className="flex items-center justify-between mt-3 mb-3">
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            Select cities:
                          </p>
                          <div className="flex gap-2">
                            {!allCitiesSelected && (
                              <button
                                onClick={() => selectAllCitiesInState(state)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Select All
                              </button>
                            )}
                            {selectedCityCount > 0 && (
                              <button
                                onClick={() => deselectAllCitiesInState(state)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                          {cities.map(city => {
                            const citySelected = isCitySelected(city);
                            return (
                              <button
                                key={city}
                                onClick={() => toggleCity(city)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                  citySelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                              >
                                {city}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredStates.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Search size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No states found for "{searchQuery}"</p>
              </div>
            )}

            {safeStates.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-slate-400">
                <MapPin size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">Select at least one state</p>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="font-bold text-indigo-900 mb-3">📋 Current Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-indigo-700">Gender:</span>
              <span className="text-indigo-900 font-medium capitalize">{filters.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-700">Location:</span>
              <span className="text-indigo-900 font-medium">
                {filters.pan_india
                  ? 'All India'
                  : safeStates.length > 0
                    ? `${safeStates.length} state(s)`
                    : 'Not selected'}
              </span>
            </div>
            {!filters.pan_india && safeCities.length > 0 && (
              <div className="flex justify-between">
                <span className="text-indigo-700">Cities:</span>
                <span className="text-indigo-900 font-medium">{safeCities.length} selected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-slate-200 shadow-lg z-30">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-3 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Saving...
              </>
            ) : (
              <>
                <Save size={22} />
                Save Preferences
              </>
            )}
          </button>
          
          {!canSave && (
            <p className="text-center text-sm text-red-500 mt-2">
              Please enable Pan India or select at least one state
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TargetAudience;
