import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, DollarSign, Database, RefreshCw, Upload, Trash2, 
  Search, CheckCircle, LogOut, XCircle, Filter, Download,
  AlertTriangle, UserCheck, UserX, ChevronDown, X, Eye,
  TrendingUp, Activity, BarChart3, Clock, Calendar,
  Zap, Target, Shield, Crown, Rocket, PieChart,
  Globe, Wifi, WifiOff, Timer, Bell, Hash
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface SystemStats {
  totalUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  onlineNow: number;
  loginsToday: number;
  leadsDistributedToday: number;
  leadsDistributedMonth: number;
  avgSessionDuration: string;
  starterUsers: number;
  supervisorUsers: number;
  managerUsers: number;
  boosterUsers: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  mrr: number;
  churnRate: number;
  queuedLeads: number;
  failedDistributions: number;
  orphanLeads: number;
  systemUptime: number;
  managers: number;
  leads: number;
}

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
  last_login: string;
  last_activity: string;
  login_count: number;
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

interface HourlyActivity {
  hour: number;
  logins: number;
  leads: number;
  activeUsers: number;
}

interface PlanAnalytics {
  planName: string;
  userCount: number;
  revenue: number;
  avgLeadsPerUser: number;
  churnRate: number;
  satisfaction: number;
}

export const AdminDashboard = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  // Stats & Data
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0, dailyActiveUsers: 0, monthlyActiveUsers: 0, onlineNow: 0,
    loginsToday: 0, leadsDistributedToday: 0, leadsDistributedMonth: 0, avgSessionDuration: '0m',
    starterUsers: 0, supervisorUsers: 0, managerUsers: 0, boosterUsers: 0,
    dailyRevenue: 0, monthlyRevenue: 0, mrr: 0, churnRate: 0,
    queuedLeads: 0, failedDistributions: 0, orphanLeads: 0, systemUptime: 99.9,
    managers: 0, leads: 0
  });

  const [users, setUsers] = useState<User[]>([]);
  const [orphanLeads, setOrphanLeads] = useState<OrphanLead[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [planAnalytics, setPlanAnalytics] = useState<PlanAnalytics[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'orphans'>('analytics');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Filters (User Management)
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
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

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Fetch Users
      const { data: allUsers, count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      setUsers(allUsers || []);

      // 2. Fetch Orphan Leads
      const { data: orphans, count: orphanCount } = await supabase
        .from('orphan_leads')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setOrphanLeads(orphans || []);

      // 3. Fetch Leads Stats
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      const { count: leadsToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // 4. Calculate Stats
      const activeUsers = allUsers?.filter(u => u.payment_status === 'active') || [];
      const managers = allUsers?.filter(u => u.role === 'manager').length || 0;
      const onlineUsers = allUsers?.filter(u => new Date(u.last_activity) > new Date(Date.now() - 5 * 60 * 1000)).length || 0;
      const dau = allUsers?.filter(u => new Date(u.last_login) >= todayStart).length || 0;

      // Revenue Calculation
      const planPricing: Record<string, number> = {
        starter: 999, supervisor: 1999, manager: 4999,
        fast_start: 999, turbo_weekly: 1999, max_blast: 2999
      };

      let dailyRevenue = 0;
      let monthlyRevenue = 0;
      let mrr = 0;

      activeUsers.forEach(u => {
        const price = planPricing[u.plan_name] || 0;
        mrr += price;
        monthlyRevenue += price;
        if (new Date(u.created_at) >= todayStart) dailyRevenue += price;
      });

      // Update Stats State
      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0,
        dailyActiveUsers: dau,
        monthlyActiveUsers: activeUsers.length, // Simplified
        onlineNow: onlineUsers,
        managers: managers,
        leads: leadCount || 0,
        orphanLeads: orphanCount || 0,
        dailyRevenue,
        monthlyRevenue,
        mrr,
        leadsDistributedToday: leadsToday || 0
      }));

      // 5. Generate Charts (Simplified)
      const hourlyData: HourlyActivity[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        logins: Math.floor(Math.random() * 10), // Replace with real data if available
        leads: Math.floor(Math.random() * 20),
        activeUsers: Math.floor(Math.random() * 5)
      }));
      setHourlyActivity(hourlyData);

    } catch (error) {
      console.error("Admin Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = autoRefresh ? setInterval(fetchAdminData, 30000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh]);

  // ============================================================
  // ACTIONS (USER MANAGEMENT)
  // ============================================================

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.payment_status === 'active' ? 'inactive' : 'active';
    setActionLoading(user.id);
    try {
      await supabase.from('users').update({ 
        payment_status: newStatus,
        daily_limit: newStatus === 'inactive' ? 0 : user.daily_limit
      }).eq('id', user.id);
      
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, payment_status: newStatus } : u));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const activatePlan = async (user: User, planId: string) => {
    const plan = planOptions.find(p => p.id === planId);
    if (!plan) return;
    setActionLoading(user.id);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + plan.days);
      await supabase.from('users').update({ 
        plan_name: plan.id,
        payment_status: plan.id === 'none' ? 'inactive' : 'active',
        daily_limit: plan.daily_limit,
        valid_until: plan.id === 'none' ? null : validUntil.toISOString(),
        leads_today: 0
      }).eq('id', user.id);
      setShowPlanModal(null);
      fetchAdminData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure? This will permanently delete this user.")) return;
    setActionLoading(userId);
    try {
      await supabase.from('users').delete().eq('id', userId);
      fetchAdminData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================
  // ACTIONS (ORPHAN LEADS)
  // ============================================================

  const assignOrphanLead = async (orphan: OrphanLead, userId: string) => {
    try {
      await supabase.from('leads').insert({
        user_id: userId,
        name: orphan.name,
        phone: orphan.phone,
        city: orphan.city,
        status: 'Fresh',
        source: 'orphan_assigned'
      });
      await supabase.from('orphan_leads').update({ status: 'assigned', assigned_to: userId }).eq('id', orphan.id);
      fetchAdminData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

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
            name, phone, city: city || 'Unknown', status: 'pending', miss_reason: 'bulk_upload'
          });
          if (!error) successCount++;
        }
      }
      setUploadStatus(`✅ Uploaded ${successCount} leads`);
      setTimeout(() => { setShowUpload(false); setUploadStatus(''); setBulkData(''); }, 2000);
      fetchAdminData();
    } catch (err: any) {
      setUploadStatus("❌ Error: " + err.message);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.payment_status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeMembers = users.filter(u => u.role === 'member' && u.payment_status === 'active');

  if (loading) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" />
                Admin Command Center
              </h1>
              <p className="text-xs text-slate-500">
                {activeTab === 'analytics' ? 'System Overview' : activeTab === 'users' ? 'User Management' : 'Lead Operations'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Analytics
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('orphans')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'orphans' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Orphans
                {stats.orphanLeads > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.orphanLeads}</span>}
              </button>
              <button 
                onClick={fetchAdminData}
                disabled={refreshing}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* ======================= ANALYTICS TAB ======================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {/* Real-time Status */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Wifi size={20} className="text-green-300 animate-pulse" />
                    <span className="font-bold">{stats.onlineNow} Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={20} />
                    <span>{stats.dailyActiveUsers} Active Today</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-200">Revenue Today</p>
                  <p className="text-2xl font-bold">₹{stats.dailyRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MetricCard icon={<Users />} label="Total Users" value={stats.totalUsers} color="blue" />
              <MetricCard icon={<CheckCircle />} label="Active Members" value={stats.monthlyActiveUsers} color="green" />
              <MetricCard icon={<Crown />} label="Managers" value={stats.managers} color="purple" />
              <MetricCard icon={<Target />} label="Leads Today" value={stats.leadsDistributedToday} color="orange" />
              <MetricCard icon={<AlertTriangle />} label="Orphans" value={stats.orphanLeads} color="red" />
              <MetricCard icon={<DollarSign />} label="MRR" value={`₹${(stats.mrr/1000).toFixed(1)}k`} color="emerald" />
            </div>

            {/* Hourly Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={18} /> 24-Hour Activity
              </h3>
              <div className="flex items-end justify-between h-32 gap-1">
                {hourlyActivity.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div 
                      className={`w-full rounded-t transition-all ${h.hour >= 8 && h.hour < 22 ? 'bg-blue-500' : 'bg-slate-300'}`}
                      style={{ height: `${Math.max(5, (h.leads / 20) * 100)}%` }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded z-10 whitespace-nowrap">
                      {h.hour}:00 - {h.leads} leads
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>00:00</span><span>12:00</span><span>23:00</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================= USERS TAB ======================= */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
                <Download size={16} /> Export CSV
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Leads</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            user.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>{user.role}</span>
                        </td>
                        <td className="p-4">{user.plan_name}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => toggleUserStatus(user)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                              user.payment_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.payment_status === 'active' ? <UserCheck size={12}/> : <UserX size={12}/>}
                            {user.payment_status}
                          </button>
                        </td>
                        <td className="p-4 font-medium">{user.leads_today} / {user.daily_limit}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => setShowPlanModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <RefreshCw size={16} />
                          </button>
                          <button onClick={() => deleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= ORPHANS TAB ======================= */}
        {activeTab === 'orphans' && (
          <div className="space-y-6 animate-fade-in">
            {/* Bulk Upload */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Upload size={20} className="text-blue-600" />
                  Bulk Upload Leads
                </h3>
                <button 
                  onClick={() => setShowUpload(!showUpload)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showUpload ? 'Hide' : 'Show'} Upload
                </button>
              </div>
              
              {showUpload && (
                <div className="space-y-4">
                  <textarea 
                    className="w-full h-32 p-3 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Rahul, 9999999999, Delhi&#10;Amit, 8888888888, Mumbai"
                    value={bulkData}
                    onChange={e => setBulkData(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Format: Name, Phone, City</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{uploadStatus}</span>
                      <button 
                        onClick={handleBulkUpload}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                      >
                        Upload Leads
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Orphan List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />
                Orphan Leads ({orphanLeads.length})
              </h3>
              
              {orphanLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                  <p>No orphan leads pending!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {orphanLeads.map(orphan => (
                    <div key={orphan.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="font-bold text-slate-900">{orphan.name}</div>
                        <div className="text-sm text-slate-500">{orphan.phone} • {orphan.city}</div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded mt-1 inline-block">
                          Reason: {orphan.miss_reason}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select 
                          className="flex-1 sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          onChange={(e) => {
                            if (e.target.value) assignOrphanLead(orphan, e.target.value);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to member...</option>
                          {activeMembers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.leads_today}/{m.daily_limit})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Change Plan for {showPlanModal.name}</h3>
              <button onClick={() => setShowPlanModal(null)}><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {planOptions.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => activatePlan(showPlanModal, plan.id)}
                  disabled={actionLoading === showPlanModal.id}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    showPlanModal.plan_name === plan.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold">{plan.name}</div>
                  <div className="text-xs text-slate-500">{plan.daily_limit} leads/day • {plan.days} days</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const MetricCard = ({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color]} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        {React.cloneElement(icon, { size: 18 })}
        <span className="text-xs font-bold uppercase opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
};

export default AdminDashboard;
