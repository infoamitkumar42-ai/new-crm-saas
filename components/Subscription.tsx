/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - Subscription.tsx v5.0 (FINAL PRODUCTION)      ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: STABLE - CONNECTED TO BACKEND                     ║
 * ║                                                            ║
 * ║  Features:                                                 ║
 * ║  - ✅ Calls /api/create-order (Secure & Auto-Capture)      ║
 * ║  - ✅ 5-Second Wait Logic (Fixes Inactive Plan Issue)      ║
 * ║  - ✅ Auto-Refresh after Payment                           ║
 * ║                                                            ║
 * ║  ⚠️  DO NOT REMOVE THE FETCH CALL TO /api/create-order     ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Check, Zap, Shield, Crown, Rocket, Flame, Clock,
  Gift, ArrowRight, Star, X, ChevronLeft, TrendingUp,
  Phone, MessageCircle, RefreshCw, Sparkles, Users,
  ChevronDown, ChevronUp, BadgeCheck, Timer, Target
} from 'lucide-react';

interface SubscriptionProps {
  onClose?: () => void;
  user?: any;
  onPaymentSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Subscription: React.FC<SubscriptionProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINAL PLAN CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter',
        subtitle: 'Perfect to Begin',
        price: 999,
        originalPrice: 1499,
        duration: 10,
        dailyLeads: 5,
        totalLeads: 50,
        perDay: 99.9,
        weight: 1,
        priority: 'Standard',
        priorityColor: 'bg-slate-500',
        replacementLimit: 5,
        icon: Shield,
        highlight: false,
        badge: null,
        gradient: 'from-slate-600 to-slate-800',
        lightGradient: 'from-slate-50 via-white to-slate-100',
        borderColor: 'border-slate-200',
        accentColor: 'text-slate-600',
        features: [
          { text: '5 Fresh Leads Daily', icon: Target, highlight: true },
          { text: '100% Verified Numbers', icon: BadgeCheck, highlight: true },
          { text: 'Real-time WhatsApp Alerts', icon: MessageCircle, highlight: false },
          { text: 'Personal Dashboard', icon: Users, highlight: false },
          { text: 'Email Support', icon: MessageCircle, highlight: false },
          { text: '5 Invalid Lead Replacements', icon: RefreshCw, highlight: true },
        ],
        comparison: [
          { label: 'Queue Position', value: '15-20', icon: Timer },
          { label: 'Response Time', value: '< 2 hrs', icon: Clock },
        ]
      },
      {
        id: 'supervisor',
        name: 'Supervisor',
        subtitle: 'Most Popular Choice',
        price: 1999,
        originalPrice: 2999,
        duration: 15,
        dailyLeads: 7,
        totalLeads: 105,
        perDay: 133,
        weight: 3,
        priority: 'High',
        priorityColor: 'bg-blue-500',
        replacementLimit: 10,
        icon: Crown,
        highlight: true,
        badge: '⭐ BEST VALUE',
        gradient: 'from-blue-600 to-indigo-700',
        lightGradient: 'from-blue-50 via-white to-indigo-50',
        borderColor: 'border-blue-400',
        accentColor: 'text-blue-600',
        features: [
          { text: '7 Fresh Leads Daily', icon: Target, highlight: true },
          { text: '100% Exclusive Leads', icon: Sparkles, highlight: true },
          { text: 'Priority Queue (3x Faster)', icon: Zap, highlight: true },
          { text: 'WhatsApp + Call Alerts', icon: Phone, highlight: false },
          { text: 'Performance Analytics', icon: TrendingUp, highlight: false },
          { text: 'Priority Support', icon: MessageCircle, highlight: false },
          { text: '10 Invalid Lead Replacements', icon: RefreshCw, highlight: true },
        ],
        comparison: [
          { label: 'Queue Position', value: '5-10', icon: Timer },
          { label: 'Response Time', value: '< 30 min', icon: Clock },
        ]
      },
      {
        id: 'manager',
        name: 'Manager',
        subtitle: 'For Serious Closers',
        price: 2999,
        originalPrice: 4499,
        duration: 20,
        dailyLeads: 8,
        totalLeads: 160,
        perDay: 150,
        weight: 5,
        priority: 'Premium',
        priorityColor: 'bg-purple-500',
        replacementLimit: 16,
        icon: Rocket,
        highlight: false,
        badge: '👑 PRO',
        gradient: 'from-purple-600 to-indigo-700',
        lightGradient: 'from-purple-50 via-white to-indigo-50',
        borderColor: 'border-purple-300',
        accentColor: 'text-purple-600',
        features: [
          { text: '8 Fresh Leads Daily', icon: Target, highlight: true },
          { text: 'Highest Priority Queue (5x)', icon: Zap, highlight: true },
          { text: 'Exclusive Territory Option', icon: Sparkles, highlight: true },
          { text: 'Dedicated Account Manager', icon: Users, highlight: true },
          { text: 'Advanced Analytics Dashboard', icon: TrendingUp, highlight: false },
          { text: 'Team Access (Upto 3)', icon: Users, highlight: false },
          { text: '16 Invalid Lead Replacements', icon: RefreshCw, highlight: true },
          { text: 'Monthly Strategy Call', icon: Phone, highlight: false },
        ],
        comparison: [
          { label: 'Queue Position', value: '#1-5', icon: Timer },
          { label: 'Response Time', value: 'Instant', icon: Clock },
        ]
      }
    ],
    boost: [
      {
        id: 'weekly_boost',
        name: 'Weekly Boost',
        subtitle: '7-Day Power Pack',
        price: 1999,
        originalPrice: 2499,
        duration: 7,
        dailyLeads: 12,
        totalLeads: 84,
        perDay: 285,
        weight: 7,
        priority: 'Turbo',
        priorityColor: 'bg-orange-500',
        replacementLimit: 8,
        icon: Zap,
        highlight: false,
        badge: '🚀 FAST',
        gradient: 'from-orange-500 to-amber-600',
        lightGradient: 'from-orange-50 via-white to-amber-50',
        borderColor: 'border-orange-300',
        accentColor: 'text-orange-600',
        features: [
          { text: '12 Leads Every Day', icon: Target, highlight: true },
          { text: 'Turbo Priority (7x)', icon: Zap, highlight: true },
          { text: 'Perfect for Campaigns', icon: Sparkles, highlight: false },
          { text: 'Real-time Delivery', icon: Clock, highlight: false },
          { text: 'Full Dashboard Access', icon: TrendingUp, highlight: false },
          { text: '8 Invalid Lead Replacements', icon: RefreshCw, highlight: true },
        ],
        comparison: [
          { label: 'Queue Position', value: '#1-3', icon: Timer },
          { label: 'Daily Volume', value: 'High', icon: TrendingUp },
        ]
      },
      {
        id: 'turbo_boost',
        name: 'Turbo Boost',
        subtitle: 'Maximum Volume',
        price: 2499,
        originalPrice: 3499,
        duration: 7,
        dailyLeads: 14,
        totalLeads: 98,
        perDay: 357,
        weight: 9,
        priority: 'Ultra',
        priorityColor: 'bg-red-500',
        replacementLimit: 10,
        icon: Flame,
        highlight: true,
        badge: '🔥 POPULAR',
        gradient: 'from-red-500 to-orange-600',
        lightGradient: 'from-red-50 via-white to-orange-50',
        borderColor: 'border-red-400',
        accentColor: 'text-red-600',
        features: [
          { text: '14 Leads Every Day', icon: Target, highlight: true },
          { text: 'Ultra Priority - Always #1', icon: Zap, highlight: true },
          { text: 'Best for Recruitments', icon: Users, highlight: true },
          { text: 'Instant Notifications', icon: MessageCircle, highlight: false },
          { text: 'Premium Support 24/7', icon: Phone, highlight: false },
          { text: 'Guaranteed Delivery', icon: BadgeCheck, highlight: true },
          { text: '10 Invalid Lead Replacements', icon: RefreshCw, highlight: true },
        ],
        comparison: [
          { label: 'Queue Position', value: 'Always #1', icon: Timer },
          { label: 'Daily Volume', value: 'Maximum', icon: TrendingUp },
        ]
      }
    ]
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAYMENT HANDLER (SECURE API CALL)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleSubscribe = async (plan: typeof plans.monthly[0]) => {
    setLoading(plan.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first to subscribe.");
        setLoading(null);
        return;
      }

      // 🔥 STEP 1: CREATE ORDER VIA BACKEND API
      // This protects your Secret Key & Ensures Auto-Capture
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          price: plan.price,
          userId: user.id
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // 🔥 STEP 2: OPEN RAZORPAY WITH BACKEND ORDER ID
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use Public Key for Frontend
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LeadFlow CRM",
        description: `${plan.name} Plan`,
        order_id: orderData.id, // ✅ Critical: Connects to Backend Order
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email,
          contact: user.user_metadata?.phone || ''
        },
        notes: {
          user_id: user.id,
          plan_name: plan.id
        },
        theme: {
          color: activeTab === 'monthly' ? "#2563EB" : "#EA580C"
        },
        handler: async function (response: any) {
          console.log('✅ Payment Success:', response);

          // Show Feedback with plan activation info
          alert("🎉 Payment Successful!\\n\\n⏰ Aapka plan 30 MINUTE mein active hoga.\\nLeads milna shuru ho jayengi!\\n\\nPlease wait while we setup your account...");
          setLoading(plan.id);

          // Wait 5 seconds for Webhook to process
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Force Refresh Dashboard
          window.location.href = `/?payment_success=true&t=${Date.now()}`;
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error('❌ Payment Failed:', response.error);
        alert(`Payment Failed: ${response.error.description}`);
        setLoading(null);
      });

      rzp.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      alert("Error: " + (error.message || "Something went wrong"));
      setLoading(null);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.back();
    }
  };

  const toggleExpand = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const currentPlans = plans[activeTab];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 overflow-hidden">
      <div className="h-full w-full overflow-y-auto">

        {/* ━━━ Floating Particles Background ━━━ */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* ━━━ Header ━━━ */}
        <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-1 text-white/70 hover:text-white font-medium text-sm p-2 -ml-2 rounded-lg hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-400" />
            Premium Plans
          </h1>

          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-5 pb-32 relative z-10">

          {/* ━━━ Welcome Offer Banner ━━━ */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 mb-6 shadow-2xl shadow-emerald-500/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="relative flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Gift size={24} className="text-white animate-bounce" />
                <span className="font-bold text-white text-lg">Welcome Bonus!</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <span className="text-white font-black text-sm">🎁 5 EXTRA Leads FREE</span>
              </div>
            </div>
          </div>

          {/* ━━━ Header Text ━━━ */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-white mb-2">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Growth Plan</span>
            </h2>
            <p className="text-white/60 text-sm">
              Fresh leads daily • 100% Exclusive • Real-time delivery
            </p>
          </div>

          {/* ━━━ Tab Switcher ━━━ */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20 inline-flex w-full max-w-sm">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'monthly'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Clock size={18} />
                Monthly Plans
              </button>
              <button
                onClick={() => setActiveTab('boost')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'boost'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Zap size={18} />
                7-Day Boost
              </button>
            </div>
          </div>

          {/* ━━━ Plan Cards ━━━ */}
          <div className="space-y-5">
            {currentPlans.map((plan) => {
              const PlanIcon = plan.icon;
              const isExpanded = expandedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${plan.highlight
                    ? 'ring-2 ring-offset-2 ring-offset-slate-900 ' + (activeTab === 'monthly' ? 'ring-blue-400' : 'ring-orange-400')
                    : ''
                    }`}
                >
                  {/* Card Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.lightGradient} opacity-95`}></div>

                  {/* Highlight Glow */}
                  {plan.highlight && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-5`}></div>
                  )}

                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-0 -right-0 z-10">
                      <div className={`bg-gradient-to-r ${plan.gradient} text-white text-xs font-black px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl shadow-lg`}>
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <div className="relative p-5">
                    {/* Top Section: Icon + Name + Price */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg ${plan.highlight ? 'shadow-xl' : ''}`}>
                        <PlanIcon size={32} className="text-white" />
                      </div>

                      {/* Name & Subtitle */}
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                        <p className="text-sm text-slate-500">{plan.subtitle}</p>

                        {/* Priority Badge */}
                        <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${plan.priorityColor} text-white text-xs font-bold`}>
                          <Zap size={12} />
                          {plan.priority} Priority
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-sm text-slate-400 line-through">₹{plan.originalPrice}</div>
                        <div className="text-3xl font-black text-slate-900">₹{plan.price}</div>
                        <div className="text-xs text-slate-500">{plan.duration} days</div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-slate-200/50">
                        <div className={`text-2xl font-black ${plan.accentColor}`}>{plan.dailyLeads}</div>
                        <div className="text-[10px] text-slate-500 font-medium">LEADS/DAY</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-slate-200/50">
                        <div className="text-2xl font-black text-green-600">₹{Math.round(plan.perDay)}</div>
                        <div className="text-[10px] text-slate-500 font-medium">PER DAY</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-slate-200/50">
                        <div className="text-2xl font-black text-slate-700">{plan.totalLeads}</div>
                        <div className="text-[10px] text-slate-500 font-medium">TOTAL LEADS</div>
                      </div>
                    </div>

                    {/* Replacement Guarantee Box */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <RefreshCw size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-amber-800">Invalid Lead Replacement</p>
                          <p className="text-xs text-amber-600">Upto <span className="font-black text-amber-800">{plan.replacementLimit} leads</span> replaced if invalid</p>
                        </div>
                        <div className="bg-amber-500 text-white text-xs font-black px-3 py-1.5 rounded-lg">
                          {plan.replacementLimit} MAX
                        </div>
                      </div>
                    </div>

                    {/* Quick Features (Always Visible) */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plan.features.filter(f => f.highlight).slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/50">
                          <Check size={14} className="text-green-500" />
                          <span className="text-xs font-medium text-slate-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleExpand(plan.id)}
                      className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show Less</span>
                          <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          <span>View All {plan.features.length} Features</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>

                    {/* Expanded Features */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">All Features Included:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {plan.features.map((feature, idx) => {
                            const FeatureIcon = feature.icon;
                            return (
                              <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl ${feature.highlight ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.highlight ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                  <FeatureIcon size={16} />
                                </div>
                                <span className={`text-sm ${feature.highlight ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                  {feature.text}
                                </span>
                                {feature.highlight && (
                                  <Star size={14} className="text-amber-500 ml-auto" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Comparison Stats */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {plan.comparison.map((item, idx) => {
                            const CompIcon = item.icon;
                            return (
                              <div key={idx} className="bg-slate-100 rounded-xl p-3 text-center">
                                <CompIcon size={18} className="mx-auto text-slate-500 mb-1" />
                                <div className={`text-lg font-black ${plan.accentColor}`}>{item.value}</div>
                                <div className="text-[10px] text-slate-500">{item.label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading === plan.id}
                      className={`w-full mt-4 py-4 rounded-2xl font-bold text-white text-base transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 bg-gradient-to-r ${plan.gradient} hover:opacity-90`}
                    >
                      {loading === plan.id ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <>
                          Get {plan.name} Plan
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ━━━ Why Choose Us Section ━━━ */}
          <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-yellow-400" />
              Why 500+ Trust LeadFlow
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BadgeCheck, title: '100% Exclusive', desc: 'Only YOU get this lead', color: 'text-green-400' },
                { icon: Phone, title: 'Verified Numbers', desc: '95%+ valid contacts', color: 'text-blue-400' },
                { icon: Zap, title: 'Real-time Delivery', desc: 'Leads in < 5 minutes', color: 'text-yellow-400' },
                { icon: RefreshCw, title: 'Replacement', desc: 'Invalid? We replace!', color: 'text-orange-400' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <item.icon size={24} className={item.color} />
                  <p className="text-sm font-bold text-white mt-2">{item.title}</p>
                  <p className="text-xs text-white/50">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ━━━ Testimonial ━━━ */}
          <div className="mt-6 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl rounded-2xl p-4 border border-blue-400/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-400 shadow-lg flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
                  alt="Rahul Kumar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-2xl">👨‍💼</div>';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-white italic">"15 din mein 4 joining ki. LeadFlow is a game changer!"</p>
                <p className="text-xs text-white/50 mt-1">— Rahul Kumar, Ludhiana</p>
              </div>
            </div>
          </div>

          {/* ━━━ Trust Stats ━━━ */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { value: '10,000+', label: 'Leads Delivered' },
              { value: '500+', label: 'Happy Users' },
              { value: '4.8★', label: 'Avg Rating' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                <div className="text-xl font-black text-white">{stat.value}</div>
                <div className="text-[10px] text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ━━━ Security Badge ━━━ */}
          <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-xs">
            <Shield size={14} />
            <span>Secure Payment via Razorpay • 256-bit SSL Encryption</span>
          </div>

        </div>

        {/* ━━━ Bottom Bar (Mobile) - CLEAN VERSION ━━━ */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 z-30">
          <div className="flex items-center justify-center">
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              Maybe Later
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Subscription;
