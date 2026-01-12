# 📡 Meta Webhook Setup Guide (Step 3)

## Kahan Jana Hai?

1. **Meta Developer Portal** kholo: https://developers.facebook.com/apps/
2. **"LeadFlow Pro CRM"** app ko select karo (jo tumne abhi banaya hai)

---

## Webhook Configure Kaise Karein?

### **Step 3.1: Webhooks Section mein Jao**
- Left side mein **black sidebar** dikhega
- Scroll karke **"Webhooks"** option dhoondho aur click karo

### **Step 3.2: Page Object Select Karo**
- Upar ek **dropdown** dikhega jahan **"User"** ya kuch aur likha hoga
- Us dropdown ko click karke **"Page"** select karo

### **Step 3.3: Subscribe Button Dabao**
- Ab tum **"Page"** section mein ho
- Ek blue button dikhega: **"Subscribe to this object"** (ya **"Edit Subscription"**)
- Use dabao

### **Step 3.4: URL aur Token Dalo**
Ek popup window khulegi jahan 2 boxes honge:

**Box 1 - Callback URL:**
```
https://[aapka-supabase-project].supabase.co/functions/v1/meta-webhook
```
*(Ye URL deployment ke baad milega, abhi blank chhod sakte ho)*

**Box 2 - Verify Token:**
```
LeadFlow_Meta_2026_Premium
```

- **"Verify and Save"** button daba do

### **Step 3.5: Leadgen Subscribe Karo**
- Popup close hone ke baad, niche bahut saari **fields** (rows) dikhengi
- Search box mein **"leadgen"** type karo
- **"leadgen"** row ke samne **"Subscribe"** button dikhega
- Use daba do

---

## ✅ Done!

Jab ye steps complete ho jayenge, Meta tumhe har lead instantly webhook par bhejega.

---

**Abhi ka status:** Supabase CLI install ho raha hai, uske baad deployment hogi aur URL milega!
