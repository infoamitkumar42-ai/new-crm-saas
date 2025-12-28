import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare, 
  X, Calendar, Target, TrendingUp, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock, Eye,
  ChevronRight, Gift, Flame, ArrowUp, Bell, Rocket, Shield,
  Star, Timer, Activity, BarChart3, AlertCircle, Wifi,
  CheckCircle, XCircle, Award, Hash, Users, DollarSign
} from 'lucide-react';

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  plan_name: string;
  plan_weight: number;
  daily_limit: number;
  leads_today: number;
  valid_until: string;
  payment_status: string;
  manager_id: string;
  preferred_city: string;
  total_leads_received: number;
  sheet_url: string;
  filters: any;
  last_activity: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: string;
  source: string;
  quality_score: number;
  distribution_score: number;
  notes: string;
  created_at: string;
  assigned_at: string;
}

interface DistributionInfo {
  position: number;
  score: number;
  nextLeadETA: string;
  queueLength: number;
  isOffHours: boolean;
}

interface PerformanceStats {
  totalLeads: number;
  thisWeek: number;
  conversionRate: number;
  avgResponseTime: string;
  rank: number;
  totalMembers: number;
}

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState("Loading...");
  
  // Enhanced States
  const [distributionInfo, setDistributionInfo] = useState<DistributionInfo>({
    position: 0,
    score: 0,
    nextLeadETA: '--',
    queueLength: 0,
    isOffHours: false
  });
  
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    totalLeads: 0,
    thisWeek: 0,
    conversionRate: 0,
    avgResponseTime: '--',
    rank: 0,
    totalMembers: 0
  });

  // Filters & Modals
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [renewTab, setRenewTab] = useState<'monthly' | 'booster'>('monthly');

  // Plan Options with Weights
  const planOptions = [
    { 
      id: 'starter', 
      name: 'Starter Plan', 
      price: 999, 
      daily_limit: 2, 
      leads: 60, 
      duration: 30,
      weight: 1,
      priority: 'Standard',
      color: 'blue',
      icon: Shield,
      features: ['2 Leads/Day', 'Basic Support', 'Dashboard Access']
    },
    { 
      id: 'supervisor', 
      name: 'Supervisor Plan', 
      price: 1999, 
      daily_limit: 6, 
      leads: 180, 
      duration: 30,
      weight: 3,
      priority: 'High',
      color: 'purple', 
      popular: true,
      icon: Crown,
      features: ['6 Leads/Day', 'Priority Queue', 'City Filter', 'WhatsApp Alerts']
    },
    { 
      id: 'manager', 
      name: 'Manager Plan', 
      price: 4999, 
      daily_limit: 16, 
      leads: 480, 
      duration: 30,
      weight: 5,
      priority: 'Highest',
      color: 'orange',
      icon: Rocket,
      features: ['16 Leads/Day', 'Top Priority', 'All Filters', 'Dedicated Support', 'Team Dashboard']
    },
  ];

  // Booster Plans with Weights
  const boosterPlans = [
    {
      id: 'fast_start',
      name: 'Fast Start',
      subtitle: 'QUICK TEST',
      price: 499,
      duration: 7,
      daily_limit: 5,
      leads: 35,
      weight: 8,
      priority: 'Turbo',
      perLeadCost: 14.27,
      badge: 'SPEED',
      icon: Zap,
      color: 'orange',
      features: ['5 Leads/Day', '7 Days', 'High Priority', 'Instant Start']
    },
    {
      id: 'turbo_weekly',
      name: 'Turbo Weekly',
      subtitle: 'RECRUITMENT DRIVE',
      price: 1499,
      duration: 7,
      daily_limit: 20,
      leads: 140,
      weight: 10,
      priority: 'Ultra',
      perLeadCost: 10.71,
      badge: 'BEST ROI',
      popular: true,
      icon: Flame,
      color: 'orange',
      features: ['20 Leads/Day', '7 Days', 'Top Priority', 'Best Value']
    },
    {
      id: 'max_blast',
      name: 'Max Blast',
      subtitle: 'NUCLEAR MODE',
      price: 2499,
      duration: 7,
      daily_limit: 35,
      leads: 245,
      weight: 12,
      priority: 'Maximum',
      perLeadCost: 10.20,
      badge: 'BEAST MODE',
      icon: TrendingUp,
      color: 'red',
      features: ['35 Leads/Day', '7 Days', 'Maximum Priority', 'Exclusive Leads']
    }
  ];

  // Check if within working hours
  const isWithinWorkingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 22;
  };

  // Calculate user's hybrid score
  const calculateHybridScore = (user: UserProfile): number => {
    if (!user) return 0;
    
    const planWeight = user.plan_weight || 1;
    const leadsToday = user.leads_today || 0;
    
    // Formula: (PlanWeight * 10) - (LeadsToday * 2)
    const score = (planWeight * 10) - (leadsToday * 2);
    
    return Math.max(0, score);
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get User Profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(userData);

      // Update last activity
      await supabase
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', user.id);

      // Get Manager Name
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

      // Get Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);

      // Calculate Distribution Info
      if (userData) {
        const score = calculateHybridScore(userData);
        
        // Get queue position (how many users have higher scores)
        const { data: allActiveUsers } = await supabase
          .from('users')
          .select('id, plan_weight, leads_today')
          .eq('payment_status', 'active')
          .eq('role', 'member')
          .gt('valid_until', new Date().toISOString());

        const sortedUsers = allActiveUsers?.map(u => ({
          id: u.id,
          score: (u.plan_weight || 1) * 10 - (u.leads_today || 0) * 2
        })).sort((a, b) => b.score - a.score) || [];

        const position = sortedUsers.findIndex(u => u.id === userData.id) + 1;

        // Get queue length
        const { count: queueLength } = await supabase
          .from('lead_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        setDistributionInfo({
          position: position,
          score: score,
          nextLeadETA: calculateNextLeadETA(userData, queueLength || 0),
          queueLength: queueLength || 0,
          isOffHours: !isWithinWorkingHours()
        });

        // Calculate Performance Stats
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyLeads = leadsData?.filter(l => 
          new Date(l.created_at) > weekAgo
        ).length || 0;

        const closedLeads = leadsData?.filter(l => l.status === 'Closed').length || 0;
        const conversionRate = leadsData?.length > 0 
          ? Math.round((closedLeads / leadsData.length) * 100) 
          : 0;

        setPerformanceStats({
          totalLeads: userData.total_leads_received || leadsData?.length || 0,
          thisWeek: weeklyLeads,
          conversionRate: conversionRate,
          avgResponseTime: '12m', // Calculate from actual data
          rank: position,
          totalMembers: sortedUsers.length
        });
      }

    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate next lead ETA
  const calculateNextLeadETA = (user: UserProfile, queueLength: number): string => {
    if (!user) return '--';
    
    const leadsToday = user.leads_today || 0;
    const dailyLimit = user.daily_limit || 0;
    
    if (leadsToday >= dailyLimit) {
      return 'Tomorrow 8 AM';
    }
    
    if (!isWithinWorkingHours()) {
      return '8 AM';
    }
    
    // Estimate based on position and queue
    const position = distributionInfo.position || 1;
    const estimatedMinutes = position * 5 + queueLength * 2;
    
    if (estimatedMinutes < 60) {
      return `~${estimatedMinutes} min`;
    } else {
      return `~${Math.round(estimatedMinutes / 60)}h`;
    }
  };

  // Get priority badge based on weight
  const getPriorityBadge = (weight: number) => {
    if (weight >= 10) {
      return { text: 'MAXIMUM', color: 'bg-red-500 text-white', icon: Flame };
    } else if (weight >= 5) {
      return { text: 'HIGH', color: 'bg-orange-500 text-white', icon: Zap };
    } else if (weight >= 3) {
      return { text: 'MEDIUM', color: 'bg-blue-500 text-white', icon: ArrowUp };
    } else {
      return { text: 'STANDARD', color: 'bg-slate-500 text-white', icon: Shield };
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription for new leads
    const channel = supabase
      .channel('member-leads')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `user_id=eq.${profile?.id}`
      }, (payload) => {
        setLeads(prev => [payload.new as Lead, ...prev]);
        fetchData();
      })
      .subscribe();

    // Activity tracker - update every minute
    const activityInterval = setInterval(() => {
      if (profile?.id) {
        supabase
          .from('users')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', profile.id);
      }
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(activityInterval);
    };
  }, [profile?.id]);

  // Calculations
  const getDaysUntilExpiry = () => {
    if (!profile?.valid_until) return null;
    const expiry = new Date(profile.valid_until);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;
  
  const leadsToday = profile?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = leadsToday >= dailyLimit && dailyLimit > 0;

  const priorityBadge = getPriorityBadge(profile?.plan_weight || 1);

  const stats = {
    total: leads.length,
    fresh: leads.filter(l => l.status === 'Fresh').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    callBack: leads.filter(l => l.status === 'Call Back').length,
  };

  const conversionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

  // Handlers
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, status: newStatus } : l
    ));
    
    await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    
    try {
      await supabase
        .from('leads')
        .update({ notes: noteText, updated_at: new Date().toISOString() })
        .eq('id', showNotesModal.id);

      setLeads(prev => prev.map(l => 
        l.id === showNotesModal.id ? { ...l, notes: noteText } : l
      ));
      
      setShowNotesModal(null);
      setNoteText('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Hi ${name}, I'm ${profile?.name} from LeadFlow. I saw your inquiry. Are you available to discuss?`
    );
    const cleanPhone = phone.replace(/\D/g, '');
    const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${prefixedPhone}?text=${message}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Fresh': 'bg-blue-50 border-blue-200 text-blue-700',
      'Contacted': 'bg-cyan-50 border-cyan-200 text-cyan-700',
      'Call Back': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      'Interested': 'bg-green-50 border-green-200 text-green-700',
      'Follow-up': 'bg-orange-50 border-orange-200 text-orange-700',
      'Closed': 'bg-purple-50 border-purple-200 text-purple-700',
      'Rejected': 'bg-red-50 border-red-200 text-red-700',
    };
    return colors[status] || 'bg-slate-50 border-slate-200 text-slate-700';
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
                  ⚠️ You're missing leads right now!
                </p>
                <p className="text-red-500 text-sm mt-1">
                  Other members are receiving leads that could be yours
                </p>
              </div>
              
              <button 
                onClick={() => setShowRenewModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} /> Renew Now & Resume Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🟡 OFF HOURS BANNER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {distributionInfo.isOffHours && !isExpired && !bannerDismissed && (
        <div className="bg-yellow-500 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span className="font-medium">
                ⏰ Off Hours: New leads will be distributed at 8 AM
              </span>
            </div>
            <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-white/20 rounded">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🟠 EXPIRING SOON BANNER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isExpiringSoon && !isExpired && !bannerDismissed && (
        <div className={`${daysLeft && daysLeft <= 2 ? 'bg-red-500' : 'bg-orange-500'} text-white py-3 px-4`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="animate-pulse" />
              <span>
                ⏰ Plan expires in <strong>{daysLeft} days</strong>!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowRenewModal(true)}
                className="bg-white text-orange-600 px-4 py-1.5 rounded-lg font-bold text-sm"
              >
                Renew Now
              </button>
              <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-white/20 rounded">
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
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} />
              <span>🎯 Daily limit reached! Upgrade for more leads</span>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-bold text-sm"
            >
              Upgrade Now
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  👋 {profile?.name || 'Member'}
                </h1>
                
                {/* Priority Badge */}
                <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${priorityBadge.color}`}>
                  <priorityBadge.icon size={12} />
                  {priorityBadge.text} PRIORITY
                </span>
              </div>
              
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Manager: <strong className="text-blue-600">{managerName}</strong></span>
                <span>•</span>
                <span className="text-green-600 font-medium">{profile?.plan_name || 'No Plan'}</span>
                <span>•</span>
                <span className="text-slate-400">Score: {distributionInfo.score}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {profile?.sheet_url && (
                <a 
                  href={profile.sheet_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  <FileSpreadsheet size={16} />
                  <span className="hidden sm:inline">Sheet</span>
                </a>
              )}
              
              <button 
                onClick={fetchData}
                disabled={refreshing}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🎯 DISTRIBUTION STATUS CARD (NEW!) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Position */}
              <div className="text-center">
                <div className="text-3xl font-black">#{distributionInfo.position}</div>
                <div className="text-xs text-blue-200">Queue Position</div>
              </div>
              
              <div className="w-px h-12 bg-white/20"></div>
              
              {/* Score */}
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star size={20} className="text-yellow-300" />
                  <span className="text-3xl font-black">{distributionInfo.score}</span>
                </div>
                <div className="text-xs text-blue-200">Hybrid Score</div>
              </div>
              
              <div className="w-px h-12 bg-white/20 hidden sm:block"></div>
              
              {/* Next Lead ETA */}
              <div className="text-center hidden sm:block">
                <div className="text-xl font-bold">{distributionInfo.nextLeadETA}</div>
                <div className="text-xs text-blue-200">Next Lead ETA</div>
              </div>
            </div>
            
            {/* Score Breakdown Button */}
            <button
              onClick={() => setShowScoreBreakdown(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-all"
            >
              <BarChart3 size={16} />
              How Score Works
            </button>
          </div>
          
          {/* Score Explanation */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Plan Weight: {profile?.plan_weight || 1} × 10 = {(profile?.plan_weight || 1) * 10}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Leads Today: {leadsToday} × 2 = -{leadsToday * 2}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Final: {distributionInfo.score} points</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📊 PROGRESS SECTION */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          
          {/* Daily Progress */}
          <div className={`rounded-xl p-4 ${isLimitReached ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Target size={18} />
                <span className="font-medium">Today's Leads</span>
              </div>
              <span className="font-bold text-lg">{leadsToday} / {dailyLimit}</span>
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
                {dailyLimit - leadsToday} more leads expected today
              </p>
            )}
          </div>

          {/* Plan Progress */}
          {daysLeft !== null && daysLeft > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-600" />
                  <span className="font-medium text-slate-700">Plan Status</span>
                </div>
                <span className={`font-bold ${daysLeft <= 5 ? 'text-red-600' : 'text-slate-900'}`}>
                  {daysLeft} days left
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-3">
                  <div 
                    className={`rounded-full h-3 ${daysLeft <= 5 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.max(0, 100 - (daysLeft / 30) * 100)}%` }}
                  ></div>
                </div>
                {daysLeft <= 7 && (
                  <button 
                    onClick={() => setShowRenewModal(true)}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold"
                  >
                    Renew
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📊 PERFORMANCE STATS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <StatCard 
            label="Total Leads" 
            value={performanceStats.totalLeads} 
            color="slate" 
            icon={<Target size={16} />} 
          />
          <StatCard 
            label="This Week" 
            value={performanceStats.thisWeek} 
            color="blue" 
            icon={<Calendar size={16} />} 
          />
          <StatCard 
            label="Fresh" 
            value={stats.fresh} 
            color="green" 
            icon={<Clock size={16} />} 
          />
          <StatCard 
            label="Closed" 
            value={stats.closed} 
            color="purple" 
            icon={<Check size={16} />} 
          />
          <StatCard 
            label="Conversion" 
            value={`${conversionRate}%`} 
            color="orange" 
            icon={<Flame size={16} />} 
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🎯 UPGRADE PROMPT (Based on Performance) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {conversionRate >= 20 && (profile?.plan_weight || 1) < 5 && !isExpired && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900">You're a Top Performer! 🔥</h3>
                <p className="text-sm text-purple-700">
                  Your {conversionRate}% conversion is excellent. Upgrade to get more leads and increase your priority!
                </p>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                Upgrade
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
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">All Status ({leads.length})</option>
              <option value="Fresh">🔵 Fresh ({stats.fresh})</option>
              <option value="Call Back">🟡 Call Back ({stats.callBack})</option>
              <option value="Interested">🟢 Interested ({stats.interested})</option>
              <option value="Closed">🟣 Closed ({stats.closed})</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">📅 All Time</option>
              <option value="today">📆 Today</option>
              <option value="week">🗓️ Last 7 Days</option>
            </select>
            
            {(statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
                className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📋 LEADS LIST */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">My Leads</h2>
            <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">
              {filteredLeads.length} of {leads.length}
            </span>
          </div>
          
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Target size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-medium text-slate-800">No leads found</p>
              <p className="text-sm text-slate-500 mt-1">
                {leads.length === 0 ? "Wait for leads to be assigned! 🚀" : "Try adjusting filters"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{lead.name}</span>
                        {lead.distribution_score && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Score: {lead.distribution_score}
                          </span>
                        )}
                      </div>
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
                      <StickyNote size={12} className="mt-0.5" />
                      <span>{lead.notes}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${lead.phone}`} 
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium text-sm"
                    >
                      <Phone size={16} /> {lead.phone}
                    </a>
                    <a 
                      href={getWhatsAppLink(lead.phone, lead.name)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm"
                    >
                      <MessageSquare size={16} /> WhatsApp
                    </a>
                    <button 
                      onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }}
                      className="p-2.5 bg-slate-100 text-slate-600 rounded-lg"
                    >
                      <StickyNote size={16} />
                    </button>
                  </div>
                  
                  <select 
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className="w-full mt-3 bg-white border border-slate-200 text-sm rounded-lg px-3 py-2.5"
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
          )}
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📊 SCORE BREAKDOWN MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showScoreBreakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">🧮 How Your Score Works</h3>
                <button onClick={() => setShowScoreBreakdown(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">Formula:</p>
                <p className="font-mono text-lg text-blue-900">
                  Score = (Weight × 10) - (Leads × 2)
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800">Plan Weight ({profile?.plan_weight || 1} × 10)</span>
                  <span className="font-bold text-green-700">+{(profile?.plan_weight || 1) * 10}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-800">Leads Today ({leadsToday} × 2)</span>
                  <span className="font-bold text-red-700">-{leadsToday * 2}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg">
                  <span className="font-bold text-purple-900">Your Score</span>
                  <span className="text-2xl font-black text-purple-700">{distributionInfo.score}</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> Higher plan = Higher weight = More leads faster!
                </p>
              </div>
              
              <button
                onClick={() => { setShowScoreBreakdown(false); setShowUpgradeModal(true); }}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold"
              >
                Upgrade for Higher Score
              </button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-sm text-slate-500 mt-1">Higher plan = Higher priority = More leads!</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {planOptions.map((plan) => {
                const isCurrent = profile?.plan_name?.toLowerCase() === plan.id.toLowerCase();
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
                    
                    <div className="text-center mb-4 pt-2">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Icon size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                      
                      {/* Priority Badge */}
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${
                        plan.weight >= 5 ? 'bg-orange-100 text-orange-700' :
                        plan.weight >= 3 ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        Weight: {plan.weight} • {plan.priority} Priority
                      </span>
                      
                      <div className="text-3xl font-black text-slate-900 mt-2">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-slate-500">/mo</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check size={14} className="text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      disabled={isCurrent}
                      className={`w-full py-2.5 rounded-lg font-bold text-sm ${
                        isCurrent ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                        'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔄 RENEW MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-900">🔄 Renew / Upgrade</h3>
                <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Tabs */}
              <div className="flex bg-slate-100 rounded-xl p-1.5 mb-6">
                <button
                  onClick={() => setRenewTab('monthly')}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${
                    renewTab === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Calendar size={16} /> Monthly (30 Days)
                </button>
                <button
                  onClick={() => setRenewTab('booster')}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${
                    renewTab === 'booster' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Zap size={16} /> 7-Day Boosters
                </button>
              </div>

              {/* Monthly Plans */}
              {renewTab === 'monthly' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {planOptions.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div key={plan.id} className={`rounded-xl border-2 p-4 ${
                        plan.popular ? 'border-purple-500 bg-purple-50' : 'border-slate-200'
                      }`}>
                        <div className="text-center mb-4">
                          <Icon size={24} className="mx-auto mb-2 text-blue-600" />
                          <h4 className="font-bold">{plan.name}</h4>
                          <div className="text-xs mt-1 text-slate-500">
                            Weight: {plan.weight} • {plan.priority}
                          </div>
                          <div className="text-2xl font-black mt-2">₹{plan.price}</div>
                          <div className="text-xs text-slate-500">{plan.daily_limit} leads/day</div>
                        </div>
                        <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">
                          Select
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Booster Plans */}
              {renewTab === 'booster' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {boosterPlans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div key={plan.id} className={`rounded-xl border-2 p-4 ${
                        plan.popular ? 'border-orange-500 bg-orange-50' : 'border-orange-200'
                      }`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {plan.badge}
                          </span>
                        </div>
                        <div className="text-center mb-4 pt-2">
                          <Icon size={24} className="mx-auto mb-2 text-orange-600" />
                          <h4 className="font-bold">{plan.name}</h4>
                          <div className="text-xs text-orange-600 font-bold">{plan.subtitle}</div>
                          <div className="text-xs mt-1 text-slate-500">
                            Weight: {plan.weight} • {plan.priority}
                          </div>
                          <div className="text-2xl font-black mt-2">₹{plan.price}</div>
                          <div className="text-xs text-slate-500">{plan.daily_limit} leads/day × 7 days</div>
                        </div>
                        <button className="w-full py-2 bg-orange-500 text-white rounded-lg font-bold text-sm">
                          Get Booster
                        </button>
                      </div>
                    );
                  })}
                </div>
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
                <h3 className="font-bold text-lg">📝 Add Note</h3>
                <button onClick={() => setShowNotesModal(null)} className="text-slate-400">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 resize-none"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={savingNote}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium"
                >
                  {savingNote ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
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
