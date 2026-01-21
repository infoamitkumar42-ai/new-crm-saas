# LeadFlow CRM - Product Requirements Document (PRD)
## Version 2.0 | Last Updated: January 21, 2026

---

## 📋 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Target Audience](#2-target-audience)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Subscription Plans](#6-subscription-plans)
7. [Core Features](#7-core-features)
8. [Lead Distribution System](#8-lead-distribution-system)
9. [API & Webhooks](#9-api--webhooks)
10. [File Structure](#10-file-structure)
11. [Business Rules](#11-business-rules)
12. [Current Metrics](#12-current-metrics)
13. [Known Issues & Roadmap](#13-known-issues--roadmap)

---

## 1. Executive Summary

### 1.1 Product Name
**LeadFlow CRM** - A SaaS-based lead management and distribution system.

### 1.2 Product URL
- **Production:** https://www.leadflowcrm.in/
- **Backend:** Supabase (PostgreSQL + Edge Functions)

### 1.3 Problem Statement
Network marketers (especially Forever Living Product distributors and MLM professionals) struggle to find quality leads for team building. Traditional methods like cold calling, approaching friends/family are ineffective and time-consuming.

### 1.4 Solution
LeadFlow CRM provides a automated lead generation and distribution system that:
- Generates leads from Meta (Facebook/Instagram) ads
- Distributes leads fairly to subscribed users based on their plan
- Delivers leads directly to user's WhatsApp
- Provides a dashboard to track and manage leads

### 1.5 Value Proposition
- **For Users:** Get 5-14 fresh, interested leads daily without cold calling
- **For Business:** Recurring revenue through subscription plans

---

## 2. Target Audience

### 2.1 Primary Users
| Segment | Description |
|---------|-------------|
| **Forever Living Distributors** | MLM network marketers selling health/wellness products |
| **Network Marketers** | Any MLM/direct selling professionals |
| **Insurance Agents** | Looking for fresh policy leads |
| **Recruiters** | Finding candidates for network marketing teams |

### 2.2 User Demographics
- **Location:** Primarily India (Punjab, Haryana, Delhi NCR, Rajasthan)
- **Age:** 22-45 years
- **Language:** Hindi/Punjabi preferred
- **Device:** 80% Mobile, 20% Desktop

### 2.3 User Pain Points
1. Exhausted personal network (friends/family)
2. Cold calling rejection fatigue
3. Low quality purchased lead lists
4. Time wasted on uninterested prospects
5. No systematic lead management

---

## 3. Tech Stack

### 3.1 Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling framework |
| **Lucide React** | Icon library |

### 3.2 Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Primary database |
| **Supabase Edge Functions** | Serverless functions (Deno) |
| **Supabase Auth** | User authentication |
| **Supabase Realtime** | Live data subscriptions |

### 3.3 External Services
| Service | Purpose |
|---------|---------|
| **Razorpay** | Payment gateway (INR) |
| **Meta Ads** | Lead generation source |
| **Google Apps Script** | Email automation, manual operations |
| **WhatsApp** | Lead delivery notifications |

### 3.4 Hosting
- **Frontend:** Vercel / Netlify
- **Backend:** Supabase Cloud
- **Domain:** leadflowcrm.in

---

## 4. Database Schema

### 4.1 Users Table (`public.users`)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'member', -- 'admin', 'manager', 'member'
    
    -- Plan Details
    plan_name TEXT, -- 'starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost', 'none'
    plan_weight INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 0,
    total_leads_promised INTEGER DEFAULT 0,
    total_leads_received INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    payment_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'pending'
    
    -- Dates
    plan_start_date TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    days_extended INTEGER DEFAULT 0,
    
    -- Relationships
    manager_id UUID REFERENCES users(id),
    team_code TEXT,
    
    -- Tracking
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Leads Table (`public.leads`)
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- NULL = unassigned
    
    -- Lead Info
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT,
    state TEXT,
    
    -- Meta Data
    source TEXT, -- 'Meta - Work With Himanshu Sharma', 'facebook', etc.
    campaign_id TEXT,
    ad_id TEXT,
    form_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'Fresh', -- 'Fresh', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Invalid'
    notes TEXT,
    
    -- Tracking
    assigned_at TIMESTAMPTZ,
    contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Orphan Leads Table (`public.orphan_leads`)
```sql
CREATE TABLE orphan_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    phone TEXT,
    city TEXT,
    miss_reason TEXT, -- Why lead wasn't assigned
    status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'deleted'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Key Indexes
```sql
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy
```
Admin (Full Access)
  └── Manager (Team Lead)
        └── Member (End User)
```

### 5.2 Role Permissions

| Permission | Admin | Manager | Member |
|------------|-------|---------|--------|
| View All Users | ✅ | ❌ | ❌ |
| Edit User Plans | ✅ | ❌ | ❌ |
| Stop/Start Users | ✅ | ❌ | ❌ |
| View All Leads | ✅ | Team Only | Own Only |
| Upload Leads | ✅ | ❌ | ❌ |
| Analytics Dashboard | ✅ | Limited | Basic |
| Export Data | ✅ | ✅ | Own Only |
| Manage Own Leads | ✅ | ✅ | ✅ |
| Pause/Resume Delivery | ✅ | ✅ | ✅ |

### 5.3 Admin Accounts
- `info.amitkumar42@gmail.com` - Super Admin

---

## 6. Subscription Plans

### 6.1 Plan Configuration

| Plan | Price | Duration | Daily Leads | Total Leads | Priority Weight |
|------|-------|----------|-------------|-------------|-----------------|
| **Starter** | ₹999 | 10 days | 5 | 50 | 1 (Low) |
| **Supervisor** | ₹1,999 | 15 days | 7 | 105 (+10 replacement = 115) | 3 (Medium) |
| **Manager** | ₹2,999 | 20 days | 8 | 160 | 5 (High) |
| **Weekly Boost** | ₹1,999 | 7 days | 12 | 84 | 7 (Turbo) |
| **Turbo Boost** | ₹2,499 | 7 days | 14 | 98 | 9 (Ultra) |

### 6.2 Plan Features

| Feature | Starter | Supervisor | Manager | Weekly | Turbo |
|---------|---------|------------|---------|--------|-------|
| Invalid Lead Replacement | 5 | 10 | 16 | 8 | 10 |
| Priority Queue | Standard | 3x Faster | 5x Faster | 7x | Always #1 |
| WhatsApp Alerts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | Basic | Full | Advanced | Full | Premium |
| Support | Email | Priority | Dedicated | Priority | 24/7 |

### 6.3 Profit Analysis (at ₹12/lead cost)

| Plan | Revenue | Lead Cost | Profit | Margin |
|------|---------|-----------|--------|--------|
| Starter | ₹999 | ₹600 | ₹399 | 40% |
| Supervisor | ₹1,999 | ₹1,260 | ₹739 | 37% |
| Manager | ₹2,999 | ₹1,920 | ₹1,079 | 36% |
| Weekly Boost | ₹1,999 | ₹1,008 | ₹991 | 50% |
| Turbo Boost | ₹2,499 | ₹1,176 | ₹1,323 | 53% |

---

## 7. Core Features

### 7.1 User Dashboard (Member)
- **Lead Statistics:** Today's leads, total leads, remaining quota
- **Lead List:** Filterable, searchable list of all received leads
- **Lead Actions:** Mark status, add notes, report invalid
- **Pause/Resume:** Toggle lead delivery
- **Plan Info:** Current plan, expiry date, progress bar
- **Notifications:** Real-time lead alerts

### 7.2 Admin Dashboard
- **System Stats:** Total users, active users, leads distributed
- **User Management:** View/edit all users, activate plans, stop users
- **Lead Analytics:** Hourly distribution, source breakdown
- **Orphan Leads:** Unassigned leads management
- **Bulk Operations:** CSV export, bulk upload

### 7.3 Subscription Flow
1. User clicks "Subscribe" on plan
2. Razorpay modal opens
3. User completes payment
4. `/api/create-order` verifies payment
5. User profile updated with plan details
6. Dashboard refreshes with active plan

### 7.4 Lead Delivery Flow
1. Meta webhook receives new lead
2. Lead validated (10-digit Indian number, no duplicates)
3. Eligible users queried (active, within daily limit)
4. Lead assigned to user based on priority algorithm
5. WhatsApp notification sent to user
6. Lead appears in user's dashboard

---

## 8. Lead Distribution System

### 8.1 Distribution Algorithm (OPEN Strategy)

```typescript
// Priority Weights (Higher = First Priority)
const PRIORITY_WEIGHTS = {
    turbo_boost: 100,
    weekly_boost: 95,
    manager: 90,
    supervisor: 30,
    starter: 10
};

// Distribution Logic
1. Get all eligible users:
   - is_active = true
   - payment_status = 'active'
   - plan_name NOT IN ('none', null)
   - today_leads < daily_limit
   - total_leads < total_leads_promised

2. Sort by:
   - plan_weight DESC (higher plans first)
   - leads_today ASC (fewer leads today = higher priority)
   - random() (fairness within same criteria)

3. Assign lead to top user
4. Update user's lead counts
5. Send WhatsApp notification
```

### 8.2 Fair Batching
- Maximum 2 leads per round per user
- Prevents single user from hogging all leads
- Cycles through all eligible users before repeating

### 8.3 Backlog Processing
- Edge Function: `process-backlog-v28-OPEN.ts`
- Runs every 1 minute via Supabase CRON
- Processes unassigned leads from queue
- Handles edge cases (user went inactive, limit reached)

### 8.4 Webhook Integration
- **Endpoint:** `https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/meta-webhook-v28-OPEN`
- **Method:** POST
- **Source:** Meta Lead Ads
- **Validation:** Phone format, duplicate check, spam detection

---

## 9. API & Webhooks

### 9.1 Supabase Edge Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| `meta-webhook-v28-OPEN` | Receive & distribute Meta leads | HTTP POST from Meta |
| `process-backlog-v28-OPEN` | Process pending leads | CRON (every 1 min) |
| `get_admin_dashboard_data` | Admin analytics RPC | Dashboard load |

### 9.2 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/create-order` | POST | Create Razorpay order & verify payment |
| `/api/user/profile` | GET | Get current user profile |
| `/api/leads` | GET | Get user's leads |

### 9.3 Supabase RPC Functions

```sql
-- Admin Dashboard Data
CREATE FUNCTION get_admin_dashboard_data()
RETURNS JSON AS $$
  -- Returns user stats, lead stats, hourly activity, plan analytics
$$;
```

---

## 10. File Structure

```
new-crm-saas/
├── src/
│   ├── components/
│   │   ├── Subscription.tsx      # Plan selection & payment
│   │   ├── UserQuickEdit.tsx     # Admin user editing
│   │   └── ...
│   ├── views/
│   │   ├── MemberDashboard.tsx   # User dashboard
│   │   ├── AdminDashboard.tsx    # Admin dashboard
│   │   └── LoginPage.tsx         # Authentication
│   └── supabaseClient.ts         # Supabase connection
│
├── gas-v15/                       # Google Apps Scripts & SQL
│   ├── meta-webhook-v28-OPEN.ts  # Lead webhook (Supabase Edge)
│   ├── process-backlog-v28-OPEN.ts # Backlog processor
│   ├── Send_Renewal_Emails.gs    # Email automation
│   ├── Convert_Inactive_Users.gs # Marketing emails
│   └── *.sql                     # Database operations
│
├── api/
│   └── create-order.ts           # Razorpay integration
│
├── public/
│   └── assets/
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── PRD.md                        # This document
```

---

## 11. Business Rules

### 11.1 User Lifecycle

```
User Signup → Free Account (no leads)
     ↓
Purchase Plan → Active (receiving leads)
     ↓
Quota Complete OR Plan Expired → Stopped (renewal needed)
     ↓
Renewal → Active again
```

### 11.2 Plan Stopping Rules
1. **Auto-Stop when:** `total_leads_received >= total_leads_promised`
2. **Manual Stop:** Admin sets `is_active = false, daily_limit = 0, payment_status = 'inactive'`
3. **Self-Pause:** User toggles pause (only `is_active = false`, payment_status stays 'active')

### 11.3 Lead Validation Rules
1. Phone must be 10 digits
2. Must start with 6, 7, 8, or 9 (Indian mobile)
3. No duplicate phone in last 30 days
4. Name cannot be empty or "test"

### 11.4 Invalid Lead Replacement
- Users can report leads as "Invalid"
- Admin reviews and approves replacement
- `total_leads_promised` increased by 1 per valid replacement
- Supervisor plan gets 10 extra leads pre-added (115 instead of 105)

---

## 12. Current Metrics (Jan 21, 2026)

### 12.1 User Metrics
| Metric | Count |
|--------|-------|
| Total Users | 135 |
| Active Paid Users | 59 |
| Stopped (Quota Done) | 15 |
| Self-Paused | 9 |
| Inactive/Unpaid | 52 |

### 12.2 Lead Metrics
| Metric | Count |
|--------|-------|
| Total Leads in DB | ~5,500 |
| Leads Distributed | ~4,700 |
| Stuck/Unassigned | ~740 |
| Average Daily Generation | ~450 leads |

### 12.3 Revenue Metrics
| Metric | Value |
|--------|-------|
| Active Users | 59 |
| Estimated MRR | ~₹1,00,000 |
| Lead Cost | ₹12/lead |
| Gross Margin | ~40% |

---

## 13. Known Issues & Roadmap

### 13.1 Current Issues
1. **Stale Backlog:** 740+ unassigned leads from old campaigns
2. **Profile Sync Delay:** Dashboard sometimes shows cached data
3. **WhatsApp Delivery:** Occasional delays in notifications

### 13.2 Future Roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| High | Auto-stop when quota complete | Manual currently |
| High | Mobile app (PWA) | Planned |
| Medium | Team management features | Planned |
| Medium | Lead quality scoring | Planned |
| Low | Custom lead sources | Backlog |
| Low | API for third-party integration | Backlog |

### 13.3 Recent Updates (Jan 2026)
- ✅ Fixed lead distribution priority (Turbo > Weekly > Manager > Supervisor > Starter)
- ✅ Added +10 replacement leads for Supervisor plan
- ✅ Implemented fair batching (max 2 leads per round)
- ✅ Fixed dashboard sync issues
- ✅ Added renewal email system
- ✅ Stopped 15 over-quota users

---

## 14. Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://vewqzsqddgmkslnuctvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (Server-side only)

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=... (Server-side only)
```

---

## 15. Contact & Support

- **Admin:** info.amitkumar42@gmail.com
- **Technical:** Amit Kumar
- **Support Hours:** 9 AM - 10 PM IST

---

*Document maintained by LeadFlow CRM Team*
*Last Updated: January 21, 2026*
