export type UserRole = 'admin' | 'manager' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  team_code?: string;
  manager_id?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  category: string;
  status: 'Fresh' | 'Call Back' | 'Interested' | 'Closed' | 'Rejected';
  notes: string;
  assigned_to: string;
  manager_id: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  [key: string]: any;
}

// ✅ NEW ADDITION: Payment Interface
export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  plan_name: string;
  razorpay_payment_id: string;
  created_at: string;
  users?: {
    email: string;
  } | null;
}
