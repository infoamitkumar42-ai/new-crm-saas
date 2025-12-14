import React, { useState } from 'react';
import { Check, Zap, Shield, Crown, Rocket, Flame } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // 👇 Payment Logic (Razorpay)
  const handleSubscribe = async (planId: string, amount: number) => {
    setLoading(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please login first");

      // 1. Order Creation
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount, userId: user.id, userEmail: user.email }),
      });
      
      const orderData = await response.json();
      if (!response.ok) throw new Error(orderData.error);

      // 2. Razorpay Popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "LeadFlow",
        description: `Plan: ${planId}`,
        order_id: orderData.id,
        handler: async () => {
           alert("Payment Successful! Your plan is active.");
           window.location.href = '/';
        },
        prefill: { email: user.email },
        theme: { color: activeTab === 'monthly' ? "#2563EB" : "#EA580C" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter Plan',
        subtitle: 'FOR BEGINNERS',
        price: 999,
        duration: 30,
        dailySpeed: 2,
        totalVolume: 60,
        perLeadCost: 16.65,
        badge: null,
        features: ['Daily Drop: 2 Leads', 'Valid: 30 Days', 'Replacement Guarantee', 'Calling Script Included'],
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Shield
      },
      {
        id: 'supervisor',
        name: 'Supervisor Plan',
        subtitle: 'BEST FOR RECRUITERS',
        price: 1999,
        duration: 30,
        dailySpeed: 5,
        totalVolume: 150,
        perLeadCost: 13.32,
        badge: 'STEADY GROWTH',
        features: ['Daily: 5 Leads', 'Valid: 30 Days', 'Priority Replacement', 'Target: Housewives/Job'],
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        borderColor: 'border-blue-500',
        highlight: true,
        icon: Crown
      },
      {
        id: 'manager',
        name: 'Manager Plan',
        subtitle: 'FOR LEADERS',
        price: 4999,
        duration: 30,
        dailySpeed: 12,
        totalVolume: 360,
        perLeadCost: 13.88,
        badge: null,
        features: ['Daily: 12 Bulk Leads', 'Valid: 30 Days', 'Team Distribution', 'Dedicated Support'],
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Rocket
      }
    ],
    boost: [
      {
        id: 'fast_start',
        name: 'Fast Start',
        subtitle: 'MORE LEADS THAN MONTHLY',
        price: 999,
        duration: 7,
        dailySpeed: 10,
        totalVolume: 70,
        perLeadCost: 14.27,
        badge: 'SPEED',
        features: ['Daily: 10 Leads', 'Valid: 7 Days Only', 'High Speed Delivery', 'Burn Budget Fast'],
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-400',
        icon: Zap
      },
      {
        id: 'turbo_weekly',
        name: 'Turbo Weekly',
        subtitle: 'INSTANT PIPELINE FILL',
        price: 1999,
        duration: 7,
        dailySpeed: 20,
        totalVolume: 140,
        perLeadCost: 14.27,
        badge: 'BEST ROI',
        features: ['Daily: 20 Leads', 'Valid: 7 Days Only', 'Aggressive Growth', 'High Intent Data'],
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-500',
        highlight: true,
        icon: Flame
      },
      {
        id: 'max_blast',
        name: 'Max Blast',
        subtitle: 'NUCLEAR MODE',
        price: 2999,
        duration: 7,
        dailySpeed: 30,
        totalVolume: 210,
        perLeadCost: 14.28,
        badge: 'BEAST',
        features: ['Daily: 30 Leads', 'Valid: 7 Days Only', 'Maximum Blast', 'Priority Support'],
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-400',
        icon: Rocket
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
           <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Choose Your Plan</h1>
           <p className="text-slate-500">Select a monthly subscription or a 7-day speed booster.</p>
        </div>

        {/* Strategy Tabs */}
        <div className="flex justify-center mb-10 gap-4">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm ${
              activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow-blue-200 scale-105 ring-2 ring-blue-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            📅 Monthly (Steady)
          </button>
          <button
            onClick={() => setActiveTab('boost')}
            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm ${
              activeTab === 'boost'
                ? 'bg-orange-600 text-white shadow-orange-200 scale-105 ring-2 ring-orange-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            🚀 Boost Packs (Fast)
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 ${plan.borderColor} p-6 relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col
                ${plan.highlight ? 'ring-4 ring-opacity-20 ' + (activeTab === 'monthly' ? 'ring-blue-500' : 'ring-orange-500') : ''}
              `}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black text-white shadow-md tracking-wider ${
                    plan.badge === 'STEADY GROWTH' || plan.badge === 'BEST ROI' 
                      ? 'bg-blue-600' 
                      : plan.badge === 'SPEED' || plan.badge === 'BEAST'
                      ? 'bg-orange-600'
                      : 'bg-slate-700'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6 pt-2">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    activeTab === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                }`}>
                    <plan.icon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{plan.subtitle}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                  <span className="text-slate-500 font-medium text-sm">/ {plan.duration} Days</span>
                </div>
              </div>

              {/* Key Stats (Speed & Volume) */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600 font-medium">Daily Speed:</span>
                  <span className={`text-lg font-bold ${activeTab === 'boost' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {plan.dailySpeed} Leads/day
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-medium">Total Volume:</span>
                  <span className="text-lg font-bold text-slate-900">~{plan.totalVolume} Leads</span>
                </div>
              </div>

              {/* Per Lead Cost (Psychology Anchor) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                    <Zap size={14} className="fill-current"/> Per Lead Cost
                </span>
                <span className="text-xl font-black text-emerald-600">₹{plan.perLeadCost.toFixed(2)}</span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-0.5 min-w-[16px]">
                        <Check size={16} className={activeTab === 'monthly' ? 'text-blue-600' : 'text-orange-600'} strokeWidth={3} />
                    </div>
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                onClick={() => handleSubscribe(plan.id, plan.price)}
                disabled={loading === plan.id}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 ${plan.buttonColor}`}
              >
                {loading === plan.id ? 'Processing...' : plan.id.includes('weekly') || plan.id.includes('blast') ? 'Activate Boost ⚡' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Trust */}
        <div className="text-center pb-8">
          <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
            <span>🔒</span> 100% Secure Payment via Razorpay. Invalid numbers replaced automatically.
          </p>
        </div>

      </div>
    </div>
  );
};
