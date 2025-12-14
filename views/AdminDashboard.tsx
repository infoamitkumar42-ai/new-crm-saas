import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, DollarSign, Database, RefreshCw, Upload, Trash2, Ban, Search, CheckCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, managers: 0, leads: 0, revenue: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // 1. Get Stats Counts
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { count: managerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'manager');

      setStats({
        users: userCount || 0,
        managers: managerCount || 0,
        leads: leadCount || 0,
        revenue: (userCount || 0) * 499 // Dummy Revenue Logic
      });

      // 2. Get All Users (For Management Table)
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(allUsers || []);

    } catch (error) {
      console.error("Admin Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Handle Bulk Lead Upload (Simulation)
  const handleBulkUpload = async () => {
    if (!bulkData) return;
    setUploadStatus("Processing...");
    
    // Yahan hum future mein CSV parsing logic lagayenge.
    // Abhi ke liye hum bas ek 'Unassigned' lead create kar rahe hain test ke liye.
    try {
        const lines = bulkData.split('\n');
        // Demo: Creating 1 dummy lead for testing flow
        const { error } = await supabase.from('leads').insert({
            name: "Bulk Upload Test",
            phone: "0000000000",
            status: "Fresh",
            // assigned_to: null, // Global Pool logic later
            // manager_id: null
        });

        if(error) throw error;
        
        setUploadStatus(`Success! Uploaded ${lines.length} leads to Global Bank.`);
        setTimeout(() => { setShowUpload(false); setUploadStatus(''); setBulkData(''); }, 2000);
        fetchAdminData(); // Refresh Stats
    } catch (err: any) {
        setUploadStatus("Error: " + err.message);
    }
  };

  // 🚫 Block/Delete User
  const deleteUser = async (userId: string) => {
      if(!window.confirm("Are you sure? This will verify remove the user.")) return;
      
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if(error) alert("Error deleting: " + error.message);
      else fetchAdminData();
  };

  const filteredUsers = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-slate-500">Loading System Control...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            👑 Admin Control
          </h1>
          <p className="text-sm text-slate-500">System Overview & Management</p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setShowUpload(!showUpload)} 
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm font-bold"
            >
                <Upload size={18} /> {showUpload ? "Close Upload" : "Upload Leads"}
            </button>
            <button onClick={fetchAdminData} className="p-2 bg-white border rounded-lg shadow-sm hover:bg-slate-50">
                <RefreshCw size={20} className="text-slate-600" />
            </button>
        </div>
      </div>

      {/* 👇 Bulk Upload Section (Toggle) */}
      {showUpload && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-8 animate-fade-in-down">
              <h3 className="font-bold text-slate-800 mb-2">🌍 Global Lead Bank Upload</h3>
              <p className="text-xs text-slate-500 mb-4">Paste data here (Name, Phone, City) - currently simulates upload.</p>
              <textarea 
                  className="w-full border p-3 rounded-lg bg-slate-50 text-sm font-mono h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Rahul, 9999999999, Delhi&#10;Amit, 8888888888, Mumbai"
                  value={bulkData}
                  onChange={e => setBulkData(e.target.value)}
              ></textarea>
              <div className="flex justify-between items-center mt-3">
                  <span className="text-sm font-bold text-blue-600">{uploadStatus}</span>
                  <button onClick={handleBulkUpload} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800">
                      Process Data
                  </button>
              </div>
          </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Total Users</p><h3 className="text-2xl font-bold">{stats.users}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Database size={24} /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Total Leads</p><h3 className="text-2xl font-bold">{stats.leads}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={24} /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Revenue</p><h3 className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle size={24} /></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase">Managers</p><h3 className="text-2xl font-bold">{stats.managers}</h3></div>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800">System Users ({filteredUsers.length})</h3>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
             <input 
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                placeholder="Search user..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                <tr>
                  <th className="p-4 pl-6">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Manager ID</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{user.name || 'No Name'}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>{user.role}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{user.plan || 'Free'}</td>
                    <td className="p-4 text-xs text-slate-400 font-mono">
                        {user.manager_id ? user.manager_id.slice(0,8)+'...' : 'N/A'}
                    </td>
                    <td className="p-4 text-right pr-6 flex justify-end gap-2">
                        {user.role !== 'admin' && (
                            <>
                                <button title="Block User" className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                    <Ban size={16} />
                                </button>
                                <button 
                                    onClick={() => deleteUser(user.id)}
                                    title="Delete User" 
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
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
