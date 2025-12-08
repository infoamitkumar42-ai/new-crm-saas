export interface User {
  id: string;
  email: string;
  name: string;
  sheet_url: string;
  payment_status: "active" | "inactive" | string;
  valid_until: string | null;
  filters: any;
  daily_limit: number;
  role: "user" | "admin" | string;
}

export interface FilterConfig {
  age_min: number;
  age_max: number;
  cities: string[];
  genders: string[];
  professions: string[];
  min_income: number;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  interval: 'daily' | 'weekly' | 'monthly';
  features: string[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  profession: string;
  age: number;
  status: 'New' | 'Distributed';
  assigned_to?: string;
}
