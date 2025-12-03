import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AuthView } from './views/Auth';
import { Dashboard } from './views/Dashboard';
import { FilterSettings } from './views/FilterSettings';
import { Subscription } from './views/Subscription';
import { AdminDashboard } from './views/AdminDashboard';
import { User, MOCK_USER, FilterConfig } from './types';

// Mock Auth wrapper
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load user from local storage mock
  useEffect(() => {
    const stored = localStorage.getItem('leadflow_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('leadflow_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('leadflow_user');
  };

  const updateFilters = async (filters: FilterConfig, dailyLimit: number) => {
    if (!user) return;
    const updated = { ...user, filters, daily_limit: dailyLimit };
    setUser(updated);
    localStorage.setItem('leadflow_user', JSON.stringify(updated));
    // Here you would call supabase.from('users').update(...)
  };

  const handlePaymentSuccess = (planId: string, paymentId: string) => {
    if (!user) return;
    const date = new Date();
    date.setDate(date.getDate() + (planId === 'daily' ? 1 : planId === 'weekly' ? 7 : 30));
    
    const updated = {
      ...user,
      payment_status: 'active' as const,
      valid_until: date.toISOString()
    };
    setUser(updated);
    localStorage.setItem('leadflow_user', JSON.stringify(updated));
    alert('Payment Successful! Your subscription is active.');
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={setActiveTab} 
      user={user}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <Dashboard user={user} />}
      {activeTab === 'filters' && <FilterSettings user={user} onUpdate={updateFilters} />}
      {activeTab === 'subscription' && <Subscription user={user} onPaymentSuccess={handlePaymentSuccess} />}
      {activeTab === 'settings' && <div className="p-4">Settings Placeholder</div>}
      {activeTab === 'admin' && <AdminDashboard />}
    </Layout>
  );
}