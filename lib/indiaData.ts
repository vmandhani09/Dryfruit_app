// -----------------------------
// INDIA STATES (STATIC LIST)
// -----------------------------
export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh"
];

// -----------------------------
// INDIA CITIES BY STATE (STATIC)
// -----------------------------
const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Adoni", "Tenali", "Proddatur", "Chittoor", "Hindupur", "Bhimavaram", "Srikakulam", "Vizianagaram"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Aalo", "Tezu", "Roing", "Daporijo"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu", "North Lakhimpur", "Sivasagar", "Goalpara", "Karimganj", "Barpeta"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari", "Nawada", "Bagaha"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari", "Chirmiri", "Mahasamund", "Kanker"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Gandhidham", "Anand", "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad", "Vapi", "Gondal", "Veraval", "Godhra", "Patan"],
  "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Rewari", "Palwal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundernagar", "Chamba", "Una", "Kullu", "Bilaspur", "Hamirpur", "Manali"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chaibasa", "Phusro", "Dumka", "Chirkunda"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga", "Tumkur", "Raichur", "Bidar", "Hospet", "Hassan", "Udupi", "Chitradurga", "Bhadravati", "Mandya", "Chikmagalur", "Bagalkot", "Gangavati", "Ranebennur", "Kolar"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram", "Thalassery", "Kasaragod", "Kayamkulam", "Manjeri", "Vatakara", "Kanhangad", "Payyanur", "Thodupuzha", "Ponnani", "Perinthalmanna"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Morena", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Neemuch", "Hoshangabad", "Itarsi"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai", "Sangli", "Malegaon", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna", "Ambarnath", "Bhusawal", "Panvel", "Badlapur", "Beed", "Gondia", "Satara", "Barshi", "Yavatmal", "Achalpur", "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Hinganghat"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Senapati", "Ukhrul", "Chandel", "Tamenglong", "Jiribam"],
  "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara", "Williamnagar", "Nongpoh", "Resubelpara", "Mairang", "Cherrapunji"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha", "Lawngtlai", "Mamit", "Saitual", "Khawzawl"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Longleng", "Kiphire", "Peren"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Jeypore", "Bargarh", "Rayagada", "Paradip", "Bhawanipatna", "Dhenkanal", "Angul", "Kendrapara", "Sunabeda"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Firozpur", "Kapurthala", "Sangrur", "Faridkot", "Fazilka", "Gurdaspur", "Zirakpur", "Mansa", "Jagraon"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali", "Sri Ganganagar", "Hanumangarh", "Dhaulpur", "Tonk", "Beawar", "Kishangarh", "Nagaur", "Makrana", "Sujangarh", "Barmer", "Chittorgarh", "Churu", "Jhunjhunu", "Banswara", "Bundi", "Sawai Madhopur", "Jhalawar", "Sirohi", "Dausa", "Baran", "Rajsamand", "Karauli", "Pratapgarh", "Dungarpur", "Jaisalmer"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Singtam", "Jorethang", "Nayabazar", "Ravangla"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tirupur", "Ranipet", "Nagercoil", "Thanjavur", "Vellore", "Kanchipuram", "Erode", "Tiruvannamalai", "Pollachi", "Rajapalayam", "Sivakasi", "Pudukkottai", "Neyveli", "Nagapattinam", "Viluppuram", "Tindivanam", "Vaniyambadi", "Theni", "Cuddalore", "Kumbakonam", "Karur", "Udhagamandalam", "Hosur", "Dharmapuri", "Krishnagiri"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Miryalaguda", "Jagtial", "Mancherial", "Nirmal", "Kamareddy", "Kothagudem", "Bodhan", "Sangareddy", "Tandur", "Sircilla", "Medak", "Wanaparthy", "Narayanpet"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Khowai", "Ambassa", "Sonamura", "Kamalpur", "Sabroom"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Budaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Ayodhya", "Mau", "Hapur", "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar", "Unnao", "Jaunpur", "Lakhimpur", "Hathras", "Banda", "Pilibhit", "Barabanki", "Khurja", "Gonda", "Mainpuri", "Lalitpur", "Etah", "Deoria", "Ghazipur", "Sultanpur", "Azamgarh", "Bijnor", "Basti", "Chandausi", "Akbarpur", "Ballia", "Greater Noida"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Kotdwar", "Pithoragarh", "Ramnagar", "Manglaur", "Jaspur", "Bazpur", "Pauri", "Almora", "Tehri", "Bageshwar", "Chamoli", "Uttarkashi", "Champawat"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Chakdaha", "Darjeeling", "Alipurduar", "Purulia", "Jangipur", "Bolpur", "Bangaon", "Cooch Behar", "Tamluk", "Midnapore", "Contai", "Jhargram"],
  "Delhi": ["New Delhi", "Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Dwarka", "Rohini", "Saket", "Vasant Kunj", "Janakpuri", "Pitampura", "Karol Bagh", "Lajpat Nagar", "Rajouri Garden", "Greater Kailash", "Nehru Place", "Connaught Place"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kupwara", "Pulwama", "Kathua", "Udhampur", "Poonch", "Rajouri", "Doda", "Kishtwar", "Reasi", "Ramban", "Bandipora", "Ganderbal", "Kulgam", "Shopian", "Budgam"],
  "Ladakh": ["Leh", "Kargil", "Diskit", "Padum", "Nubra", "Turtuk", "Tangtse", "Nyoma"]
};

// ----------------------------------
// 🔥 GET CITIES BY STATE (STATIC - NO API CALL)
// ----------------------------------
export function fetchCitiesByState(state: string): Promise<string[]> {
  return Promise.resolve(CITIES_BY_STATE[state] || []);
}

// ----------------------------------
// 🔥 LIVE PINCODE VALIDATION
// ----------------------------------
export async function validatePincode(pin: string) {
  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    return { valid: false, message: "Invalid pincode format" };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();

    if (data[0].Status === "Success") {
      return {
        valid: true,
        state: data[0].PostOffice[0].State,
        district: data[0].PostOffice[0].District,
        message: "Valid pincode",
      };
    } else {
      return { valid: false, message: "Pincode not found" };
    }
  } catch (error) {
    console.error("Pincode validation failed:", error);
    return { valid: false, message: "Server error validating pincode" };
  }
}
