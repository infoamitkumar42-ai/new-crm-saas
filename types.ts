// src/types.ts

export interface FilterConfig {
  age_min?: number;       // '?' lagaya hai taaki agar value na ho to error na aaye
  age_max?: number;
  cities?: string[];      // City filtering ke liye
  genders?: string[];
  professions?: string[];
  min_income?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  sheet_url?: string;     // '?' lagaya kyunki shuru mein sheet_url null ho sakta hai
  payment_status: "active" | "inactive" | string;
  valid_until?: string | null;
  daily_limit: number;
  role: "user" | "admin" | string;
  filters: FilterConfig;  // ✅ Yahan 'any' hata kar 'FilterConfig' kar diya
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
