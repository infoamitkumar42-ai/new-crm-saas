/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 DIAGNOSTIC - MemberDashboard.tsx v2.3                  ║
 * ║  Last Updated: January 6, 2025                             ║
 * ║  WITH ENHANCED ERROR LOGGING                               ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useMemo } from 'react';
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

interface PerformanceStats {
  totalLeads: number;
  thisWeek: number;
  conversionRate: number;
}

interface DeliveryStatusInfo {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  statusType: 'active' | 'off_hours' | 'limit_reached' | 'paused' | 'inactive' | 'expired';
}

// ============================================================
// GLOBAL HELPER FUNCTIONS
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
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

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
  // COMPUTED VALUES
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

  // ============================================================
  // ✅ ENHANCED DATA FETCHING WITH DETAILED LOGGING
  // ============================================================

  const fetchData = async () => {
    try {
      console.log('🚀 Step 1: Starting fetchData...');
      setDebugInfo('Step 1: Checking authentication...');
      setRefreshing(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('🔍 Step 2: Auth result:', { user: user?.id, error: authError });
      setDebugInfo(`Step 2: User ID: ${user?.id || 'None'}`);

      if (authError) {
        console.error('❌ Auth error:', authError);
        setDebugInfo(`ERROR: ${authError.message}`);
        throw authError;
      }

      if (!user) {
        console.warn('⚠️ No user - will redirect');
        setDebugInfo('No user found - redirecting...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        setLoading(false);
        return;
      }

      console.log('✅ Step 3: User authenticated, fetching profile...');
      setDebugInfo('Step 3: Loading profile...');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('🔍 Step 4: Profile query result:', { 
        hasData: !!userData, 
        error: userError,
        userData: userData 
      });
      setDebugInfo(`Step 4: Profile ${userData ? 'loaded' : 'failed'}`);

      if (userError) {
        console.error('❌ Profile error:', userError);
        setDebugInfo(`ERROR: ${userError.message}`);
        throw userError;
      }

      if (!userData) {
        console.error('❌ No user profile found in database');
        setDebugInfo('ERROR: Profile not found in database');
        alert('Your profile was not found. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('✅ Step 5: Profile loaded successfully');
      setDebugInfo('Step 5: Profile loaded ✓');
      setProfile(userData);

      // Update last activity
      await supabase.from('users').update({ 
        last_activity: new Date().toISOString() 
      }).eq('id', user.id);

      // Fetch manager name
      console.log('📋 Step 6: Fetching manager info...');
      setDebugInfo('Step 6: Loading manager...');
      
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
      console.log('📋 Step 7: Fetching leads...');
      setDebugInfo('Step 7: Loading leads...');

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('⚠️ Leads error (non-fatal):', leadsError);
      }

      console.log(`✅ Step 8: Loaded ${leadsData?.length || 0} leads`);
      setDebugInfo(`Step 8: ${leadsData?.length || 0} leads loaded`);
      setLeads(leadsData || []);

      console.log('🎉 All steps completed successfully!');
      setDebugInfo('✓ Dashboard loaded successfully');

    } catch (error: any) {
      console.error('💥 FATAL ERROR in fetchData:', error);
      setDebugInfo(`FATAL ERROR: ${error.message}`);
      alert(`Failed to load dashboard:\n\n${error.message}\n\nCheck console for details.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('🏁 fetchData complete');
    }
  };

  useEffect(() => {
    console.log('🎬 Component mounted, calling fetchData...');
    fetchData();
  }, []);

  // ============================================================
  // REALTIME SUBSCRIPTION
  // ============================================================
  useEffect(() => {
    if (!profile?.id) return;

    if (isPaused) {
      console.log('🔇 Realtime disabled (user paused)');
      return;
    }

    console.log('🔔 Realtime enabled (user active)');

    const channel = supabase
      .channel(`member-leads-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        console.log('🆕 New lead received:', payload.new);
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
  // OTHER HANDLERS
  // ============================================================

  const toggleDeliveryPause = async () => {
    if (!profile) return;

    const currentlyPaused = profile.is_active === false;
    const newActiveStatus = currentlyPaused;

    setProfile(prev => prev ? { ...prev, is_active: newActiveStatus } : null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: newActiveStatus, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;

      alert(newActiveStatus ? '✅ Delivery resumed!' : '⏸️ Delivery paused');
      await fetchData();
    } catch (err: any) {
      setProfile(prev => prev ? { ...prev, is_active: !newActiveStatus } : null);
      alert(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    try {
      await supabase.from('leads').update({ notes: noteText }).eq('id', showNotesModal.id);
      setLeads(prev => prev.map(l => (l.id === showNotesModal.id ? { ...l, notes: noteText } : l)));
      setShowNotesModal(null);
      setNoteText('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleReportInvalidLead = async () => {
    if (!showReportModal || !profile || !reportReason.trim()) return;

    setReportingLead(true);
    try {
      await supabase.from('lead_replacements').insert({
        user_id: profile.id,
        original_lead_id: showReportModal.id,
        original_lead_phone: showReportModal.phone,
        reason: reportReason.trim(),
        status: 'pending'
      });

      await supabase.from('leads').update({ 
        status: 'Invalid',
        notes: (showReportModal.notes || '') + `\n[REPORTED: ${reportReason}]`
      }).eq('id', showReportModal.id);

      setLeads(prev => prev.map(l => 
        l.id === showReportModal.id ? { ...l, status: 'Invalid' } : l
      ));

      setShowReportModal(null);
      setReportReason('');
      alert('✅ Lead reported successfully!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setReportingLead(false);
    }
  };

  const StatusIcon = deliveryStatus.icon;

  // ============================================================
  // ✅ ENHANCED LOADING STATE WITH DEBUG INFO
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-700 font-semibold text-lg mb-2">Loading Dashboard...</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-xs font-mono text-blue-800">{debugInfo}</p>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            If stuck here for &gt;10 seconds, check browser console (F12)
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER (ABBREVIATED - REST IS SAME AS BEFORE)
  // ============================================================
  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isExpired ? 'overflow-hidden' : ''}`}>
      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}

      {/* REST OF THE UI - SAME AS PREVIOUS VERSION */}
      {/* I'm abbreviating here to save space - use the full UI from previous response */}
      
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Dashboard Loaded!</h1>
        <p className="text-sm text-slate-500 mt-2">Profile: {profile?.name}</p>
        <p className="text-sm text-slate-500">Leads: {leads.length}</p>
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs font-mono text-green-800">{debugInfo}</p>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
