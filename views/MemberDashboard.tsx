import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare,
  X, Calendar, Target, TrendingUp, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock, Eye,
  Gift, Flame, ArrowUp, Bell, Rocket, Shield,
  AlertCircle, Award, ChevronDown, Menu
} from 'lucide-react';
import { Subscription } from './Subscription';

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

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

interface PerformanceStats {
  totalLeads: number;
  thisWeek: number;
  conversionRate: number;
}

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState('Loading...');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modals
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Banners
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [renewTab, setRenewTab] = useState<'monthly' | 'booster'>('monthly');

  // Mobile menu
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      icon: Shield as LucideIcon,
      popular: false,
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
      icon: Crown as LucideIcon,
      popular: true,
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
      icon: Rocket as LucideIcon,
      popular: false,
      features: ['16 Leads/Day', 'Top Priority', 'All Filters', 'Dedicated Support', 'Team Dashboard']
    },
  ];

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
      badge: 'SPEED',
      icon: Zap as LucideIcon,
      popular: false,
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
      badge: 'BEST ROI',
      icon: Flame as LucideIcon,
      popular: true,
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
      badge: 'BEAST MODE',
      icon: TrendingUp as LucideIcon,
      popular: false,
      features: ['35 Leads/Day', '7 Days', 'Maximum Priority', 'Exclusive Leads']
    }
  ];

  const isWithinWorkingHours = () => {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 22;
  };

  const getDaysUntilExpiry = () => {
    if (!profile?.valid_until) return null;
    const expiry = new Date(profile.valid_until);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;

  const leadsToday = profile?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const remainingToday = Math.max(0, dailyLimit - leadsToday);
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = dailyLimit > 0 && leadsToday >= dailyLimit;

  const priorityBadge = useMemo(() => {
    const w = profile?.plan_weight || 1;
    if (w >= 10) return { text: 'MAXIMUM', color: 'bg-red-500 text-white', icon: Flame as LucideIcon };
    if (w >= 5) return { text: 'HIGH', color: 'bg-orange-500 text-white', icon: Zap as LucideIcon };
    if (w >= 3) return { text: 'MEDIUM', color: 'bg-blue-500 text-white', icon: ArrowUp as LucideIcon };
    return { text: 'STANDARD', color: 'bg-slate-600 text-white', icon: Shield as LucideIcon };
  }, [profile?.plan_weight]);

  const deliveryStatus = useMemo(() => {
    if (!profile) return { title: 'Loading...', subtitle: '' };

    if (profile.payment_status !== 'active') {
      return { title: 'Inactive Plan', subtitle: 'Renew to start receiving leads again.' };
    }

    if (!isWithinWorkingHours()) {
      return { title: 'Off Hours', subtitle: 'Leads will deliver at 8 AM.' };
    }

    if (isLimitReached) {
      return { title: 'Limit Reached', subtitle: 'More leads tomorrow.' };
    }

    return { title: 'Delivering Leads', subtitle: `${remainingToday} more leads today.` };
  }, [profile, isLimitReached, remainingToday]);

  const performanceStats: PerformanceStats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekly = leads.filter(l => new Date(l.created_at) > weekAgo).length;
    const closed = leads.filter(l => l.status === 'Closed').length;
    const conversion = leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0;

    return {
      totalLeads: profile?.total_leads_received || leads.length,
      thisWeek: weekly,
      conversionRate: conversion,
    };
  }, [leads, profile?.total_leads_received]);

  const stats = useMemo(() => ({
    total: leads.length,
    fresh: leads.filter(l => l.status === 'Fresh').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    callBack: leads.filter(l => l.status === 'Call Back').length,
  }), [leads]);

  const conversionRate = performanceStats.conversionRate;

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
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
  }, [leads, statusFilter, dateFilter]);

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

      await supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', user.id);

      if (userData?.manager_id) {
        const { data: managerData } = await supabase
          .from('users')
          .select('name')
          .eq('id', userData.manager_id)
          .single();
        setManagerName(managerData?.name || 'Unknown');
      } else {
        setManagerName('Direct (No Manager)');
      }

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLeads(leadsData || []);
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('member-leads')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        setLeads(prev => [payload.new as Lead, ...prev]);
      })
      .subscribe();

    const activityInterval = setInterval(() => {
      supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', profile.id);
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(activityInterval);
    };
  }, [profile?.id]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      alert('Error updating status!');
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

      setLeads(prev => prev.map(l => (l.id === showNotesModal.id ? { ...l, notes: noteText } : l)));
      setShowNotesModal(null);
      setNoteText('');
    } catch (err: any) {
      alert('Error saving note: ' + err.message);
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
    switch (status) {
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

  // Calculate total banner height for content offset
  const getBannerCount = () => {
    let count = 0;
    if (!isWithinWorkingHours() && !isExpired && !bannerDismissed) count++;
    if (isExpiringSoon && !isExpired && !bannerDismissed) count++;
    if (isLimitReached && !isExpired) count++;
    return count;
  };

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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SUBSCRIPTION MODAL (Full Screen)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showSubscription && (
        <Subscription onClose={() => setShowSubscription(false)} />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          EXPIRED OVERLAY
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
                <p className="text-red-600 font-bold text-lg">⚠️ Your leads are stopped</p>
                <p className="text-red-500 text-sm mt-1">Renew to start receiving leads again</p>
              </div>

              <button
                onClick={() => setShowSubscription(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} /> Renew Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOP BANNERS (Non-sticky, scroll away)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative z-30">
        {/* Off Hours Banner */}
        {!isWithinWorkingHours() && !isExpired && !bannerDismissed && (
          <div className="bg-yellow-500 text-white py-2.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} />
                <span className="font-medium">⏰ Off Hours: Leads start at 8 AM</span>
              </div>
              <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-white/20 rounded flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Expiring Soon Banner */}
        {isExpiringSoon && !isExpired && !bannerDismissed && (
          <div className={`${daysLeft && daysLeft <= 2 ? 'bg-red-500' : 'bg-orange-500'} text-white py-2.5 px-4`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Bell size={16} className="animate-pulse flex-shrink-0" />
                <span>Plan expires in <strong>{daysLeft} days</strong>!</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowSubscription(true)}
                  className="bg-white text-orange-600 px-3 py-1 rounded-lg font-bold text-xs"
                >
                  Renew
                </button>
                <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-white/20 rounded">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Daily Limit Reached Banner */}
        {isLimitReached && !isExpired && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Target size={16} />
                <span>🎯 Daily limit reached!</span>
              </div>
              <button
                onClick={() => setShowSubscription(true)}
                className="bg-white text-blue-600 px-3 py-1 rounded-lg font-bold text-xs flex-shrink-0"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STICKY HEADER - Simplified for Mobile
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center gap-2">
            
            {/* Left: Name & Plan */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">
                  👋 {profile?.name?.split(' ')[0] || 'Member'}
                </h1>
                <span className={`hidden xs:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${priorityBadge.color}`}>
                  {priorityBadge.text}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate">
                <span className="text-green-600 font-medium">{profile?.plan_name || 'No Plan'}</span>
                <span className="mx-1">•</span>
                <span>{managerName}</span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Sheet Button */}
              {profile?.sheet_url && (
                <a
                  href={profile.sheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  title="Open Sheet"
                >
                  <FileSpreadsheet size={18} />
                  <span className="hidden sm:inline ml-1.5 text-sm font-medium">Sheet</span>
                </a>
              )}

              {/* Refresh */}
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                title="Refresh"
              >
                <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Logout */}
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN CONTENT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">

        {/* Delivery Status Card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="text-[10px] sm:text-xs text-blue-200 font-bold uppercase">Delivery Status</div>
              <div className="text-lg sm:text-2xl font-black">{deliveryStatus.title}</div>
              <div className="text-xs sm:text-sm text-blue-100 mt-0.5">{deliveryStatus.subtitle}</div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-center">
                <div className="text-lg sm:text-xl font-bold">{remainingToday}</div>
                <div className="text-[10px] sm:text-xs text-blue-200">Remaining</div>
              </div>

              <button
                onClick={() => setShowDeliveryInfo(true)}
                className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <AlertCircle size={14} />
                <span className="hidden xs:inline">Why delay?</span>
                <span className="xs:hidden">Info</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
              <span className="text-blue-100">Today's Progress</span>
              <span className="font-bold">{leadsToday}/{dailyLimit}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-3">
              <div
                className="bg-white rounded-full h-2 sm:h-3 transition-all duration-500"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards - Scrollable on Mobile */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible scrollbar-hide">
          <StatCard label="Total" value={performanceStats.totalLeads} color="slate" icon={<Target size={14} />} />
          <StatCard label="This Week" value={performanceStats.thisWeek} color="blue" icon={<Calendar size={14} />} />
          <StatCard label="Fresh" value={stats.fresh} color="green" icon={<Clock size={14} />} />
          <StatCard label="Closed" value={stats.closed} color="purple" icon={<Check size={14} />} />
          <StatCard label="Conv." value={`${conversionRate}%`} color="orange" icon={<Flame size={14} />} />
        </div>

        {/* Upgrade Prompt */}
        {conversionRate >= 20 && (profile?.plan_weight || 1) < 5 && !isExpired && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Award size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-purple-900 text-sm sm:text-base">Top Performer! 🔥</h3>
                <p className="text-xs sm:text-sm text-purple-700 truncate">
                  {conversionRate}% conversion - Upgrade for more leads
                </p>
              </div>
              <button
                onClick={() => setShowSubscription(true)}
                className="bg-purple-600 text-white px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex-shrink-0"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex gap-2 sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All ({leads.length})</option>
              <option value="Fresh">Fresh ({stats.fresh})</option>
              <option value="Call Back">Callback ({stats.callBack})</option>
              <option value="Interested">Interested ({stats.interested})</option>
              <option value="Closed">Closed ({stats.closed})</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
            </select>

            {(statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
                className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">My Leads</h2>
            <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">
              {filteredLeads.length} of {leads.length}
            </span>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Target size={40} className="mx-auto mb-4 text-slate-300" />
              <p className="font-medium text-slate-800 text-sm sm:text-base">No leads found</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {leads.length === 0 ? 'Wait for leads! 🚀' : 'Try adjusting filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                  {/* Lead Header */}
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm sm:text-base truncate">{lead.name}</div>
                      <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {lead.city || 'N/A'}
                        <span className="mx-0.5">•</span>
                        <Clock size={10} /> {getTimeAgo(lead.created_at)}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold border flex-shrink-0 ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mb-2 sm:mb-3 flex items-start gap-1">
                      <StickyNote size={12} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{lead.notes}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm"
                    >
                      <Phone size={14} /> 
                      <span className="hidden xs:inline">{lead.phone}</span>
                      <span className="xs:hidden">Call</span>
                    </a>
                    <a
                      href={getWhatsAppLink(lead.phone, lead.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm"
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </a>
                    <button
                      onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }}
                      className="p-2 sm:p-2.5 bg-slate-100 text-slate-600 rounded-lg flex-shrink-0"
                    >
                      <StickyNote size={16} />
                    </button>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className="w-full mt-2 sm:mt-3 bg-white border border-slate-200 text-xs sm:text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE BOTTOM CTA - Upgrade Button
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {!isExpired && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:hidden z-30 shadow-lg">
          <button
            onClick={() => setShowSubscription(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            Upgrade for More Leads
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DELIVERY INFO MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showDeliveryInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">Why leads may delay?</h3>
                <button onClick={() => setShowDeliveryInfo(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="font-bold text-blue-900 text-sm">Working Hours</p>
                <p className="text-xs text-blue-700">Leads are delivered between <b>8 AM – 10 PM</b>.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="font-bold text-slate-800 text-sm">Daily Limit</p>
                <p className="text-xs text-slate-600">
                  Your plan: <b>{dailyLimit}</b> leads/day. Remaining: <b>{remainingToday}</b>.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                <p className="font-bold text-purple-900 text-sm">Your Priority</p>
                <p className="text-xs text-purple-700">
                  Higher plans get leads faster. You: <b>{priorityBadge.text}</b>.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="font-bold text-yellow-900 text-sm">Common Reasons</p>
                <ul className="text-xs text-yellow-800 list-disc pl-4 space-y-0.5 mt-1">
                  <li>Off hours (after 10 PM)</li>
                  <li>Daily limit reached</li>
                  <li>Plan expired / inactive</li>
                </ul>
              </div>

              <button
                onClick={() => { setShowDeliveryInfo(false); setShowSubscription(true); }}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold text-sm"
              >
                Upgrade for More Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NOTES MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">📝 Add Note</h3>
                <button onClick={() => setShowNotesModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={22} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1 truncate">{showNotesModal?.name} • {showNotesModal?.phone}</p>
            </div>

            <div className="p-4 sm:p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes about this lead..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none h-28 sm:h-32"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={savingNote}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STYLES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (min-width: 400px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
          .xs\\:inline-flex { display: inline-flex; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// Stat Card Component - Mobile Optimized
// ============================================================

const StatCard = ({ 
  label, 
  value, 
  color, 
  icon 
}: { 
  label: string; 
  value: number | string; 
  color: string; 
  icon: React.ReactNode 
}) => {
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
    <div className={`flex-shrink-0 w-[100px] sm:w-auto bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-slate-100 border-l-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase truncate">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default MemberDashboard;
