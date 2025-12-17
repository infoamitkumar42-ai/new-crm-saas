import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, DollarSign, Database, RefreshCw, Upload, Trash2, 
  Search, CheckCircle, LogOut, XCircle, Filter, Download,
  AlertTriangle, UserCheck, UserX, ChevronDown, X, Eye
} from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  payment_status: 'active' | 'inactive' | 'pending';
  plan_name: string;
  daily_limit: number;
  leads_today: number;
  valid_until: string;
  manager_id: string | null;
  team_code: string | null;
  created_at: string;
}

interface OrphanLead {
  id: string;
  name: string;
  phone: string;
  city: string;
  miss_reason: string;
  status: string;
  created_at: string;
}

interface Stats {
  users: number;
  activeUsers: number;
  managers: number;
  leads: number;
  orphanLeads: number;
  revenue: number;
}

export const AdminDashboard = () => {
  // States
  const [stats, setStats] = useState<Stats>({ 
    users: 0, activeUsers: 0, managers: 0, leads: 0, orphanLeads: 0, revenue: 0 
  });
  const [users, setUsers] = useState<User[]>([]);
  const [orphanLeads, setOrphanLeads] = useState<OrphanLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showOrphans, setShowOrphans] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState<User | null>(null);
  const [bulkData, setBulkData] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  // Plan Options
  const planOptions = [
    { id: 'none', name: 'No Plan', daily_limit: 0, days: 0 },
    { id: 'starter', name: 'Starter', daily_limit: 2, days: 30 },
    { id: 'supervisor', name: 'Supervisor', daily_limit: 6, days: 30 },
    { id: 'manager', name: 'Manager', daily_limit: 16, days: 30 },
    { id: 'fast_start', name: 'Fast Start', daily_limit: 10, days: 7 },
    { id: 'turbo_weekly', name: 'Turbo Weekly', daily_limit: 25, days: 7 },
    { id: 'max_blast', name: 'Max Blast', daily_limit: 40, days: 7 },
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Get Stats
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: activeCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('payment_status', 'active');
      const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { count: orphanCount } = await supabase.from('orphan_leads').select('*', { count: 'exact', head: true });
      const { count: managerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'manager');

      setStats({
        users: userCount || 0,
        activeUsers: activeCount || 0,
        managers: managerCount || 0,
        leads: leadCount || 0,
        orphanLeads: orphanCount || 0,
        revenue: (activeCount || 0) * 999
      });

      // Get All Users
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      setUsers(allUsers || []);

      // Get Orphan Leads
      const { data: orphans } = await supabase
        .from('orphan_leads')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setOrphanLeads(orphans || []);

    } catch (error) {
      console.error("Admin Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle User Active/Inactive
  const toggleUserStatus = async (user: User) => {
    const newStatus = user.payment_status === 'active' ? 'inactive' : 'active';
    setActionLoading(user.id);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          payment_status: newStatus,
          daily_limit: newStatus === 'inactive' ? 0 : user.daily_limit
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, payment_status: newStatus, daily_limit: newStatus === 'inactive' ? 0 : u.daily_limit }
          : u
      ));
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Activate Plan for User
  const activatePlan = async (user: User, planId: string) => {
    const plan = planOptions.find(p => p.id === planId);
    if (!plan) return;

    setActionLoading(user.id);
    
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + plan.days);

      const { error } = await supabase
        .from('users')
        .update({ 
          plan_name: plan.id,
          payment_status: plan.id === 'none' ? 'inactive' : 'active',
          daily_limit: plan.daily_limit,
          valid_until: plan.id === 'none' ? null : validUntil.toISOString(),
          leads_today: 0
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setShowPlanModal(null);
      fetchAdminData();
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Assign Orphan Lead to User
  const assignOrphanLead = async (orphan: OrphanLead, userId: string) => {
    try {
      // 1. Add to leads table
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          name: orphan.name,
          phone: orphan.phone,
          city: orphan.city,
          status: 'Fresh',
          source: 'orphan_assigned'
        });

      if (insertError) throw insertError;

      // 2. Update orphan status
      const { error: updateError } = await supabase
        .from('orphan_leads')
        .update({ status: 'assigned', assigned_to: userId })
        .eq('id', orphan.id);

      if (updateError) throw updateError;

      // 3. Refresh data
      fetchAdminData();
      
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Delete User
  const deleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure? This will permanently delete this user and their data.")) return;
    
    setActionLoading(userId);
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      fetchAdminData();
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Upload Handler
  const handleBulkUpload = async () => {
    if (!bulkData.trim()) return;
    setUploadStatus("Processing...");
    
    try {
      const lines = bulkData.trim().split('\n');
      let successCount = 0;
      
      for (const line of lines) {
        const [name, phone, city] = line.split(',').map(s => s.trim());
        if (name && phone) {
          const { error } = await supabase.from('orphan_leads').insert({
            name,
            phone,
            city: city || 'Unknown',
            status: 'pending',
            miss_reason: 'bulk_upload'
          });
          if (!error) successCount++;
        }
      }

      setUploadStatus(`✅ Uploaded ${successCount} leads to Orphan Bank`);
      setTimeout(() => { setShowUpload(false); setUploadStatus(''); setBulkData(''); }, 2000);
      fetchAdminData();
      
    } catch (err: any) {
      setUploadStatus("❌ Error: " + err.message);
    }
  };

  // Export Users to CSV
  const exportUsersCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Plan', 'Status', 'Daily Limit', 'Created'];
    const rows = filteredUsers.map(u => [
      u.name, u.email, u.role, u.plan_name, u.payment_status, u.daily_limit, 
      new Date(u.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.payment_status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Active members for orphan assignment
  const activeMembers = users.filter(u => u.role === 'member' && u.payment_status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                👑 Admin Control
              </h1>
              <p className="text-sm text-slate-500">System Overview & Management</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowOrphans(true)}
                className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 border border-orange-200 text-sm font-medium transition-all"
              >
                <AlertTriangle size={16} />
                <span className="hidden sm:inline">Orphan Leads</span>
                {stats.orphanLeads > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.orphanLeads}</span>
                )}
              </button>
              
              <button 
                onClick={() => setShowUpload(!showUpload)} 
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-all"
              >
                <Upload size={16} /> 
                <span className="hidden sm:inline">Upload</span>
              </button>

              <button 
                onClick={exportUsersCSV}
                className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 border border-green-200 text-sm font-medium transition-all"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button 
                onClick={() => supabase.auth.signOut()} 
                className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200 text-sm font-medium transition-all"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>

              <button 
                onClick={fetchAdminData} 
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              >
                <RefreshCw size={18} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Bulk Upload Section */}
        {showUpload && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800">📤 Bulk Lead Upload</h3>
                <p className="text-xs text-slate-500">Format: Name, Phone, City (one per line)</p>
              </div>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <textarea 
              className="w-full border border-slate-200 p-3 rounded-lg bg-slate-50 text-sm font-mono h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Rahul Kumar, 9999999999, Delhi&#10;Amit Singh, 8888888888, Mumbai"
              value={bulkData}
              onChange={e => setBulkData(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
              <span className={`text-sm font-medium ${uploadStatus.includes('✅') ? 'text-green-600' : uploadStatus.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
                {uploadStatus}
              </span>
              <button 
                onClick={handleBulkUpload} 
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-all"
              >
                Upload to Orphan Bank
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard icon={<Users size={20} />} label="Total Users" value={stats.users} color="blue" />
          <StatCard icon={<UserCheck size={20} />} label="Active" value={stats.activeUsers} color="green" />
          <StatCard icon={<CheckCircle size={20} />} label="Managers" value={stats.managers} color="purple" />
          <StatCard icon={<Database size={20} />} label="Leads" value={stats.leads} color="orange" />
          <StatCard icon={<AlertTriangle size={20} />} label="Orphan" value={stats.orphanLeads} color="red" />
          <StatCard icon={<DollarSign size={20} />} label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} color="emerald" />
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter Toggle (Mobile) */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600"
            >
              <Filter size={16} /> Filters
            </button>
            
            {/* Desktop Filters */}
            <div className={`flex flex-col sm:flex-row gap-2 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
              <select 
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
              
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              
              {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                <button 
                  onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearchTerm(''); }}
                  className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Users ({filteredUsers.length})</h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                <tr>
                  <th className="p-4 pl-6">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Leads Today</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900">{user.name || 'No Name'}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{user.role}</span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setShowPlanModal(user)}
                        className="flex items-center gap-1 text-slate-700 hover:text-blue-600 font-medium text-sm transition-all"
                      >
                        {user.plan_name || 'None'} 
                        <ChevronDown size={14} />
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        disabled={actionLoading === user.id || user.role === 'admin'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          user.payment_status === 'active' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading === user.id ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : user.payment_status === 'active' ? (
                          <UserCheck size={14} />
                        ) : (
                          <UserX size={14} />
                        )}
                        {user.payment_status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-700 font-medium">
                        {user.leads_today} / {user.daily_limit}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => deleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-slate-900">{user.name || 'No Name'}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{user.role}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                    Plan: {user.plan_name || 'None'}
                  </span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                    Leads: {user.leads_today}/{user.daily_limit}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleUserStatus(user)}
                    disabled={actionLoading === user.id || user.role === 'admin'}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      user.payment_status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.payment_status === 'active' ? <UserCheck size={14} /> : <UserX size={14} />}
                    {user.payment_status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                  
                  <button 
                    onClick={() => setShowPlanModal(user)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
                  >
                    Change Plan <ChevronDown size={14} />
                  </button>
                  
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-red-500 bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </main>

      {/* Plan Change Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">Change Plan</h3>
                <button onClick={() => setShowPlanModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">{showPlanModal.name} ({showPlanModal.email})</p>
            </div>
            
            <div className="p-4 space-y-2">
              {planOptions.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => activatePlan(showPlanModal, plan.id)}
                  disabled={actionLoading === showPlanModal.id}
                  className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
                    showPlanModal.plan_name === plan.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-slate-900">{plan.name}</div>
                    <div className="text-xs text-slate-500">
                      {plan.daily_limit} leads/day • {plan.days} days
                    </div>
                  </div>
                  {showPlanModal.plan_name === plan.id && (
                    <CheckCircle size={20} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orphan Leads Modal */}
      {showOrphans && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Orphan Leads ({orphanLeads.length})</h3>
                <p className="text-sm text-slate-500">Leads that couldn't be auto-assigned</p>
              </div>
              <button onClick={() => setShowOrphans(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {orphanLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <p className="font-medium">No orphan leads!</p>
                  <p className="text-sm">All leads have been assigned.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orphanLeads.map(orphan => (
                    <div key={orphan.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-slate-900">{orphan.name}</div>
                          <div className="text-sm text-slate-500">{orphan.phone} • {orphan.city}</div>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {orphan.miss_reason}
                        </span>
                      </div>
                      
                      {activeMembers.length > 0 ? (
                        <select 
                          onChange={(e) => {
                            if (e.target.value) assignOrphanLead(orphan, e.target.value);
                          }}
                          className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to member...</option>
                          {activeMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.leads_today}/{m.daily_limit})</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-red-500 mt-2">No active members available</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
};

export default AdminDashboard;
