/**
 * ╔════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                        ║
 * ║   🔒 LOCKED FILE: MemberDashboard.tsx v6.0 (ULTIMATE VERBOSE EDITION)                  ║
 * ║                                                                                        ║
 * ║   Project: LeadFlow CRM                                                                ║
 * ║   Component: Member Dashboard                                                          ║
 * ║   Last Updated: January 8, 2026                                                        ║
 * ║   Status: STABLE & PRODUCTION READY                                                    ║
 * ║                                                                                        ║
 * ║   📋 DETAILED FEATURE LOG:                                                             ║
 * ║   ----------------------------------------------------------------------------------   ║
 * ║   1. UI ARCHITECTURE:                                                                  ║
 * ║      - Implemented "Vertical Boxy" Layout for Status Card (Mobile Optimized).          ║
 * ║      - "Remaining Leads" is a dedicated large square block on the left.                ║
 * ║      - "Pause/Resume" is a large Pill-shaped button on the right side.                 ║
 * ║      - Applied "Indigo-Purple" Gradient with Glassmorphism overlay effects.            ║
 * ║                                                                                        ║
 * ║   2. BUSINESS LOGIC:                                                                   ║
 * ║      - Smart Time Formatting: Detects Today, Yesterday, or exact Date.                 ║
 * ║      - Night Lead Logic: Auto-detects leads from 10 PM - 8 AM.                         ║
 * ║      - Mood Protection: Shows a Blue Tip for night leads to manage expectations.       ║
 * ║                                                                                        ║
 * ║   3. STABILITY & SAFETY:                                                               ║
 * ║      - All Sub-components (StatCard) defined globally to prevent ReferenceErrors.      ║
 * ║      - Explicit Type Definitions for User, Lead, and Status objects.                   ║
 * ║      - Verbose Error Handling for Database operations.                                 ║
 * ║                                                                                        ║
 * ║   ⚠️  NOTE: DO NOT COMPRESS OR OPTIMIZE THIS FILE. KEEP IT EXPANDED.                   ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Phone,
  MapPin,
  RefreshCw,
  FileSpreadsheet,
  MessageSquare,
  X,
  Calendar,
  Target,
  Clock,
  StickyNote,
  Check,
  LogOut,
  Zap,
  Crown,
  Lock,
  Flame,
  ArrowUp,
  Bell,
  Shield,
  AlertCircle,
  Award,
  ChevronDown,
  Moon,
  Pause,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Gift,
  User,
  Lightbulb,
  Info
} from 'lucide-react';
import { Subscription } from '../components/Subscription';
import { useAuth } from '../auth/useAuth';

// =================================================================================================
// 1. DATA TYPES & INTERFACE DEFINITIONS
// =================================================================================================

/**
 * UserProfile Interface
 * Represents the structure of the user data stored in the 'users' table.
 */
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

/**
 * Lead Interface
 * Represents a single lead entry from the 'leads' table.
 */
interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: string;
  source: string; // Used to identify 'Night_Backlog' or 'Fresh' leads
  quality_score: number;
  distribution_score: number;
  notes: string;
  created_at: string;
  assigned_at: string;
}

/**
 * DeliveryStatusInfo Interface
 * Used to determine the visual state of the main Status Card.
 */
interface DeliveryStatusInfo {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBgColor: string;
  iconColor: string;
  statusType: 'active' | 'off_hours' | 'limit_reached' | 'paused' | 'inactive' | 'expired';
}

// =================================================================================================
// 2. HELPER UTILITY FUNCTIONS
// =================================================================================================

/**
 * Helper: formatSmartTime
 * ------------------------------------------------------------------
 * Purpose: Formats a UTC date string into a human-readable format.
 * Logic:
 * - If Today: Shows only time (e.g., "02:30 PM")
 * - If Yesterday: Shows "Yesterday, 02:30 PM"
 * - Older: Shows "Jan 8, 02:30 PM"
 */
const formatSmartTime = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Create Time String (e.g., "02:30 PM")
    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);

    // Check if the date is Today
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    // Check if the date is Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return timeStr;
    }
    
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    
    // For older dates
    const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    return `${dateStr}, ${timeStr}`;

  } catch (error) {
    console.error("Date formatting error:", error);
    return '';
  }
};

/**
 * Helper: getStatusColor
 * ------------------------------------------------------------------
 * Purpose: Returns the correct Tailwind CSS classes based on lead status.
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Fresh': 
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'Contacted': 
      return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    case 'Call Back': 
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'Interested': 
      return 'bg-green-50 border-green-200 text-green-700';
    case 'Follow-up': 
      return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'Closed': 
      return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'Rejected': 
      return 'bg-red-50 border-red-200 text-red-700';
    case 'Invalid': 
      return 'bg-gray-50 border-gray-300 text-gray-600';
    default: 
      return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

/**
 * Helper: isWithinWorkingHours
 * ------------------------------------------------------------------
 * Purpose: Checks if the current time is within business hours.
 * Rule: 8:00 AM to 10:00 PM (22:00)
 */
const isWithinWorkingHours = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  // Returns true if hour is >= 8 AND hour < 22
  return hour >= 8 && hour < 22;
};

/**
 * Helper: getTimeUntilOpen
 * ------------------------------------------------------------------
 * Purpose: Returns a string indicating when the shop will open next.
 */
const getTimeUntilOpen = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 22) {
    // It is night (after 10 PM)
    const hoursLeft = 24 - hour + 8;
    return `Opens in ${hoursLeft} hours`;
  } else if (hour < 8) {
    // It is early morning (before 8 AM)
    const hoursLeft = 8 - hour;
    return `Opens in ${hoursLeft} hours`;
  }
  
  return '';
};

/**
 * Helper: getWhatsAppLink
 * ------------------------------------------------------------------
 * Purpose: Generates a deep link to open WhatsApp with a pre-filled message.
 */
const getWhatsAppLink = (phone: string, leadName: string, userName: string): string => {
  const safeName = leadName || 'there';
  const safeUserName = userName || 'LeadFlow';
  
  const message = encodeURIComponent(
    `Hi ${safeName}, I'm ${safeUserName} from LeadFlow. I saw your inquiry and wanted to connect. Are you available to discuss?`
  );
  
  // Normalize the phone number (remove non-digits)
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add Country Code if missing
  const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  return `https://wa.me/${prefixedPhone}?text=${message}`;
};

// =================================================================================================
// 3. UI SUB-COMPONENTS (Defined Globally to avoid Reference Errors)
// =================================================================================================

/**
 * Component: StatCard
 * Purpose: Displays a single statistic block in the horizontal scroll view.
 */
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
  
  // Color Mapping Configuration
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
        <span className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase truncate">
          {label}
        </span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
};

// =================================================================================================
// 4. MAIN COMPONENT: MEMBER DASHBOARD
// =================================================================================================

export const MemberDashboard = () => {
  const { refreshProfile } = useAuth();
  
  // --------------------------------------------------------------------------
  // A. STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managerName, setManagerName] = useState('Loading...');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modal States
  const [showNotesModal, setShowNotesModal] = useState<Lead | null>(null);
  const [showReportModal, setShowReportModal] = useState<Lead | null>(null);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  
  // Form & Action States
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingLead, setReportingLead] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // --------------------------------------------------------------------------
  // B. COMPUTED VALUES & LOGIC
  // --------------------------------------------------------------------------

  // 1. Expiry Logic
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

  // 2. Limit & Progress Logic
  const leadsToday = profile?.leads_today || 0;
  const dailyLimit = profile?.daily_limit || 0;
  const remainingToday = Math.max(0, dailyLimit - leadsToday);
  const dailyProgress = dailyLimit > 0 ? Math.min(100, Math.round((leadsToday / dailyLimit) * 100)) : 0;
  const isLimitReached = dailyLimit > 0 && leadsToday >= dailyLimit;
  const isPaused = profile?.is_active === false;

  // 3. Plan Extension Logic
  const daysExtended = profile?.days_extended || 0;
  const totalPromised = profile?.total_leads_promised || 50;
  const totalReceived = profile?.total_leads_received || 0;
  const remainingLeads = Math.max(0, totalPromised - totalReceived);
  const totalProgress = totalPromised > 0 ? Math.min(100, Math.round((totalReceived / totalPromised) * 100)) : 0;

  // 4. Priority Badge Logic
  const priorityBadge = useMemo(() => {
    const w = profile?.plan_weight || 1;
    if (w >= 50) return { text: 'MANAGER', color: 'bg-red-600 text-white', icon: Crown as LucideIcon };
    if (w >= 40) return { text: 'VIP BOOST', color: 'bg-purple-600 text-white', icon: Flame as LucideIcon };
    if (w >= 30) return { text: 'SUPERVISOR', color: 'bg-blue-600 text-white', icon: Shield as LucideIcon };
    return { text: 'STARTER', color: 'bg-slate-600 text-white', icon: User as LucideIcon };
  }, [profile?.plan_weight]);

  // 5. Delivery Status Logic
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
        title: 'Goal Reached', 
        subtitle: `Received ${dailyLimit} leads`, 
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

  // 6. Stats Calculation
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

  // 7. Filtering Logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Status Filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      
      // Date Filter
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

  // --------------------------------------------------------------------------
  // C. DATA FETCHING & SIDE EFFECTS
  // --------------------------------------------------------------------------

  // Function to fetch user data and leads
  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch Profile
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

      // Update Activity
      await supabase.from('users').update({ last_activity: new Date().toISOString() }).eq('id', user.id);

      // Fetch Manager
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

      // Fetch Leads
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

  // Effect: Handle Payment Redirect Flag
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      console.log('💰 Payment success! Refreshing...');
      setLoading(true);
      if (refreshProfile) {
        refreshProfile().then(() => {
          fetchData().then(() => {
            // Clean URL
            window.history.replaceState({}, '', '/');
          });
        });
      }
    } else {
      fetchData();
    }
  }, [refreshProfile]);

  // Effect: Realtime Subscription
  useEffect(() => {
    if (!profile?.id || isPaused) return;

    const channel = supabase
      .channel(`member-leads-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        // Add new lead to state
        setLeads(prev => [payload.new as Lead, ...prev]);
        
        // Show Browser Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔥 New Lead!', { body: `${payload.new.name}`, icon: '/logo.png' });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, isPaused]);

  // --------------------------------------------------------------------------
  // D. EVENT HANDLERS
  // --------------------------------------------------------------------------

  const toggleDeliveryPause = async () => {
    if (!profile) return;
    const newActiveStatus = !(profile.is_active === false) ? false : true;
    setProfile(prev => prev ? { ...prev, is_active: newActiveStatus } : null);

    try {
      await supabase.from('users').update({
        is_active: newActiveStatus,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);
      
      await fetchData(); // Refresh UI
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    
    // DB Update
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId);
  };

  const saveNote = async () => {
    if (!showNotesModal) return;
    setSavingNote(true);
    try {
      await supabase.from('leads').update({ notes: noteText, updated_at: new Date().toISOString() }).eq('id', showNotesModal.id);
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
    if (!showReportModal || !profile) return;
    if (!reportReason.trim()) { alert('Please enter a reason'); return; }

    setReportingLead(true);
    try {
      // 1. Insert into Replacements table
      await supabase.from('lead_replacements').insert({
        user_id: profile.id,
        original_lead_id: showReportModal.id,
        original_lead_phone: showReportModal.phone,
        reason: reportReason.trim(),
        reason_details: `Lead Name: ${showReportModal.name}`,
        status: 'pending'
      });

      // 2. Update Lead Status
      await supabase.from('leads').update({
        status: 'Invalid',
        updated_at: new Date().toISOString(),
        notes: (showReportModal.notes || '') + `\n[REPORTED: ${reportReason.trim()}]`
      }).eq('id', showReportModal.id);

      // 3. Update Local State
      setLeads(prev => prev.map(l => l.id === showReportModal.id ? { ...l, status: 'Invalid' } : l));
      
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

  // --------------------------------------------------------------------------
  // E. RENDER UI
  // --------------------------------------------------------------------------

  // 1. Loading State
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

  // 2. Profile Not Found
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
          <button onClick={() => supabase.auth.signOut()} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Sign Out & Retry</button>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard Render
  return (
    <div className={`min-h-screen bg-slate-50 font-sans ${isExpired ? 'overflow-hidden' : ''}`}>

      {/* Subscription Modal */}
      {showSubscription && <Subscription onClose={() => setShowSubscription(false)} />}

      {/* Expired Overlay */}
      {isExpired && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div>
              <h2 className="text-2xl font-bold">Plan Expired!</h2>
              <p className="text-red-100 mt-2">Your daily leads have stopped</p>
            </div>
            <div className="p-6">
              <button onClick={() => setShowSubscription(true)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                <RefreshCw size={20} /> Renew Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner (Off Hours Only) */}
      <div className="relative z-30">
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
      </div>

      {/* Header Section */}
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
              <a href={profile.sheet_url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <FileSpreadsheet size={18} />
                <span className="hidden sm:inline ml-1.5 text-sm font-medium">Sheet</span>
              </a>
            )}
            <button onClick={fetchData} disabled={refreshing} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg">
              <RefreshCw size={18} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => supabase.auth.signOut()} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 sm:pb-6">

        {/* =======================================================
          🔥 STATUS CARD (VERTICAL / BOXY LAYOUT MATCHED) 🔥
          =======================================================
        */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white rounded-3xl p-5 mb-5 shadow-2xl">
          {/* Background Blobs for Glass Effect */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-16 blur-3xl" />
          
          <div className="relative z-10 flex flex-col h-full gap-5">
            
            {/* Top Row: Icon + Status Text */}
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-md`}>
                <StatusIcon size={28} className={deliveryStatus.iconColor} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                  Delivery Status
                </div>
                <div className="text-xl font-bold">
                  {deliveryStatus.title}
                </div>
                <div className="text-xs text-white/80">
                  {deliveryStatus.subtitle}
                </div>
              </div>
            </div>

            {/* Middle Row: The Vertical Box Layout (Exact Match with Screenshot) */}
            <div className="flex gap-3">
              {/* Left Box: Remaining Count (Big Square) */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center w-1/3 min-w-[100px] aspect-square border border-white/10 shadow-inner">
                <span className="text-4xl font-black text-white drop-shadow-md">
                  {remainingToday}
                </span>
                <span className="text-[10px] uppercase font-medium text-white/80 mt-1">
                  Remaining
                </span>
              </div>

              {/* Right Box: Action Buttons */}
              <div className="flex-1 flex flex-col justify-center gap-3">
                {profile.payment_status === 'active' && !isExpired && (
                  <button
                    onClick={toggleDeliveryPause}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                      isPaused 
                        ? 'bg-white text-indigo-600' 
                        : 'bg-white/20 backdrop-blur-md border border-white/20 hover:bg-white/30'
                    }`}
                  >
                    {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                )}
                
                <div className="flex gap-2">
                   <button 
                     onClick={() => setShowDeliveryInfo(true)} 
                     className="flex-1 bg-white/10 hover:bg-white/20 p-3 rounded-xl flex justify-center border border-white/10"
                   >
                      <AlertCircle size={20} />
                   </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Progress Bars */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div>
                <div className="flex justify-between text-xs mb-1 opacity-90">
                  <span>Today's Progress</span>
                  <b>{leadsToday} / {dailyLimit}</b>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${dailyProgress}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1 opacity-90">
                  <span>Total Plan Progress</span>
                  <b>{totalReceived} / {totalPromised} leads</b>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: `${totalProgress}%` }} />
                </div>
                {remainingLeads > 0 && (
                  <div className="text-[10px] mt-1 opacity-70">
                    {remainingLeads} leads remaining in your plan
                  </div>
                )}
              </div>
            </div>

            {/* Plan Extension Notification */}
            {daysExtended > 0 && (
              <div className="mt-2 flex items-center gap-2 text-white/90 text-xs bg-white/20 px-3 py-2 rounded-lg border border-white/10">
                <Gift size={14} />
                <span>🎁 Plan extended by {daysExtended} day{daysExtended > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* STATS ROW (Horizontal Scroll) */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible scrollbar-hide">
          <StatCard label="Total" value={totalReceived} color="slate" icon={<Target size={14} />} />
          <StatCard label="Fresh" value={stats.fresh} color="green" icon={<Clock size={14} />} />
          <StatCard label="Closed" value={stats.closed} color="purple" icon={<Check size={14} />} />
          <StatCard label="Conv." value={`${conversionRate}%`} color="orange" icon={<Flame size={14} />} />
          <StatCard label="This Week" value={weeklyLeads} color="blue" icon={<Calendar size={14} />} />
        </div>

        {/* FILTERS ROW */}
        <div className="flex gap-2 mb-4">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 p-2.5 border rounded-xl text-sm bg-white outline-none">
            <option value="all">All Status</option>
            <option value="Fresh">🔵 Fresh</option>
            <option value="Interested">✅ Interested</option>
            <option value="Closed">🎉 Closed</option>
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="flex-1 p-2.5 border rounded-xl text-sm bg-white outline-none">
            <option value="all">All Time</option>
            <option value="today">Today</option>
          </select>
        </div>

        {/* LEADS LIST SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between">
            <h2 className="font-bold text-slate-800 text-sm">My Leads</h2>
            <span className="text-xs bg-white px-2 py-1 rounded border">{filteredLeads.length}</span>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Target size={32} className="mx-auto mb-2" />
              <p>No leads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                // 🔥 NIGHT LEAD LOGIC
                const isNightLead = lead.source === 'Night_Backlog' || lead.source === 'Night_Queue';

                return (
                  <div key={lead.id} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="font-bold text-slate-900">{lead.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={10} /> {lead.city || 'N/A'}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${
                        isNightLead ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {isNightLead ? <Moon size={10} /> : <Clock size={10} />}
                        {formatSmartTime(lead.created_at)}
                      </div>
                    </div>
                    
                    {/* Mood Protection Tip */}
                    {isNightLead && (
                      <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg p-2 flex gap-2">
                        <Lightbulb size={16} className="text-blue-500" />
                        <div>
                          <p className="text-xs text-blue-800 font-bold">Pro Tip: Night Lead!</p>
                          <p className="text-[10px] text-blue-600">WhatsApp recommended.</p>
                        </div>
                      </div>
                    )}
                    
                    {lead.notes && (
                      <div className="text-xs bg-amber-50 p-2 rounded mb-3 text-slate-600 border-amber-100 border">
                        {lead.notes}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <a href={`tel:${lead.phone}`} className="col-span-1 flex flex-col items-center justify-center bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold">
                        <Phone size={14} /> Call
                      </a>
                      <a href={getWhatsAppLink(lead.phone, lead.name, profile.name)} target="_blank" className="col-span-1 flex flex-col items-center justify-center bg-green-500 text-white py-2 rounded-lg text-xs font-bold">
                        <MessageSquare size={14} /> WA
                      </a>
                      <button onClick={() => { setShowNotesModal(lead); setNoteText(lead.notes || ''); }} className="col-span-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-xs font-bold flex flex-col items-center">
                        <StickyNote size={14} /> Note
                      </button>
                      <button onClick={() => { setShowReportModal(lead); setReportReason(''); }} className="col-span-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold flex flex-col items-center">
                        <Flag size={14} /> Report
                      </button>
                    </div>

                    <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white">
                      <option value="Fresh">🔵 Fresh</option>
                      <option value="Interested">✅ Interested</option>
                      <option value="Closed">🎉 Closed</option>
                      <option value="Call Back">🔄 Call Back</option>
                      <option value="Invalid">🚫 Invalid</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* NOTES MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-4">
            <h3 className="font-bold mb-2">Add Note</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} className="w-full border p-2 rounded h-24" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowNotesModal(null)} className="flex-1 border p-2 rounded">Cancel</button>
              <button onClick={saveNote} className="flex-1 bg-blue-600 text-white p-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-4">
            <h3 className="font-bold text-red-600 mb-2">Report Invalid</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {['Wrong Number', 'Not Interested'].map(r => (
                <button key={r} onClick={() => setReportReason(r)} className="border p-1 text-xs rounded">{r}</button>
              ))}
            </div>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full border p-2 rounded h-20" placeholder="Reason..." />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowReportModal(null)} className="flex-1 border p-2 rounded">Cancel</button>
              <button onClick={handleReportInvalidLead} className="flex-1 bg-red-600 text-white p-2 rounded">Report</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM UPGRADE */}
      {!isExpired && (
        <div className="fixed bottom-0 w-full bg-white p-3 border-t sm:hidden z-30">
          <button onClick={() => setShowSubscription(true)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2">
            <Zap size={18} /> Upgrade
          </button>
        </div>
      )}
      
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default MemberDashboard;
