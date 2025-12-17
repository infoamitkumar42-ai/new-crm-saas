import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { 
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare, 
  X, Calendar, Target, TrendingUp, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock, Eye,
  ChevronRight, Gift, Flame, ArrowUp, Bell, Rocket, Shield
} from 'lucide-react';

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState("Loading...");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Modals
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  // NEW: Banner & Tab states
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [renewTab, setRenewTab] = useState<'monthly' | 'booster'>('monthly');

  // Monthly Plans (Same as Subscription.tsx)
  const planOptions = [
    { 
      id: 'starter', 
      name: 'Starter Plan', 
      price: 999, 
      daily_limit: 2, 
      leads: 60, 
      duration: 30,
      color: 'blue',
      icon: Shield
    },
    { 
      id: 'supervisor', 
      name: 'Supervisor Plan', 
      price: 1999, 
      daily_limit: 6, 
      leads: 180, 
      duration: 30,
      color: 'purple', 
      popular: true,
      icon: Crown
    },
    { 
      id: 'manager', 
      name: 'Manager Plan', 
      price: 4999, 
      daily_limit: 16, 
      leads: 480, 
      duration: 30,
      color: 'orange',
      icon: Rocket
    },
  ];

  // 🔥 NEW: 7-Day Booster Plans (Matching Subscription.tsx)
  const boosterPlans = [
    {
      id: 'fast_start',
      name: 'Fast Start',
      subtitle: 'QUICK TEST',
      price: 999,
      duration: 7,
      daily_limit: 10,
      leads: 70,
      perLeadCost: 14.27,
      badge: 'SPEED',
      icon: Zap,
      color: 'orange'
    },
    {
      id: 'turbo_weekly',
      name: 'Turbo Weekly',
      subtitle: 'RECRUITMENT DRIVE',
      price: 1999,
      duration: 7,
      daily_limit: 25,
      leads: 175,
      perLeadCost: 11.42,
      badge: 'BEST ROI',
      popular: true,
      icon: Flame,
      color: 'orange'
    },
    {
      id: 'max_blast',
      name: 'Max Blast',
      subtitle: 'NUCLEAR MODE',
      price: 2999,
      duration: 7,
      daily_limit: 40,
      leads: 280,
      perLeadCost: 10.71,
      badge: 'BEAST MODE',
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(userData);

      if (userData?.manager_id) {
        const { data: managerData } = await supabase
          .from('users')
          .select('name')
          .eq('id', userData.manager_id)
          .single();
        setManagerName(managerData?.name || "Unknown");
      } else {
        setManagerName("Direct (No Manager)");
      }

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 📊 CALCULATIONS
  // ═══════════════════════════════════════════════════════════

  const getDaysUntilExpiry = () => {
    if (!profile?.valid_until) return null;
    const expiry = new Date(profile.valid_until);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;
  
  const leadsToday = (profile as any)?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = leadsToday >= dailyLimit && dailyLimit > 0;

  const totalPlanDays = 30;
  const planProgress = daysLeft !== null ? Math.max(0, Math.round(((totalPlanDays - daysLeft) / totalPlanDays) * 100)) : 0;

  const missedLeadsToday = isExpired ? Math.floor(Math.random() * 8) + 3 : 0;

  const stats = {
    total: leads.length,
    fresh: leads.filter(l => l.status === 'Fresh').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    callBack: leads.filter(l => l.status === 'Call Back').length,
  };

  const conversionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;
  const isFastCaller = stats.total > 5 && (stats.interested + stats.closed) / stats.total > 0.3;

  // ═══════════════════════════════════════════════════════════
  // 🎯 HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, status: newStatus as any } : l
    ));
    
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      alert("Error updating status!");
      fetchData();
    }
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: noteText, updated_at: new Date().toISOString() })
        .eq('id', showNotesModal.id);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === showNotesModal.id ? { ...l, notes: noteText } : l
      ));
      
      setShowNotesModal(null);
      setNoteText('');
      
    } catch (err: any) {
      alert("Error saving note: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Hi ${name}, I'm ${profile?.name} from LeadFlow. I saw your inquiry and wanted to connect. Are you available to discuss?`
    );
    const cleanPhone = phone.replace(/\D/g, '');
    const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${prefixedPhone}?text=${message}`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Fresh': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Contacted': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
      case 'Call Back': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'Interested': return 'bg-green-50 border-green-200 text-green-700';
      case 'Follow-up': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Closed': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'Rejected': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCurrentPlanIndex = () => {
    return planOptions.findIndex(p => p.id === profile?.plan_name) || 0;
  };

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    
    if (dateFilter !== 'all') {
      const leadDate = new Date(lead.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (dateFilter === 'today' && leadDate < today) return false;
      if (dateFilter === 'week' && leadDate < weekAgo) return false;
    }
    
    return true;
  });

  // ═══════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isExpired ? 'overflow-hidden' : ''}`}>
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔴 EXPIRED OVERLAY */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isExpired && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold">Plan Expired!</h2>
              <p className="text-red-100 mt-2">Your daily leads have stopped</p>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-red-600 font-bold text-lg">
                  ⚠️ You missed <span className="text-2xl">{missedLeadsToday}</span> leads today!
                </p>
                <p className="text-red-500 text-sm mt-1">
                  These leads were assigned to other active members
                </p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Eye size={20} className="text-orange-500 mt-0.5" />
                <div>
                  <p className="text-orange-800 font-medium text-sm">
                    Your manager <span className="font-bold">{managerName}</span> can see your inactive status
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowRenewModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} /> Renew Now & Get Today's Leads
              </button>
              
              <p className="text-center text-slate-500 text-xs mt-4">
                Renew within 24h to get bonus leads!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🟠 EXPIRING SOON BANNER (with ❌ Close Button) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isExpiringSoon && !isExpired && !bannerDismissed && (
        <div className={`${daysLeft && daysLeft <= 2 ? 'bg-red-500' : 'bg-orange-500'} text-white py-3 px-4`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell size={18} className="animate-pulse" />
              <span className="font-medium">
                ⏰ Your plan expires in <span className="font-bold">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span>!
                {daysLeft && daysLeft <= 2 && " Don't lose your daily leads!"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowRenewModal(true)}
                className="bg-white text-orange-600 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-orange-50 transition-all flex items-center gap-1"
              >
                <RefreshCw size={14} /> Renew Now
                {daysLeft && daysLeft <= 3 && <span className="bg-green-500 text-white text-xs px-1.5 rounded ml-1">+3 Bonus</span>}
              </button>
              {/* ❌ CLOSE BUTTON */}
              <button 
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔵 DAILY LIMIT HIT BANNER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isLimitReached && !isExpired && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target size={18} />
              <span className="font-medium">
                🎯 Daily limit reached! <span className="opacity-75">Upgrade to get more leads today</span>
              </span>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition-all flex items-center gap-1"
            >
              <ArrowUp size={14} /> Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📊 HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  👋 Welcome, {profile?.name || 'Member'}
                </h1>
                {isFastCaller && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Zap size={10} /> Fast Caller
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                Manager: <span className="font-medium text-blue-600">{managerName}</span>
                <span className="mx-2">•</span>
                <span className={`font-medium ${profile?.payment_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {profile?.plan_name || 'No Plan'}
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {(profile as any)?.sheet_url && (
                <a 
                  href={(profile as any).sheet_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-all"
                >
                  <FileSpreadsheet size={16} />
                  <span className="hidden sm:inline">Sheet</span>
                </a>
              )}
              
              <button 
                onClick={fetchData}
                disabled={refreshing}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📊 PROGRESS SECTION */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          
          {dailyLimit > 0 && (
            <div className={`rounded-xl p-4 ${isLimitReached ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Target size={18} />
                  <span className="font-medium">Today's Leads</span>
                </div>
                <span className="font-bold text-lg">
                  {leadsToday} / {dailyLimit}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${dailyProgress}%` }}
                ></div>
              </div>
              {isLimitReached ? (
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-white/80">Daily limit reached!</p>
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-xs bg-white text-orange-600 px-2 py-1 rounded font-bold"
                  >
                    Get More →
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/80 mt-2">
                  {dailyLimit - leadsToday} more leads will come today
                </p>
              )}
            </div>
          )}

          {daysLeft !== null && daysLeft > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-600" />
                  <span className="font-medium text-slate-700">Plan Usage</span>
                </div>
                <span className={`font-bold ${daysLeft <= 5 ? 'text-red-600' : 'text-slate-900'}`}>
                  {daysLeft} days left
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className={`rounded-full h-3 transition-all duration-500 ${planProgress >= 80 ? 'bg-red-500' : planProgress >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${planProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-slate-500">{planProgress}% of plan used</p>
                {planProgress >= 70 && (
                  <button 
                    onClick={() => setShowRenewModal(true)}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold"
                  >
                    Renew Early
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📊 STATS CARDS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} color="slate" icon={<Target size={16} />} />
          <StatCard label="Fresh" value={stats.fresh} color="blue" icon={<Clock size={16} />} />
          <StatCard label="Interested" value={stats.interested} color="green" icon={<TrendingUp size={16} />} />
          <StatCard label="Closed" value={stats.closed} color="purple" icon={<Check size={16} />} />
          <StatCard label="Conversion" value={`${conversionRate}%`} color="orange" icon={<Flame size={16} />} />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🎯 UPGRADE PROMPT */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {stats.total >= 5 && conversionRate >= 20 && getCurrentPlanIndex() < 2 && !isExpired && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Crown size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">You're Outperforming! 🔥</h3>
                  <p className="text-sm text-purple-700">
                    Your {conversionRate}% conversion is better than 78% of users. 
                    Upgrade for more leads!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                <ArrowUp size={14} /> Upgrade Plan
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🔍 FILTERS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Status ({leads.length})</option>
              <option value="Fresh">🔵 Fresh ({stats.fresh})</option>
              <option value="Call Back">🟡 Call Back ({stats.callBack})</option>
              <option value="Interested">🟢 Interested ({stats.interested})</option>
              <option value="Closed">🟣 Closed ({stats.closed})</option>
              <option value="Rejected">🔴 Rejected</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">📅 All Time</option>
              <option value="today">📆 Today</option>
              <option value="week">🗓️ Last 7 Days</option>
            </select>
            
            {(statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
                className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📋 LEADS LIST */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isExpired ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">My Leads</h2>
            <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">
              {filteredLeads.length} of {leads.length}
            </span>
          </div>
          
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-slate-400" />
              </div>
              <p className="font-medium text-slate-800">No leads found</p>
              <p className="text-sm text-slate-500 mt-1">
                {leads.length === 0 ? "Wait for leads to be assigned! 🚀" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                    <tr>
                      <th className="p-4 pl-6">Lead</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">City</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Time</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900">{lead.name}</div>
                          {lead.notes && (
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <StickyNote size={10} /> {lead.notes.slice(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                              <Phone size={14} className="text-blue-500" />
                              {lead.phone}
                            </a>
                            <a 
                              href={getWhatsAppLink(lead.phone, lead.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                            >
                              <MessageSquare size={12} className="text-white" />
                            </a>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin size={14} className="text-slate-400" />
                            {lead.city || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-slate-500">{getTimeAgo(lead.created_at)}</span>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <StickyNote size={16} />
                            </button>
                            <select 
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                            >
                              <option value="Fresh">Fresh</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Call Back">Call Back</option>
                              <option value="Interested">Interested</option>
                              <option value="Follow-up">Follow-up</option>
                              <option value="Closed">Closed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {lead.city || 'N/A'}
                          <span className="mx-1">•</span>
                          <Clock size={10} /> {getTimeAgo(lead.created_at)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    
                    {lead.notes && (
                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-3 flex items-start gap-1">
                        <StickyNote size={12} className="mt-0.5 shrink-0" />
                        <span>{lead.notes}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <a href={`tel:${lead.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium text-sm">
                        <Phone size={16} /> Call
                      </a>
                      <a href={getWhatsAppLink(lead.phone, lead.name)} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm">
                        <MessageSquare size={16} /> WhatsApp
                      </a>
                      <button onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
                        <StickyNote size={16} />
                      </button>
                    </div>
                    
                    <select 
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
                    >
                      <option value="Fresh">🔵 Fresh</option>
                      <option value="Contacted">📞 Contacted</option>
                      <option value="Call Back">🔄 Call Back</option>
                      <option value="Interested">✅ Interested</option>
                      <option value="Follow-up">📅 Follow-up</option>
                      <option value="Closed">🎉 Closed</option>
                      <option value="Rejected">❌ Rejected</option>
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pro Tip */}
        {stats.fresh > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap size={18} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Pro Tip: Speed Matters!</h4>
              <p className="text-sm text-blue-700">
                Call fresh leads within 5 minutes for 21× higher conversion. 
                You have {stats.fresh} fresh leads waiting!
              </p>
            </div>
          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 💳 UPGRADE MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-900">⬆️ Upgrade Your Plan</h3>
                <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">Get more leads daily & grow faster!</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {planOptions.map((plan, idx) => {
                const isCurrent = profile?.plan_name?.toLowerCase() === plan.id.toLowerCase();
                const isUpgrade = idx > getCurrentPlanIndex();
                const Icon = plan.icon;
                
                return (
                  <div 
                    key={plan.id}
                    className={`relative rounded-xl border-2 p-4 ${
                      isCurrent ? 'border-blue-500 bg-blue-50' :
                      plan.popular ? 'border-purple-500 bg-purple-50' :
                      'border-slate-200'
                    }`}
                  >
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          POPULAR
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          CURRENT
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4 pt-2">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Icon size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                      <div className="text-3xl font-black text-slate-900 mt-2">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-slate-500">/mo</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check size={14} className="text-green-500" />
                        <span>{plan.daily_limit} leads/day</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check size={14} className="text-green-500" />
                        <span>~{plan.leads} leads/month</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check size={14} className="text-green-500" />
                        <span>₹{(plan.price / plan.leads).toFixed(1)}/lead</span>
                      </div>
                    </div>
                    
                    <button 
                      disabled={isCurrent}
                      className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                        isCurrent ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                        isUpgrade ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-green-50 border-t border-green-100 text-center">
              <p className="text-sm text-green-700">
                💡 <strong>Upgrade now</strong> and get today's remaining leads instantly!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔄 RENEW MODAL (with Monthly + Booster Tabs) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-900">🔄 Renew / Upgrade Your Plan</h3>
                <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">Choose your renewal duration</p>
            </div>
            
            <div className="p-6">
              {/* 📑 TABS: Monthly vs Booster */}
              <div className="flex bg-slate-100 rounded-xl p-1.5 mb-6">
                <button
                  onClick={() => setRenewTab('monthly')}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    renewTab === 'monthly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Calendar size={16} /> Monthly Plans (30 Days)
                </button>
                <button
                  onClick={() => setRenewTab('booster')}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    renewTab === 'booster' 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Zap size={16} /> 7-Day Boosters
                </button>
              </div>

              {/* 📅 MONTHLY PLANS TAB */}
              {renewTab === 'monthly' && (
                <>
                  {(daysLeft || 0) <= 3 && daysLeft !== null && daysLeft > 0 && (
                    <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Gift size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800">🎁 Early Renewal Bonus!</p>
                        <p className="text-sm text-green-600">Renew now & get +3 bonus leads FREE</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {planOptions.map((plan) => {
                      const isCurrent = profile?.plan_name?.toLowerCase() === plan.id.toLowerCase();
                      const Icon = plan.icon;
                      
                      return (
                        <div 
                          key={plan.id}
                          className={`relative rounded-xl border-2 p-4 ${
                            isCurrent ? 'border-blue-500 bg-blue-50' :
                            plan.popular ? 'border-purple-500 bg-purple-50' :
                            'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {plan.popular && !isCurrent && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                POPULAR
                              </span>
                            </div>
                          )}
                          {isCurrent && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                CURRENT
                              </span>
                            </div>
                          )}
                          
                          <div className="text-center mb-4 pt-2">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                              <Icon size={24} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                            <div className="text-3xl font-black text-slate-900 mt-2">
                              ₹{plan.price}
                              <span className="text-sm font-normal text-slate-500">/30d</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-500" />
                              <span>{plan.daily_limit} leads/day</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-500" />
                              <span>~{plan.leads} leads total</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-500" />
                              <span>₹{(plan.price / plan.leads).toFixed(1)}/lead</span>
                            </div>
                          </div>
                          
                          <button 
                            className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                              isCurrent 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isCurrent ? '🔄 Renew Plan' : '⬆️ Select Plan'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ⚡ BOOSTER PLANS TAB (7 Days) */}
              {renewTab === 'booster' && (
                <>
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Zap size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-900">⚡ Short-Term Power Boost!</h4>
                      <p className="text-sm text-orange-700">
                        Perfect for testing or short campaigns. 7 days of high-volume leads!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {boosterPlans.map((plan) => {
                      const Icon = plan.icon;
                      
                      return (
                        <div 
                          key={plan.id}
                          className={`relative rounded-xl border-2 p-4 transition-all ${
                            plan.popular 
                              ? 'border-orange-500 bg-orange-50 shadow-lg' 
                              : 'border-orange-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                              plan.popular 
                                ? 'bg-gradient-to-r from-orange-600 to-red-600' 
                                : 'bg-gradient-to-r from-orange-500 to-orange-600'
                            }`}>
                              {plan.badge}
                            </span>
                          </div>
                          
                          <div className="text-center mb-4 pt-2">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                              <Icon size={24} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase">{plan.subtitle}</p>
                            <div className="text-3xl font-black text-slate-900 mt-2">
                              ₹{plan.price}
                              <span className="text-sm font-normal text-slate-500">/7d</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-500" />
                              <span className="font-bold">{plan.daily_limit} leads/day</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-500" />
                              <span>~{plan.leads} leads total</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-500" />
                              <span>₹{plan.perLeadCost.toFixed(2)}/lead</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Zap size={14} className="text-orange-500" />
                              <span className="text-orange-600 font-medium">Instant Activation</span>
                            </div>
                          </div>
                          
                          <button 
                            className="w-full py-2.5 rounded-lg font-bold text-sm transition-all bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md"
                          >
                            🚀 Get Booster
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Pro Tip:</strong> Use boosters to test markets or run time-limited campaigns!
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📝 NOTES MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">📝 Add Note</h3>
                <button onClick={() => setShowNotesModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">{showNotesModal.name} • {showNotesModal.phone}</p>
            </div>
            
            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes about this lead..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none h-32"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={savingNote}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {savingNote ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Check size={16} /> Save</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>

    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) => {
  const colors: Record<string, string> = {
    slate: 'border-l-slate-400 bg-slate-50',
    blue: 'border-l-blue-500 bg-blue-50',
    green: 'border-l-green-500 bg-green-50',
    purple: 'border-l-purple-500 bg-purple-50',
    orange: 'border-l-orange-500 bg-orange-50',
  };

  const iconColors: Record<string, string> = {
    slate: 'text-slate-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className={`bg-white p-3 rounded-xl shadow-sm border border-slate-100 border-l-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs text-slate-500 font-medium uppercase">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default MemberDashboard;
