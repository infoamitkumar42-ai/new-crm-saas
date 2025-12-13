const getPlanDetails = (planId: string) => {
  // Monthly Plans
  if (planId === 'new_member') return { days: 30, limit: 2, type: 'monthly' };
  if (planId === 'supervisor') return { days: 30, limit: 4, type: 'monthly' };
  if (planId === 'manager') return { days: 30, limit: 7, type: 'monthly' };
  
  // Boost Packs (7-Day Campaign Mode)
  if (planId === 'boost_a') return { days: 7, limit: 10, type: 'boost' };
  if (planId === 'boost_b') return { days: 7, limit: 17, type: 'boost' };
  if (planId === 'boost_c') return { days: 7, limit: 26, type: 'boost' };
  
  // Legacy support
  if (planId === 'starter_monthly') return { days: 30, limit: 2, type: 'monthly' };
  if (planId === 'growth_monthly') return { days: 30, limit: 4, type: 'monthly' };
  
  // Default
  return { days: 30, limit: 2, type: 'monthly' };
};
```

---

## 💰 **PROFIT CALCULATION (Boost Packs):**

### **Example: Boost Pack C (₹1999)**
```
User pays: ₹1999
Gets: 180 leads in 7 days

Your cost (Meta):
- If individual campaign: ₹9/lead × 180 = ₹1620
- Your margin: ₹379 (19%)

But with POOLING (50 users):
- Bulk campaign: ₹6/lead × 180 = ₹1080
- Your margin: ₹919 (46%) 🔥🔥🔥

Extra profit per Boost Pack: ₹500+
```

**Scale:**
- 10 Boost Packs/week = ₹5000 extra profit
- 40 Boost Packs/month = ₹20,000 extra profit
- All automated! 🚀

---

## 🎯 **PSYCHOLOGY WHY THIS WORKS:**

### **Monthly Plan User:**
```
Thinks: "Long term investment"
Personality: Patient, stable
Complaint rate: Medium
```

### **Boost Pack User:**
```
Thinks: "Campaign mode activated!"
Personality: Aggressive, hungry
Complaint rate: LOW (because fast delivery)
Renewal: HIGHER (they love speed)
