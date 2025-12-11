// Old code hatao, ye logic lagao:
// ...
        // Determine Plan Duration based on amount (paise)
        let durationDays = 0;
        let planType = '';
        
        // 999 * 100 = 99900 paise
        if (amount === 99900) { 
            // Check planId from notes agar possible ho, varna default logic
            // Monthly Starter ya Boost A dono 999 hain.
            // Isliye hume payment.notes.planId check karna padega (Next step mein sikhauga)
            durationDays = 30; // Default safe
            planType = 'monthly'; 
        }
        else if (amount === 199900) { durationDays = 30; planType = 'monthly'; } // 1999
        else if (amount === 499900) { durationDays = 30; planType = 'monthly'; } // 4999
        else {
            durationDays = 7; // Default fallback
            planType = 'weekly';
        }
// ...
