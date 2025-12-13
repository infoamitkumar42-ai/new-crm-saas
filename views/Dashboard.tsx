import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, AlertTriangle, Clock, Zap } from 'lucide-react';
import { UpsellModal } from '../components/UpsellModal'; // 👇 New Component Import

interface UserData {
  id: string;
  email: string;
  payment_status: string;
  daily_limit: number;
  leads_today: number;
  valid_until: string | null;
}

export const Dashboard = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Renewal Status Logic
  const getRenewalStatus = () => {
    if (!user || !user.valid_until) return null;
    
    const today = new Date();
    const expiry = new Date(user.valid_until);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return { type: 'expired', days: 0, urgent: true };
    } else if (daysLeft <= 3) {
      return { type: 'critical', days: daysLeft, urgent: true };
    } else if (daysLeft <= 7) {
      return { type: 'warning', days: daysLeft, urgent: false };
    }
    return null;
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!user) return <div className="p-8 text-center">Please log in.</div>;

  const renewalStatus = getRenewalStatus();

  return (
    <div className="space-y-8">
      
      {/* 👇 1. UPSELL POPUP (Automatically shows properly) */}
      <UpsellModal user={user} />

      {/* 👇 2. RENEWAL BANNERS (Different colors based on urgency) */}
      
      {/* RED: Expired */}
      {renewalStatus && renewalStatus.type === 'expired' && (
        <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden animate-pulse">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-12 h-12 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-black">Plan Expired!</h3>
                <p className="text-red-100 text-sm mt-1">Your lead distribution has stopped. Renew now to continue.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/subscription'}
              className="bg-white text-red-600 px-8 py-4 rounded-xl font-black hover:bg-red-50 shadow-2xl w-full md:w-auto"
            >
              Renew Now 🔥
            </button>
          </div>
        </div>
      )}

      {/* AMBER: Critical (Less than 3 days) */}
      {renewalStatus && renewalStatus.type === 'critical' && (
        <div className="bg-amber-50 border-2 border-amber-500 p-5 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-10 h-10 text-amber-600" />
              <div>
                <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                  Only {renewalStatus.days} Day{renewalStatus.days > 1 ? 's' : ''} Left!
                </h3>
                <p className="text-amber-800 text-sm">Don't lose your daily leads. Renew before it's too late.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/subscription'}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-700 w-full md:w-auto"
            >
              Renew Plan →
            </button>
          </div>
        </div>
      )}

      {/* BLUE: Warning (Less than 7 days) */}
      {renewalStatus && renewalStatus.type === 'warning' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Heads up:</strong> Your plan expires in {renewalStatus.days} days. 
              <a href="/subscription" className="underline ml-1 font-bold">Renew early.</a>
            </p>
          </div>
        </div>
      )}

      {/* Main Stats (Existing Code) */}
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Account Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              user.payment_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {user.payment_status?.toUpperCase()}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {user.daily_limit} Leads/Day
          </div>
        </div>

        {/* Leads Today */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Leads Today</span>
            <LayoutDashboard className="text-blue-500" />
          </div>
          <div className="text-4xl font-black text-slate-900">
            {user.leads_today} <span className="text-lg text-slate-400 font-normal">/ {user.daily_limit}</span>
          </div>
        </div>

        {/* Valid Until */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Valid Until</span>
            <Clock className="text-purple-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {user.valid_until ? new Date(user.valid_until).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
