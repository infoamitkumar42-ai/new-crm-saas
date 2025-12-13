import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, AlertTriangle, Clock, Zap, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { UpsellModal } from '../components/UpsellModal'; 

interface UserData {
  id: string;
  email: string;
  payment_status: string;
  daily_limit: number;
  leads_today: number;
  valid_until: string | null;
  sheet_url?: string;
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

  // Renewal Status Logic
  const getRenewalStatus = () => {
    if (!user || !user.valid_until) return null;
    const today = new Date();
    const expiry = new Date(user.valid_until);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { type: 'expired', days: 0 };
    if (daysLeft <= 3) return { type: 'critical', days: daysLeft };
    if (daysLeft <= 7) return { type: 'warning', days: daysLeft };
    return null;
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!user) return <div className="p-8 text-center">Please log in.</div>;

  const renewalStatus = getRenewalStatus();

  return (
    <div className="space-y-8">
      
      {/* 1. UPSELL POPUP */}
      <UpsellModal user={user} />

      {/* 2. RENEWAL BANNERS */}
      {renewalStatus?.type === 'expired' && (
        <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-10 h-10" />
            <div>
              <h3 className="text-xl font-bold">Plan Expired!</h3>
              <p className="text-red-100 text-sm">Renew now to continue receiving leads.</p>
            </div>
          </div>
          <button onClick={() => window.location.href = '/subscription'} className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold">Renew Now</button>
        </div>
      )}

      {renewalStatus?.type === 'critical' && (
        <div className="bg-amber-50 border border-amber-500 p-4 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Clock className="text-amber-600" />
             <span className="text-amber-900 font-bold">Only {renewalStatus.days} days left!</span>
          </div>
          <button onClick={() => window.location.href = '/subscription'} className="text-amber-700 font-bold text-sm underline">Renew</button>
        </div>
      )}

      {/* 3. MAIN STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Plan Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.payment_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {user.payment_status?.toUpperCase()}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Valid Until: {user.valid_until ? new Date(user.valid_until).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        {/* Google Sheet Link */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-full -mr-8 -mt-8"></div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-slate-500 font-medium">Your Lead Sheet</span>
                 <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Sheets" className="h-6 w-6" />
              </div>
              {user.sheet_url ? (
                 <a 
                   href={user.sheet_url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 text-green-700 font-bold hover:underline mt-2"
                 >
                   Open Sheet <ExternalLink size={16} />
                 </a>
              ) : (
                 <span className="text-slate-400 text-sm">Sheet creating...</span>
              )}
           </div>
        </div>
      </div>

      {/* 4. RECENT LEADS TABLE (Jo gayab ho gaya tha, wapas aa gaya!) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 text-lg">Recent Leads</h2>
          <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
        </div>
        
        {/* Placeholder Table (Real data sheet mein hai) */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">City</th>
                <th className="px-6 py-3">Event Date</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Dummy Data for Display - Real sync happens in Sheets */}
              <tr className="hover:bg-slate-50">
                 <td className="px-6 py-4 font-medium text-slate-900">Rahul Sharma</td>
                 <td className="px-6 py-4"><span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> Delhi</span></td>
                 <td className="px-6 py-4"><span className="flex items-center gap-1"><Calendar size={14} className="text-slate-400"/> 24 Dec</span></td>
                 <td className="px-6 py-4">₹50k - 1L</td>
                 <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Sent to Sheet</span></td>
              </tr>
              <tr className="hover:bg-slate-50">
                 <td className="px-6 py-4 font-medium text-slate-900">Priya Verma</td>
                 <td className="px-6 py-4"><span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> Mumbai</span></td>
                 <td className="px-6 py-4"><span className="flex items-center gap-1"><Calendar size={14} className="text-slate-400"/> 12 Jan</span></td>
                 <td className="px-6 py-4">₹1L+</td>
                 <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Sent to Sheet</span></td>
              </tr>
            </tbody>
          </table>
          <div className="p-8 text-center text-slate-500 text-sm border-t border-slate-100 bg-slate-50/50">
            <p>Leads are automatically synced to your <strong className="text-slate-700">Google Sheet</strong> instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
