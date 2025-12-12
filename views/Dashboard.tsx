import React, { useEffect, useState } from 'react';
import { User, Lead } from '../types';
import { supabase } from '../supabaseClient';
import { Lock, TrendingUp, Crown, Phone, MessageCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // --- UPSELL LOGIC (Locked Features) ---
  // Agar user basic plan par hai (Limit <= 10), to features lock rahenge
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
        if (data) setLeads(data);
      } catch (err) {
        console.error("Error loading leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();

    // Real-time listener (Jaise hi lead aaye, turant dikhaye)
    const subscription = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `user_id=eq.${user.id}` }, (payload) => {
          setLeads(prev => [payload.new as Lead, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id]);

  // --- STATUS UPDATE (Interactive) ---
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdating(leadId);
    try {
        // 1. Instant UI Update (User ko wait na karna pade)
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));

        // 2. Database Save
        const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
        if (error) throw error;
    } catch (err) {
        alert("Update failed. Check internet.");
    } finally {
        setUpdating(null);
    }
  };

  // --- HELPERS ---
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
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const message = `Hi ${name}, I received your inquiry. Are you available for a call?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openSheet = () => {
    if (user.sheet_url) window.open(user.sheet_url, '_blank');
    else alert("Sheet not connected.");
  };

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 added for mobile scrolling space */}
      
      {/* 🔴 SECTION 1: RENEWAL ALERT (High Priority) */}
      {daysLeft <= 3 && daysLeft > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm animate-pulse mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-900 text-lg">Plan Expiring Soon!</p>
              <p className="text-sm text-amber-800">Only <span className="font-bold">{daysLeft} days left</span>. Renew now to keep leads flowing.</p>
            </div>
          </div>
          <button onClick={() => window.location.href='/subscription'} className="w-full sm:w-auto bg-amber-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-amber-700 shadow-md transition-transform active:scale-95">
            Renew Now
          </button>
        </div>
      )}

      {/* 🚀 SECTION 2: UPSELL BANNER (Visible Space) */}
      {isBasicUser && (
        <div className="mb-8 transform hover:scale-[1.01] transition-transform duration-300">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl p-0.5 shadow-xl">
            <div className="bg-white rounded-[10px] p-4 sm:p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 shadow-inner">
                    <Crown className="w-8 h-8" />
                    </div>
                    <div>
                    <h3 className="font-bold text-slate-900 text-lg">Unlock "High Budget" Leads?</h3>
                    <p className="text-sm text-slate-500">Upgrade to <span className="font-bold text-indigo-600">Supervisor Plan</span> to verify lead income.</p>
                    </div>
                </div>
                <button 
                    onClick={() => window.location.href='/subscription'} 
                    className="w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg"
                >
                    Upgrade Now ⚡
                </button>
            </div>
            </div>
        </div>
      )}

      {/* 📊 SECTION 3: STATS CARDS (BLUE THEME REQUESTED) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Leads */}
        <div className="bg-brand-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <p className="text-brand-100 text-sm font-medium uppercase tracking-wider">Total Leads</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{leads.length}</span>
                <span className="text-sm text-brand-200">received</span>
            </div>
        </div>

        {/* Card 2: Daily Limit */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-slate-200 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-brand-500 opacity-20 rounded-full blur-xl"></div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Daily Speed</p>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-400">{user.daily_limit}</span>
                <span className="text-sm text-slate-400">leads/day</span>
            </div>
        </div>

        {/* Card 3: Status */}
        <div className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden ${user.payment_status === 'active' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-red-500 shadow-red-200'}`}>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Plan Status</p>
            <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-bold capitalize">{user.payment_status}</span>
                {user.payment_status === 'active' && <div className="h-3 w-3 rounded-full bg-white animate-pulse"></div>}
            </div>
        </div>
      </div>

      {/* 📋 SECTION 4: LEADS TABLE (Mobile Optimized) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        {/* Table Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Leads</h2>
            <p className="text-xs text-slate-500 mt-1">Updates are saved automatically.</p>
          </div>
          <button onClick={openSheet} className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2.5 rounded-lg font-bold transition-colors">
             <span className="text-lg">📄</span> Open Google Sheet
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            {/* Blue Header Row */}
            <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-900 text-base">{lead.name}</td>
                  <td className="px-6 py-5 font-mono text-slate-500">{lead.phone}</td>
                  <td className="px-6 py-5 text-slate-700 font-medium">{lead.city}</td>
                  
                  {/* 🟢 Interactive Status (Solid UI) */}
                  <td className="px-6 py-5">
                    <div className="relative">
                        <select 
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            disabled={updating === lead.id}
                            className={`
                              appearance-none w-40 pl-4 pr-8 py-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer shadow-sm transition-all
                              ${lead.status === 'New' ? 'bg-white border-slate-300 text-slate-700' : ''}
                              ${lead.status === 'Interested' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : ''}
                              ${lead.status === 'Call Later' ? 'bg-amber-50 border-amber-300 text-amber-700' : ''}
                              ${lead.status === 'Rejected' ? 'bg-red-50 border-red-300 text-red-700' : ''}
                              hover:shadow-md focus:ring-2 focus:ring-brand-500
                            `}
                        >
                            <option value="New">🔵 New Lead</option>
                            <option value="Interested">✅ Interested</option>
                            <option value="Call Later">🕒 Call Later</option>
                            <option value="Rejected">❌ Rejected</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                  </td>

                  {/* 🔒 Locked Column */}
                  <td className="px-6 py-5">
                    {isBasicUser ? (
                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-md w-fit text-xs font-bold border border-slate-200 select-none">
                            <Lock className="w-3 h-3" />
                            <span>Upgrade</span>
                        </div>
                    ) : (
                        <div className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100 font-bold text-xs flex items-center gap-1.5 w-fit">
                            <TrendingUp className="w-3 h-3" />
                            <span>High Value</span>
                        </div>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <button
                      onClick={() => openWhatsApp(lead.phone, lead.name)}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leads.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                 <Lock className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-bold text-lg">No leads available yet</p>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                 New leads are distributed daily at 9:00 AM based on your plan limit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
