// COMPLETE USER DATA FROM CONVERSATION TERMINAL OUTPUTS
// Compiled from all command_status outputs in this conversation

const COMPLETE_USER_MAPPING = [
    // From first batch (Step 535 partial output)
    { name: 'Rajbinder', count: 47 },
    { name: 'Gurvinder Matharu', count: 10 },
    { name: 'Nazia Begam', count: 21 },
    { name: 'Kulwant Singh', count: 40 },
    { name: 'Baljeet kaur', count: 34 },
    { name: 'Raveena', count: 28 },
    { name: 'Sonia', count: 28 },
    { name: 'VEERPAL KAUR', count: 58 },
    { name: 'Manbir Singh', count: 46 },
    { name: 'Vinita punjabi', count: 63 },
    { name: 'Tanisha', count: 43 },
    { name: 'Ramandeep Kaur', count: 40 },
    { name: 'Anita', count: 27 },
    { name: 'Princy', count: 40 },
    { name: 'Saloni', count: 51 },
    { name: 'harpreet kaur', count: 1 },
    { name: 'Simran', count: 11 },
    { name: 'Rohit Kumar', count: 52 },
    { name: 'Harwinder kaur', count: 10 },
    { name: 'Akshay Sharma', count: 40 },
    { name: 'Mandeep kaur', count: 58 },
    { name: 'PARAMJIT KAUR', count: 36 },
    { name: 'Drishti Rani', count: 10 },
    { name: 'Navjot Kaur', count: 10 },
    { name: 'ranjodh singh', count: 42 },
    { name: 'Swati', count: 11 },
    { name: 'Sonia Chauhan', count: 56 },
    { name: 'Joyti kaur', count: 1 },
    { name: 'Rahul kumar', count: 51 },
    { name: 'Preeti', count: 48 },
    { name: 'MUSKAN', count: 35 },
    { name: 'Jaspreet Kaur', count: 32 },
    { name: 'Priya Arora', count: 32 },
    { name: 'Akash', count: 49 },
    { name: 'Navjot kaur', count: 29 },
    { name: 'Navjot Kaur', count: 38 },  // Note: duplicate name
    { name: 'Babita', count: 49 },
    { name: 'Ravenjeet Kaur', count: 93 },
    { name: 'Balraj singh', count: 66 },
    { name: 'Ajay kumar', count: 67 },
    { name: 'SAMAN', count: 71 },
    { name: 'Jashandeep kaur', count: 71 },
    { name: 'Jasdeep Kaur', count: 36 },
    { name: 'Payal', count: 50 },
    { name: 'Harmandeep kaur', count: 45 },
    { name: 'Neha', count: 65 },
    { name: 'Seerat', count: 42 },
    { name: 'Suman', count: 54 },
    { name: 'Himanshu Sharma', count: 78 },
    { name: 'Simran', count: 46 },  // Note: duplicate name
    { name: 'Rimpy Singh', count: 58 },
    { name: 'Sunaina Rani', count: 39 },
    { name: 'Gurdeep Singh', count: 46 },
    { name: 'Akshmala', count: 46 },
    { name: 'Arshdeep kaur', count: 36 },
    { name: 'Tanu Dhawan', count: 52 },
    { name: 'Rajinder', count: 60 },

    // From terminal: "The waiting was canceled" - these were being processed:
    { name: 'Tushte', count: 47 },
    { name: 'Loveleen kaur', count: 50 },
    { name: 'Kamal kaur', count: 39 },
    { name: 'Prabhjot kaur', count: 51 },
    { name: 'Mandeep kaur', count: 47 },  // Note: duplicate name
    { name: 'Shivani', count: 56 },
    { name: 'Loveleen', count: 43 },
    { name: 'Prince', count: 47 },
    { name: 'Sandeep Rehaan', count: 40 },
    { name: 'Naina Nawani', count: 47 },
    { name: 'Lalit kumar', count: 29 },
    { name: 'Divya Malik', count: 41 },
    { name: 'Prabhjeet kaur', count: 58 },
    { name: 'Gurpreet kaur', count: 58 }
];

// Total count
const totalLeadsInMapping = COMPLETE_USER_MAPPING.reduce((sum, u) => sum + u.count, 0);

console.log(`\nTotal users in mapping: ${COMPLETE_USER_MAPPING.length}`);
console.log(`Total leads to restore: ${totalLeadsInMapping}\n`);

// Export for use
module.exports = { COMPLETE_USER_MAPPING };
