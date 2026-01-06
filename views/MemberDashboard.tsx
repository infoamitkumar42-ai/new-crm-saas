/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - MemberDashboard.tsx v3.0                      ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: STABLE - DO NOT MODIFY                            ║
 * ║                                                            ║
 * ║  Features:                                                 ║
 * ║  - ✅ Pause/Resume System                                  ║
 * ║  - ✅ Plan Extension Display                               ║
 * ║  - ✅ Total Leads Progress                                 ║
 * ║  - ✅ Invalid Lead Reporting                               ║
 * ║  - ✅ Real-time Notifications                              ║
 * ║                                                            ║
 * ║  ⚠️  TO UNLOCK: Say "UNLOCK MemberDashboard for [reason]"  ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare,
  X, Calendar, Target, Clock,
  StickyNote, Check, LogOut, Zap, Crown, Lock,
  Flame, ArrowUp, Bell, Shield,
  AlertCircle, Award, ChevronDown, Moon, Pause, Play,
  CheckCircle2, AlertTriangle, Flag, Gift
} from 'lucide-react';
import { Subscription } from '../components/Subscription';

// ============================================================
// TYPES
// ============================================================

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
  is_active?: boolean;
  days_extended?: number;
  total_leads_promised?: number;
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

interface DeliveryStatusInfo {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  statusType: 'active' | 'off_hours' | 'limit_reached' | 'paused' | 'inactive' | 'expired';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const getTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Fresh': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'Contacted': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    case 'Call Back': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'Interested': return 'bg-green-50 border-green-200 text-green-700';
    case 'Follow-up': return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'Closed': return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'Rejected': return 'bg-red-50 border-red-200 text-red-700';
    case 'Invalid': return 'bg-gray-50 border-gray-300 text-gray-600';
    default: return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

const isWithinWorkingHours = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 22;
};

const getTimeUntilOpen = (): string => {
  const hour = new Date().getHours();
  if (hour >= 22) {
    return `Opens in ${24 - hour + 8} hours`;
  } else if (hour < 8) {
    return `Opens in ${8 - hour} hours`;
  }
  return '';
};

// ============================================================
// STAT CARD COMPONENT
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
    slate: 'border-l-slate-400 bg-slate-50/50',
    blue: 'border-l-blue-500 bg-blue-50/50',
    green: 'border-l-green-500 bg-green-50/50',
    purple: 'border-l-purple-500 bg-purple-50/50',
    orange: 'border-l-orange-500 bg-orange-50/50'
  };
  const iconColors: Record<string, string> = {
    slate: 'text-slate-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className={`flex-shrink-0 w-[100px] sm:w-auto bg-white p-3 rounded-xl shadow-sm border border-slate-100 border-l-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase truncate">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

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
  const [showReportModal, setShowReportModal] = useState<Lead | null>(null);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  // Form States
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingLead, setReportingLead] = useState(false);

  // Banners
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ============================================================
  // WHATSAPP LINK GENERATOR
  // ============================================================
  const getWhatsAppLink = (phone: string, leadName: string, userName: string): string => {
    const safeName = leadName || 'there';
    const safeUserName = userName || 'LeadFlow';
    const message = encodeURIComponent(
      `Hi ${safeName}, I'm ${safeUserName} from LeadFlow. I saw your inquiry and wanted to connect. Are you available to discuss?`
    );
    const cleanPhone = phone.replace(/\D/g, '');
    const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${prefixedPhone}?text=${message}`;
  };

  // ============================================================
  // COMPUTED VALUES (CORRECTLY PLACED AT COMPONENT LEVEL)
  // ============================================================

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
  const isPaused = profile?.is_active === false;

  // ✅ PLAN EXTENSION COMPUTED VALUES
  const daysExtended = profile?.days_extended || 0;
  const totalPromised = profile?.total_leads_promised || 50;
  const totalReceived = profile?.total_leads_received || 0;
  const remainingLeads = Math.max(0, totalPromised - totalReceived);
  const totalProgress = totalPromised > 0 ? Math.min(100, Math.round((totalReceived / totalPromised) * 100)) : 0;

  const priorityBadge = useMemo(() => {
    const w = profile?.plan_weight || 1;
    if (w >= 9) return { text: 'ULTRA', color: 'bg-red-500 text-white', icon: Flame as LucideIcon };
    if (w >= 7) return { text: 'TURBO', color: 'bg-orange-500 text-white', icon: Zap as LucideIcon };
    if (w >= 5) return { text: 'PREMIUM', color: 'bg-purple-500 text-white', icon: Crown as LucideIcon };
    if (w >= 3) return { text: 'HIGH', color: 'bg-blue-500 text-white', icon: ArrowUp as LucideIcon };
    return { text: 'STANDARD', color: 'bg-slate-600 text-white', icon: Shield as LucideIcon };
  }, [profile?.plan_weight]);

  // ============================================================
  // DELIVERY STATUS
  // ============================================================
  const deliveryStatus: DeliveryStatusInfo = useMemo(() => {
    if (!profile) {
      return {
        title: 'Loading...',
        subtitle: 'Fetching status',
        icon: Clock,
        iconBgColor: 'bg-white/20',
        iconColor: 'text-white',
        statusType: 'inactive'
      };
    }

    if (profile.payment_status !== 'active' || isExpired) {
      return {
        title: 'Plan Inactive',
        subtitle: 'Renew to receive leads',
        icon: AlertTriangle,
        iconBgColor: 'bg-red-500/30',
        iconColor: 'text-red-200',
        statusType: 'expired'
      };
    }

    if (isPaused) {
      return {
        title: 'Delivery Paused',
        subtitle: 'Resume to receive leads',
        icon: Pause,
        iconBgColor: 'bg-orange-500/30',
        iconColor: 'text-orange-200',
        statusType: 'paused'
      };
    }

    if (!isWithinWorkingHours()) {
      return {
        title: 'Off Hours',
        subtitle: 'Delivery: 8 AM - 10 PM',
        icon: Moon,
        iconBgColor: 'bg-white/20',
        iconColor: 'text-indigo-200',
        statusType: 'off_hours'
      };
    }

    if (isLimitReached) {
      return {
        title: 'Daily Limit Reached',
        subtitle: `Received ${dailyLimit} leads today`,
        icon: CheckCircle2,
        iconBgColor: 'bg-green-500/30',
        iconColor: 'text-green-200',
        statusType: 'limit_reached'
      };
    }

    return {
      title: 'Actively Receiving',
      subtitle: `${remainingToday} more leads today`,
      icon: Zap,
      iconBgColor: 'bg-green-500/30',
      iconColor: 'text-green-300',
      statusType: 'active'
    };
  }, [profile, isExpired, isPaused, isLimitReached, remainingToday, dailyLimit]);

  const stats = useMemo(() => ({
    total: leads.length,
    fresh: leads.filter(l => l.status === 'Fresh').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    closed: leads.filter(l => l.status === 'Closed').length,
    callBack: leads.filter(l => l.status === 'Call Back').length,
  }), [leads]);

  const conversionRate = useMemo(() => {
    const closed = leads.filter(l => l.status === 'Closed').length;
    return leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0;
  }, [leads]);

  const weeklyLeads = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return leads.filter(l => new Date(l.created_at) > weekAgo).length;
  }, [leads]);

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

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setProfile(userData);

      // Update last activity
      await supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', user.id);

      // Fetch manager name
      if (userData?.manager_id) {
        const { data: managerData } = await supabase
          .from('users')
          .select('name')
          .eq('id', userData.manager_id)
          .maybeSingle();
        setManagerName(managerData?.name || 'Unknown');
      } else {
        setManagerName('Direct (No Manager)');
      }

      // Fetch leads
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

  // ============================================================
  // REALTIME SUBSCRIPTION
  // ============================================================
  useEffect(() => {
    if (!profile?.id) return;

    if (isPaused) {
      return;
    }

    const channel = supabase
      .channel(`member-leads-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        setLeads(prev => [payload.new as Lead, ...prev]);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔥 New Lead Received!', {
            body: `${(payload.new as Lead).name} - ${(payload.new as Lead).city}`,
            icon: '/logo.png',
            tag: 'new-lead'
          });
        }
      })
      .subscribe();

    const activityInterval = setInterval(() => {
      supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', profile.id);
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(activityInterval);
    };
  }, [profile?.id, isPaused]);

  // ============================================================
  // PAUSE/RESUME HANDLER
  // ============================================================
  const toggleDeliveryPause = async () => {
    if (!profile) return;

    const currentlyPaused = profile.is_active === false;
    const newActiveStatus = !currentlyPaused ? false : true;

    setProfile(prev => prev ? { ...prev, is_active: newActiveStatus } : null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: newActiveStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      const message = newActiveStatus
        ? '✅ Lead delivery resumed!'
        : '⏸️ Lead delivery paused.';
      alert(message);

      await fetchData();

    } catch (err: any) {
      setProfile(prev => prev ? { ...prev, is_active: !newActiveStatus } : null);
      alert(`Error: ${err.message || 'Unknown error'}`);
    }
  };

  // ============================================================
  // OTHER HANDLERS
  // ============================================================

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

  const handleReportInvalidLead = async () => {
    if (!showReportModal || !profile) return;
    if (!reportReason.trim()) {
      alert('Please enter a reason for reporting');
      return;
    }

    setReportingLead(true);
    try {
      const { error: insertError } = await supabase
        .from('lead_replacements')
        .insert({
          user_id: profile.id,
          original_lead_id: showReportModal.id,
          original_lead_phone: showReportModal.phone,
          reason: reportReason.trim(),
          reason_details: `Lead Name: ${showReportModal.name}, City: ${showReportModal.city}`,
          status: 'pending',
          requested_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'Invalid',
          updated_at: new Date().toISOString(),
          notes: (showReportModal.notes || '') + `\n[REPORTED: ${reportReason.trim()}]`
        })
        .eq('id', showReportModal.id);

      if (updateError) throw updateError;

      setLeads(prev => prev.map(l =>
        l.id === showReportModal.id
          ? { ...l, status: 'Invalid', notes: (l.notes || '') + `\n[REPORTED: ${reportReason.trim()}]` }
          : l
      ));

      setShowReportModal(null);
      setReportReason('');
      alert('✅ Lead reported successfully!');

    } catch (err: any) {
      alert('Error reporting lead: ' + err.message);
    } finally {
      setReportingLead(false);
    }
  };

  const StatusIcon = deliveryStatus.icon;

  // ============================================================
  // LOADING STATE
  // ============================================================
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

  // ============================================================
  // NO PROFILE FALLBACK
  // ============================================================
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
          <p className="text-slate-500 mb-4">Please try logging in again.</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            Sign Out & Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isExpired ? 'overflow-hidden' : ''}`}>

      {/* Subscription Modal */}
      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}

      {/* Expired Overlay */}
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
              <button
                onClick={() => setShowSubscription(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg"
              >
                <RefreshCw size={20} className="inline mr-2" /> Renew Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banners */}
      <div className="relative z-30">
        {isPaused && !isExpired && (
          <div className="bg-orange-500 text-white py-2.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Pause size={16} className="animate-pulse" />
                <span>⏸️ Lead delivery is paused.</span>
              </div>
              <button
                onClick={toggleDeliveryPause}
                className="bg-white text-orange-600 px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1"
              >
                <Play size={12} /> Resume
              </button>
            </div>
          </div>
        )}

        {!isWithinWorkingHours() && !isExpired && !isPaused && !bannerDismissed && (
          <div className="bg-amber-500 text-amber-950 py-2.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Moon size={16} />
                <span>⏰ Off Hours ({getTimeUntilOpen()})</span>
              </div>
              <button onClick={() => setBannerDismissed(true)} className="p-1"><X size={16} /></button>
            </div>
          </div>
        )}

        {isExpiringSoon && !isExpired && !isPaused && !bannerDismissed && (
          <div className="bg-orange-500 text-white py-2.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell size={16} className="animate-pulse" />
                <span>Plan expires in {daysLeft} days!</span>
              </div>
              <button onClick={() => setShowSubscription(true)} className="bg-white text-orange-600 px-3 py-1 rounded-lg font-bold text-xs">Renew</button>
            </div>
          </div>
        )}

        {isLimitReached && !isExpired && !isPaused && (
          <div className="bg-emerald-600 text-white py-2.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 size={16} />
                <span>🎯 Goal met! {dailyLimit} leads received.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">
                👋 {profile.name?.split(' ')[0] || 'Member'}
              </h1>
              <span className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge.color}`}>
                {priorityBadge.text}
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate">
              <span className="text-green-600 font-medium capitalize">{profile.plan_name || 'No Plan'}</span>
              <span className="mx-1 hidden sm:inline">•</span>
              <span className="hidden sm:inline">{managerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {profile.sheet_url && (
              <a
                href={profile.sheet_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline ml-1.5 text-sm font-medium">Sheet</span>
              </a>
            )}
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-6">

        {/* Delivery Status Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 blur-2xl" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className={`p-3 sm:p-4 rounded-xl ${deliveryStatus.iconBgColor} backdrop-blur-sm`}>
                  <StatusIcon size={24} className={deliveryStatus.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] sm:text-xs text-indigo-200 font-bold uppercase tracking-wide">Delivery Status</div>
                  <div className="text-lg sm:text-2xl font-black mt-0.5 truncate">{deliveryStatus.title}</div>
                  <div className="text-xs sm:text-sm text-indigo-200 mt-0.5">{deliveryStatus.subtitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 sm:py-3 text-center border border-white/10">
                  <div className="text-xl sm:text-2xl font-black">{remainingToday}</div>
                  <div className="text-[10px] sm:text-xs text-indigo-200">Remaining</div>
                </div>

                {profile.payment_status === 'active' && !isExpired && (
                  <button
                    onClick={toggleDeliveryPause}
                    disabled={refreshing}
                    className={`flex-1 sm:flex-none backdrop-blur-sm px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border ${isPaused
                      ? 'bg-green-500/30 border-green-400/30 text-green-100'
                      : 'bg-white/15 border-white/10 text-white'
                      }`}
                  >
                    {refreshing ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isPaused ? (
                      <><Play size={14} /><span>Resume</span></>
                    ) : (
                      <><Pause size={14} /><span>Pause</span></>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowDeliveryInfo(true)}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl border border-white/10"
                >
                  <AlertCircle size={18} />
                </button>
              </div>
            </div>

            {/* Daily Progress Bar */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-indigo-200">Today's Progress</span>
                <span className="font-bold">{leadsToday} / {dailyLimit}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 sm:h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>

            {/* ✅ Plan Extension Info */}
            {daysExtended > 0 && (
              <div className="mt-3 flex items-center gap-2 text-green-200 text-xs bg-green-500/20 px-3 py-2 rounded-lg">
                <Gift size={14} />
                <span>🎁 Plan extended by {daysExtended} day{daysExtended > 1 ? 's' : ''} (missed leads compensated)</span>
              </div>
            )}

            {/* ✅ Total Leads Progress */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
                <span>Total Plan Progress</span>
                <span className="font-bold">{totalReceived} / {totalPromised} leads</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              {remainingLeads > 0 && (
                <p className="text-[10px] text-indigo-300 mt-1">{remainingLeads} leads remaining in your plan</p>
              )}
            </div>

            {deliveryStatus.statusType === 'off_hours' && (
              <div className="mt-3 flex items-center gap-2 text-indigo-200 text-xs">
                <Clock size={12} />
                <span>{getTimeUntilOpen()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible scrollbar-hide">
          <StatCard label="Total" value={totalReceived} color="slate" icon={<Target size={14} />} />
          <StatCard label="This Week" value={weeklyLeads} color="blue" icon={<Calendar size={14} />} />
          <StatCard label="Fresh" value={stats.fresh} color="green" icon={<Clock size={14} />} />
          <StatCard label="Closed" value={stats.closed} color="purple" icon={<Check size={14} />} />
          <StatCard label="Conv." value={`${conversionRate}%`} color="orange" icon={<Flame size={14} />} />
        </div>

        {/* Upgrade Prompt */}
        {conversionRate >= 20 && (profile.plan_weight || 1) < 5 && !isExpired && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Award size={20} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-purple-900 text-sm sm:text-base">Top Performer! 🔥</h3>
              <p className="text-xs sm:text-sm text-purple-700">{conversionRate}% conversion - Upgrade for more leads</p>
            </div>
            <button
              onClick={() => setShowSubscription(true)}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg font-bold text-xs sm:text-sm"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Status ({leads.length})</option>
              <option value="Fresh">🔵 Fresh ({stats.fresh})</option>
              <option value="Call Back">🔄 Callback ({stats.callBack})</option>
              <option value="Interested">✅ Interested ({stats.interested})</option>
              <option value="Closed">🎉 Closed ({stats.closed})</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {(statusFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => { setStatusFilter('all'); setDateFilter('all'); }}
              className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl border border-red-200"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">My Leads</h2>
            <span className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-500 font-medium">
              {filteredLeads.length} of {leads.length}
            </span>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-800 text-sm sm:text-base">No leads found</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {leads.length === 0 ? 'Leads will appear here soon! 🚀' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
                  {/* Lead Header */}
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm sm:text-base truncate">{lead.name}</div>
                      <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={10} />
                        <span className="truncate">{lead.city || 'N/A'}</span>
                        <span className="text-slate-300">•</span>
                        <Clock size={10} />
                        <span>{getTimeAgo(lead.created_at)}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border ml-2 ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  {/* Notes Display */}
                  {lead.notes && (
                    <div className="text-xs text-slate-600 bg-amber-50 border border-amber-100 p-2.5 rounded-lg mb-3 flex items-start gap-2">
                      <StickyNote size={12} className="mt-0.5 text-amber-500" />
                      <span className="line-clamp-2">{lead.notes}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex flex-col items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl font-medium text-xs hover:bg-blue-100"
                    >
                      <Phone size={16} />
                      <span className="hidden sm:inline">Call</span>
                    </a>

                    <a
                      href={getWhatsAppLink(lead.phone, lead.name, profile.name || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1 bg-green-500 text-white py-2.5 rounded-xl font-medium text-xs hover:bg-green-600"
                    >
                      <MessageSquare size={16} />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    <button
                      onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }}
                      className="flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-medium text-xs hover:bg-slate-200"
                    >
                      <StickyNote size={16} />
                      <span className="hidden sm:inline">Note</span>
                    </button>

                    <button
                      onClick={() => { setShowReportModal(lead); setReportReason(''); }}
                      className="flex flex-col items-center justify-center gap-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-medium text-xs hover:bg-red-100"
                    >
                      <Flag size={16} />
                      <span className="hidden sm:inline">Report</span>
                    </button>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="Fresh">🔵 Fresh</option>
                      <option value="Contacted">📞 Contacted</option>
                      <option value="Call Back">🔄 Call Back</option>
                      <option value="Interested">✅ Interested</option>
                      <option value="Follow-up">📅 Follow-up</option>
                      <option value="Closed">🎉 Closed</option>
                      <option value="Rejected">❌ Rejected</option>
                      <option value="Invalid">🚫 Invalid</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom CTA */}
      {!isExpired && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 p-3 sm:hidden z-30 shadow-xl">
          <button
            onClick={() => setShowSubscription(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <Zap size={18} /> Upgrade for More Leads
          </button>
        </div>
      )}

      {/* Delivery Info Modal */}
      {showDeliveryInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Why leads may delay?</h3>
              <button onClick={() => setShowDeliveryInfo(false)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-bold text-blue-900 text-sm">⏰ Working Hours</p>
                <p className="text-xs text-blue-700 mt-1">Leads delivered <b>8 AM – 10 PM</b> IST.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="font-bold text-slate-800 text-sm">📊 Daily Limit</p>
                <p className="text-xs text-slate-600 mt-1">Your plan: <b>{dailyLimit}</b> leads/day.</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="font-bold text-purple-900 text-sm">⚡ Your Priority</p>
                <p className="text-xs text-purple-700 mt-1">Your level: <b>{priorityBadge.text}</b>.</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="font-bold text-orange-900 text-sm">⏸️ Paused Delivery</p>
                <p className="text-xs text-orange-800 mt-1">If paused, click <b>Resume</b> to start.</p>
              </div>
              <button
                onClick={() => { setShowDeliveryInfo(false); setShowSubscription(true); }}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm"
              >
                ⚡ Upgrade for Faster Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900">📝 Add Note</h3>
                <p className="text-sm text-slate-500 mt-1">{showNotesModal.name}</p>
              </div>
              <button onClick={() => setShowNotesModal(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes about this lead..."
                className="w-full border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-blue-500 resize-none h-32"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowNotesModal(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium text-sm">
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={savingNote}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingNote ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={16} /> Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                    <Flag size={20} /> Report Invalid Lead
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{showReportModal.name}</p>
                </div>
                <button onClick={() => setShowReportModal(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Select reason:</p
