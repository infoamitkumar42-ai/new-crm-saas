import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, MapPin, Calendar, ExternalLink } from 'lucide-react';

export const Dashboard = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('users').select('*').eq('id', user.id).single()
          .then(({ data }) => setUser(data));
      }
    });
  }, []);

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="text-slate-500 mb-2">Leads Today</div>
          <div className="text-4xl font-bold">{user.leads_today} <span className="text-lg text-slate-400">/ {user.daily_limit}</span></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="text-slate-500 mb-2">Plan Status</div>
          <div className="text-xl font-bold text-green-600 uppercase">{user.payment_status}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="text-slate-500 mb-2">Google Sheet</div>
          {user.sheet_url ? (
            <a href={user.sheet_url} target="_blank" className="text-blue-600 font-bold flex items-center gap-2">Open Sheet <ExternalLink size={16}/></a>
          ) : <span>Creating...</span>}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b font-bold">Recent Leads</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">City</th><th className="px-6 py-3">Budget</th></tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="px-6 py-4">Rahul S.</td><td className="px-6 py-4">Delhi</td><td className="px-6 py-4">₹50k+</td></tr>
              <tr><td className="px-6 py-4">Priya M.</td><td className="px-6 py-4">Mumbai</td><td className="px-6 py-4">₹1L+</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
