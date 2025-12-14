export type UserRole = 'admin' | 'manager' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  manager_id?: string | null;
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
  assigned_to: string; // Member ID
  manager_id: string;  // Manager ID
  uploaded_by?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired';
  end_date: string;
}
