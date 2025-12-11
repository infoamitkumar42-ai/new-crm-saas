import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { User } from "../types";
import { Card } from "../components/UI";
import { ENV } from "../config/env";

interface AdminDashboardProps {
  user?: User; 
}

interface LeadSummary {
  total_leads: number;
  distributed_leads: number;
  fresh_leads: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [leadSummary, setLeadSummary] = useState<LeadSummary | null>(null);

  // --- DATA LOADING ---
  const loadData = async () => {
    setLoading(true);
    try {
      // Users Fetch karo
      const { data: userRows, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(userRows || []);

      // Apps Script se Summary lao (Agar URL hai to)
      if (ENV.APPS_SCRIPT_URL && !ENV.APPS_SCRIPT_URL.includes('PLACEHOLDER')) {
         try {
            const res = await fetch(`${ENV.APPS_SCRIPT_URL}?action=summary`);
            if (res.ok) {
               const json = await res.json();
               setLeadSummary(json);
            }
         } catch (e) { console.warn("Summary fetch failed"); }
      }
    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") loadData();
  }, [user]);

  // --- ⚡ MANUAL ACTIVATION LOGIC (GOD MODE) ---
  const activateUser = async (targetUserId: string, planType: 'starter' | 'boost' | 'stop') => {
    setActionLoading(targetUserId);
    try {
      let updates = {};
      const today = new Date();

      if (planType === 'starter') {
         // Give 30 Days (Monthly)
         const expiry = new Date();
         expiry.setDate(today.getDate() + 30);
         updates = { 
            payment_status: 'active', 
            daily_limit: 2, 
            valid_until: expiry.toISOString(),
            plan_id: 'manual_starter'
         };
      } else if (planType === 'boost') {
         // Give 7 Days (Weekly Beast)
         const expiry = new Date();
         expiry.setDate(today.getDate() + 7);
         updates = { 
            payment_status: 'active', 
            daily_limit: 10, 
            valid_until: expiry.toISOString(),
            plan_id: 'manual_boost'
         };
      } else {
         // Deactivate (Stop)
         updates = { 
            payment_status: 'inactive', 
            daily_limit: 0, 
            valid_until: null 
         };
      }

      const { error } = await supabase.from('users').update(updates).eq('id', targetUserId);
      if (error) throw error;
      
      await loadData(); // Refresh list
      alert(`User Updated to: ${planType.toUpperCase()}`);

    } catch (err: any) {
      alert("Update Failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== "admin") return <div className="p-6 text-red-600">Access Denied</div>;
  if (loading) return <div className="p-6 text-slate-500">Loading Admin Panel...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Admin Control Center 🎛️</h2>
        <p className="text-slate-500">Manage users and force-activate plans for testing.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-slate-900 text-white">
          <div className="text-xs text-slate-400 uppercase">Total Users</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="text-xs text-emerald-600 uppercase">Active Users</div>
          <div className="text-2xl font-bold text-emerald-700">
            {users.filter(u => u.payment_status === 'active').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase">Leads Distributed</div>
          <div className="text-2xl font-bold">{leadSummary?.distributed_leads || '-'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase">Fresh Inventory</div>
          <div className="text-2xl font-bold text-brand-600">{leadSummary?.fresh_leads || '-'}</div>
        </Card>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
           <h3 className="font-bold text-slate-800">User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Limit</th>
                <th className="px-6 py-3">Expiry</th>
                <th className="px-6 py-3 text-center">⚡ Quick Actions (God Mode)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">{u.name || 'No Name'}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.payment_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.payment_status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono">{u.daily_limit || 0}/day</td>
                  <td className="px-6 py-3 text-xs">
                     {u.valid_until ? new Date(u.valid_until).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-3 flex justify-center gap-2">
                    {/* ACTION BUTTONS */}
                    <button 
                      onClick={() => activateUser(u.id, 'starter')}
                      disabled={actionLoading === u.id}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-xs hover:bg-slate-50 shadow-sm"
                    >
                      Give Monthly
                    </button>
                    <button 
                      onClick={() => activateUser(u.id, 'boost')}
                      disabled={actionLoading === u.id}
                      className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs hover:bg-amber-200 font-bold shadow-sm"
                    >
                      Give Boost 🔥
                    </button>
                    {u.payment_status === 'active' && (
                        <button 
                          onClick={() => activateUser(u.id, 'stop')}
                          disabled={actionLoading === u.id}
                          className="px-2 py-1 text-red-400 hover:text-red-600 text-xs"
                        >
                          Stop
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
