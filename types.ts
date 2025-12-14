export type UserRole = 'admin' | 'manager' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  team_code?: string;      // Manager ka Code
  manager_id?: string;     // Link to Manager
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
  created_at: string;
}

// User interface for Auth Context compatibility
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  [key: string]: any;
}
