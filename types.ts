export interface User {
  id: string;
  email: string;
  name: string;
  sheet_url: string;
  payment_status: 'active' | 'inactive';
  valid_until: string | null;
  role: 'user' | 'admin';
  filters: FilterConfig;
  daily_limit: number;
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

export const MOCK_USER: User = {
  id: '123-abc',
  email: 'demo@leadflow.com',
  name: 'Alex Demo',
  sheet_url: 'https://docs.google.com/spreadsheets/d/demo-sheet-id',
  payment_status: 'inactive',
  valid_until: null,
  role: 'user',
  daily_limit: 10,
  filters: {
    age_min: 25,
    age_max: 45,
    cities: ['New York', 'San Francisco'],
    genders: ['All'],
    professions: ['Software Engineer', 'Doctor'],
    min_income: 50000
  }
};