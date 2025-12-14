import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Users, DollarSign, Database, TrendingUp, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, managers: 0, leads: 0, revenue: 0 });
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Get All Users Count
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      // 2. Get All Managers
      const { data: managerData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'manager');
      
      setManagers(managerData || []);

      // 3. Get Total Leads
      const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });

      // 4. Calculate Fake Revenue (Demo Logic: 1 Member = ₹1000 Profit)
      // Real mein hum 'subscriptions' table se calculate karenge
      const estRevenue = (userCount || 0) * 1000; 

      setStats({
        users: userCount || 0,
        managers: managerData?.length || 0,
        leads: leadCount || 0,
        revenue: estRevenue
      });

    } catch (error) {
      console.error("Admin Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading System Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👑 Admin Dashboard</h1>
          <p className="text-sm text-slate-500">System Overview & Control Center</p>
        </div>
        <button onClick={fetchAdminData} className="p-2 bg-white border rounded-lg shadow-sm hover:bg-slate-50">
            <RefreshCw size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
          <div><p className="text-slate-500 text-xs font-bold uppercase">Total Users</p><h3 className="text-2xl font-bold">{stats.users}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Database size={24} /></div>
          <div><p className="text-slate-500 text-xs font-bold uppercase">Total Leads</p><h3 className="text-2xl font-bold">{stats.leads}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24} /></div>
          <div><p className="text-slate-500 text-xs font-bold uppercase">Est. Revenue</p><h3 className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-slate-500 text-xs font-bold uppercase">Managers</p><h3 className="text-2xl font-bold">{stats.managers}</h3></div>
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">All Managers</h3>
          <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">Total: {managers.length}</span>
        </div>

        {managers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium">No managers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Team Code</th>
                  <th className="p-4">Joined On</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {managers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{manager.name}</td>
                    <td className="p-4 text-slate-600">{manager.email}</td>
                    <td className="p-4"><span className="font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">{manager.team_code}</span></td>
                    <td className="p-4 text-slate-500 text-xs">
                        {new Date(manager.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 justify-end w-fit ml-auto">
                            <CheckCircle size={12} /> Active
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
