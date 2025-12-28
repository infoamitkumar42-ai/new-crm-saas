import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Check, Zap, Shield, Crown, Rocket, Flame, Clock, TrendingUp, 
  Gift, ArrowRight, Star, Timer, Award, BarChart3, Target
} from 'lucide-react';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, amount: number) => {
    setLoading(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please login first to subscribe.");

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount, userId: user.id, userEmail: user.email }),
      });

      const orderData = await response.json();
      if (!response.ok) throw new Error(orderData.error || "Order creation failed");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "LeadFlow Plans",
        description: `Activation: ${planId}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          alert("🎉 Payment Successful! Plan activated.");
          window.location.href = '/';
        },
        prefill: { email: user.email },
        theme: { color: activeTab === 'monthly' ? "#2563EB" : "#EA580C" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter',
        subtitle: 'FOR BEGINNERS',
        price: 999,
        originalPrice: 1299,
        duration: 30,
        dailySpeed: 2,
        totalVolume: 60,
        perLeadCost: 16.65,
        weight: 1,
        priority: 'Standard',
        priorityColor: 'bg-slate-500',
        queuePosition: '~15-20',
        expectedLeadsPerHour: 0.25,
        badge: null,
        features: [
          '2 Fresh Leads/Day',
          'Personal Dashboard',
          'WhatsApp Alerts',
          'Email Support',
          'Standard Queue Priority'
        ],
        buttonText: 'Start Now',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Shield,
        highlight: false
      },
      {
        id: 'supervisor', 
        name: 'Supervisor',
        subtitle: 'MOST POPULAR',
        price: 1999,
        originalPrice: 2499,
        duration: 30,
        dailySpeed: 6,
        totalVolume: 180,
        perLeadCost: 11.10,
        weight: 3,
        priority: 'High',
        priorityColor: 'bg-blue-500',
        queuePosition: '~5-10',
        expectedLeadsPerHour: 0.75,
        badge: '⭐ BEST VALUE',
        features: [
          '6 Fresh Leads/Day',
          'Priority Support',
          'Lead Replacement Guarantee',
          'Performance Analytics',
          'WhatsApp + Call Alerts',
          '3× Higher Priority'
        ],
        buttonText: 'Get Best Value',
        buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        borderColor: 'border-blue-500',
        highlight: true,
        icon: Crown
      },
      {
        id: 'manager', 
        name: 'Manager',
        subtitle: 'FOR TEAM LEADERS',
        price: 4999,
        originalPrice: 5999,
        duration: 30,
        dailySpeed: 16,
        totalVolume: 480,
        perLeadCost: 10.41,
        weight: 5,
        priority: 'Highest',
        priorityColor: 'bg-orange-500',
        queuePosition: '~1-5',
        expectedLeadsPerHour: 2,
        badge: 'MAX VOLUME',
        features: [
          '16 Fresh Leads/Day',
          'Team Dashboard (5 members)',
          'Auto Lead Assignment',
          'Dedicated Account Manager',
          'Priority Replacement',
          '5× Highest Priority'
        ],
        buttonText: 'Go Premium',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Rocket,
        highlight: false
      }
    ],
    boost: [
      {
        id: 'fast_start',
        name: 'Fast Start',
        subtitle: '7-DAY TRIAL',
        price: 499,
        originalPrice: 699,
        duration: 7,
        dailySpeed: 5,
        totalVolume: 35,
        perLeadCost: 14.25,
        weight: 8,
        priority: 'Turbo',
        priorityColor: 'bg-orange-500',
        queuePosition: '~1-3',
        expectedLeadsPerHour: 1.5,
        badge: 'TRY FIRST',
        features: [
          '5 Leads/Day for 7 Days',
          'Test the System',
          'Full Dashboard Access',
          'Upgrade Anytime',
          '8× Priority Weight'
        ],
        buttonText: 'Try Now - ₹499',
        buttonColor: 'bg-orange-500 hover:bg-orange-600',
        borderColor: 'border-orange-300',
        icon: Zap,
        highlight: false
      },
      {
        id: 'turbo_weekly',
        name: 'Turbo Week',
        subtitle: 'HIGH VOLUME',
        price: 1499,
        originalPrice: 1999,
        duration: 7,
        dailySpeed: 20,
        totalVolume: 140,
        perLeadCost: 10.70,
        weight: 10,
        priority: 'Ultra',
        priorityColor: 'bg-red-500',
        queuePosition: '#1',
        expectedLeadsPerHour: 3,
        badge: '🔥 POPULAR',
        features: [
          '20 Leads/Day for 7 Days',
          'High Intent Leads',
          'Priority Queue',
          'Perfect for Campaigns',
          '10× Ultra Priority'
        ],
        buttonText: 'Boost Now',
        buttonColor: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
        borderColor: 'border-orange-500',
        highlight: true,
        icon: Flame
      },
      {
        id: 'max_blast',
        name: 'Max Blast',
        subtitle: 'MAXIMUM LEADS',
        price: 2499,
        originalPrice: 2999,
        duration: 7,
        dailySpeed: 35,
        totalVolume: 245,
        perLeadCost: 10.20,
        weight: 12,
        priority: 'Maximum',
        priorityColor: 'bg-purple-600',
        queuePosition: '#1 Always',
        expectedLeadsPerHour: 5,
        badge: 'BEAST MODE',
        features: [
          '35 Leads/Day for 7 Days',
          'Exclusive Territory',
          '24/7 Priority Support',
          'Recruitment Drives',
          '12× Maximum Priority'
        ],
        buttonText: 'Go Beast Mode',
        buttonColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
        borderColor: 'border-purple-400',
        icon: TrendingUp,
        highlight: false
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* 🎁 Top Offer Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 mb-8 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Gift size={20} className="animate-bounce" />
            <span className="font-bold">First-Time Buyer Bonus:</span>
            <span>Get <strong>5 EXTRA Leads FREE</strong> with any plan!</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold ml-2">Auto-Applied ✓</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Choose Your Lead Plan
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Fresh leads daily. <span className="text-green-600 font-bold">₹10-17 per lead</span>. 
            Higher plan = <span className="text-blue-600 font-bold">Faster delivery</span>.
          </p>
        </div>

        {/* Priority Explainer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">🚀 How Priority Works</h3>
              <p className="text-sm text-blue-700 mt-1">
                Each plan has a <strong>Weight</strong> (1-12). Higher weight = Higher score = You get leads first!
                Booster plans have maximum priority for fastest delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Clock size={18} /> Monthly Plans
            </button>
            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'boost'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Zap size={18} /> 7-Day Boost
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-stretch">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl border-2 ${plan.borderColor} p-6 relative transition-all duration-300 hover:shadow-xl flex flex-col
                ${plan.highlight 
                   ? `ring-4 ring-opacity-30 shadow-2xl md:scale-105 z-10 ${activeTab === 'monthly' ? 'ring-blue-400' : 'ring-orange-400'}` 
                   : 'shadow-sm'
                }
              `}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black text-white shadow-lg whitespace-nowrap ${
                    plan.highlight 
                      ? activeTab === 'monthly' 
                        
