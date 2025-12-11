import React, { useEffect, useState } from 'react';
import { User, Lead } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, TrendingUp, Crown } from 'lucide-react'; // Icons for Upsell

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 🧠 UPSELL LOGIC ---
  // Agar limit 2 (Starter) ya 10 (Boost A) hai, to ye "Basic User" hai.
  // Inhe hum Locked Features dikhayenge.
  const isBasicUser = user.daily_limit <= 10 && user.daily_limit !== 5 && user.daily_limit !== 12 && user.daily_limit !== 20;

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data) {
           const mappedLeads: Lead[] = data.map((item: any) => ({
             id: item.id,
             name: item.name || 'Unknown',
             phone: item.phone || '',
             city: item.city || 'N/A',
             profession: '',
             age: 0,
             status: item.status || 'New',
           }));
           setLeads(mappedLeads);
        }
      } catch (err) {
        console.error("Error loading leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    // Real-time subscription
    const subscription = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, (payload) => {
          const newLead = payload.new as any;
          setLeads(prev => [{
             id: newLead.id,
             name: newLead.name,
             phone: newLead.phone,
             city: newLead.city,
             profession: '',
             age: 0,
             status: 'New'
          }, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  const calculateDaysLeft = (validUntil: string | null) => {
    if (!validUntil) return 0;
    const today = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysLeft = calculateDaysLeft(user.valid_until);

  const openWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const message = `Hi ${name}, I received your inquiry. Are you available for a call?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openSheet = () => {
    if (user.sheet_url) window.open(user.sheet_url, '_blank');
    else alert("Sheet not connected.");
  };

  return (
    <div className="space-y-6">
      
      {/* 🔴 PILLAR 2: RENEWAL COUNTDOWN (Retention) */}
      {daysLeft <= 3 && daysLeft > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex justify-between items-center shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800">Plan Expiring Soon!</p>
              <p className="text-sm text-amber-700">Only {daysLeft} days left. Recharge to keep leads flowing.</p>
            </div>
          </div>
          <a href="/subscription" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 shadow">Renew Now</a>
        </div>
      )}

      {/* 🚀 PILLAR 3: UPSELL BANNER (Growth) */}
      {isBasicUser && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-1 shadow-lg">
          <div className="bg-white rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                   <Crown className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-slate-900">Unlock "High Budget" Leads?</h3>
                   <p className="text-sm text-slate-500">Upgrade to <span className="font-bold text-indigo-600">Supervisor Plan</span> to see lead income & budget.</p>
                </div>
             </div>
             <button 
                onClick={() => window.location.href='/subscription'} // Simple redirect
                className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-md"
             >
                Upgrade Plan ⚡
             </button>
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Total Leads</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{leads.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Daily Limit</div>
          <div className="text-3xl font-bold text-brand-600 mt-2">{user.daily_limit}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Plan Status</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2 capitalize">{user.payment_status}</div>
        </div>
      </div>

      {/* Leads Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Recent Leads</h2>
          <button onClick={openSheet} className="flex items-center space-x-2 text-sm text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-2 rounded-lg">
            <span>Open Google Sheet</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">City</th>
                {/* 🔒 Locked Column Header */}
                <th className="px-6 py-4">
                    <div className="flex items-center gap-1">
                        Est. Budget {isBasicUser && <Lock className="w-3 h-3 text-slate-400" />}
                    </div>
                </th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{lead.phone}</td>
                  <td className="px-6 py-4">{lead.city}</td>
                  
                  {/* 🔒 Locked Column Logic */}
                  <td className="px-6 py-4">
                    {isBasicUser ? (
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-2 py-1 rounded w-fit text-xs font-bold select-none">
                            <Lock className="w-3 h-3" />
                            <span>Upgrade to View</span>
                        </div>
                    ) : (
                        <div className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>₹ High Potential</span>
                        </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => openWhatsApp(lead.phone, lead.name)}
                      className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <span>Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leads.length === 0 && !loading && (
            <div className="text-center p-8 text-slate-400">No leads yet. Waiting for new distribution...</div>
          )}
        </div>
      </div>
    </div>
  );
};
