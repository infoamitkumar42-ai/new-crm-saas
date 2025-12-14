import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Check, Zap, Shield, Crown, Rocket, Flame, Clock, TrendingUp } from 'lucide-react';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // 👇 PAYMENT LOGIC
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
      if (!response.ok) throw new Error(orderData.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "LeadFlow Plans",
        description: `Activation: ${planId}`,
        order_id: orderData.id,
        handler: async () => {
           alert("Payment Successful! Plan activated.");
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

  // 👇 NEW PSYCHOLOGY-BASED PRICING
  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter Plan',
        subtitle: 'TRIAL PACK',
        price: 999,
        duration: 30,
        dailySpeed: 2,
        totalVolume: 60,
        perLeadCost: 16.65, // Anchor Price (High)
        savings: null,
        badge: null,
        features: [
          'Daily Drop: 2 Leads',
          'Valid: 30 Days',
          'Standard Support',
          'Calling Script Included'
        ],
        buttonText: 'Subscribe Now',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Shield
      },
      {
        id: 'supervisor', 
        name: 'Supervisor Plan',
        subtitle: 'MOST POPULAR',
        price: 1999,
        duration: 30,
        dailySpeed: 6, // Increased from 5 to 6 to lower cost
        totalVolume: 180,
        perLeadCost: 11.10, // Massive Drop from 16.65
        savings: 'Save ₹5.5 per lead',
        badge: 'BEST VALUE',
        features: [
          'Daily: 6 Leads (High Volume)',
          'Valid: 30 Days',
          '✅ Priority Replacement',
          'Target: Housewives/Job Seekers'
        ],
        buttonText: 'Subscribe Now',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        borderColor: 'border-blue-500',
        highlight: true,
        icon: Crown
      },
      {
        id: 'manager', 
        name: 'Manager Plan',
        subtitle: 'FOR TEAM LEADERS',
        price: 4999,
        duration: 30,
        dailySpeed: 16, // Increased from 12 to 16
        totalVolume: 480,
        perLeadCost: 10.41, // Lowest Cost (Profit Maximizer)
        savings: 'Lowest Cost Per Lead',
        badge: 'MAX PROFIT',
        features: [
          'Daily: 16 Bulk Leads',
          'Valid: 30 Days',
          '✅ Free Replacement Guarantee',
          'Dedicated Account Manager'
        ],
        buttonText: 'Subscribe Now',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Rocket
      }
    ],
    boost: [
      {
        id: 'fast_start',
        name: 'Fast Start',
        subtitle: 'QUICK TEST',
        price: 999,
        duration: 7,
        dailySpeed: 10,
        totalVolume: 70,
        perLeadCost: 14.27,
        savings: null,
        badge: 'SPEED',
        features: [
          'Daily: 10 Leads',
          'Valid: 7 Days Only',
          '⚡ High Speed Delivery',
          'Instant Activation'
        ],
        buttonText: 'Activate Boost',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-400',
        icon: Zap
      },
      {
        id: 'turbo_weekly',
        name: 'Turbo Weekly',
        subtitle: 'RECRUITMENT DRIVE',
        price: 1999,
        duration: 7,
        dailySpeed: 25, // Increased to make math better
        totalVolume: 175,
        perLeadCost: 11.42, // Great value for weekly
        savings: 'Best Weekly ROI',
        badge: 'BEST ROI',
        features: [
          'Daily: 25 Leads (Aggressive)',
          'Valid: 7 Days Only',
          '🔥 High Intent Filters',
          'Priority Queue Allocation'
        ],
        buttonText: 'Activate Boost',
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
        dailySpeed: 40, // Massive volume
        totalVolume: 280,
        perLeadCost: 10.71, // Almost match Manager price
        savings: 'Maximum Volume',
        badge: 'BEAST MODE',
        features: [
          'Daily: 40 Leads',
          'Valid: 7 Days Only',
          '💣 Exclusive Zone Leads',
          '24/7 Priority Support'
        ],
        buttonText: 'Activate Boost',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-400',
        icon: TrendingUp
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
           <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
             Choose Your Growth Plan
           </h1>
           <p className="text-lg text-slate-500 max-w-2xl mx-auto">
             Stop overpaying for leads. Get <span className="font-bold text-blue-600">higher volume</span> at <span className="font-bold text-green-600">lower cost</span> with our premium plans.
           </p>
        </div>

        {/* Updated Tabs (Renamed as requested) */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-6 md:px-8 py-3.5 rounded-xl font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Clock size={18} /> Monthly (Steady)
            </button>
            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 px-6 md:px-8 py-3.5 rounded-xl font-bold transition-all ${
                activeTab === 'boost'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Zap size={18} /> 7-Day Boost Plan
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-start">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl border-2 ${plan.borderColor} p-6 relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full
                ${plan.highlight 
                   ? `ring-4 ring-opacity-20 shadow-2xl scale-105 z-10 ${activeTab === 'monthly' ? 'ring-blue-500' : 'ring-orange-500'}` 
                   : 'border-slate-100 shadow-sm'
                }
              `}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black text-white shadow-lg tracking-wider uppercase flex items-center gap-1 ${
                    plan.badge === 'BEST VALUE' || plan.badge === 'BEST ROI' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                      : plan.badge === 'SPEED' || plan.badge === 'BEAST MODE'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600'
                      : 'bg-gradient-to-r from-slate-700 to-slate-800'
                  }`}>
                    {plan.highlight && <Crown size={12} className="fill-current" />}
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6 pt-4">
                <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    activeTab === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                }`}>
                    <plan.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{plan.subtitle}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                  <span className="text-slate-500 font-medium">/ {plan.duration} Days</span>
                </div>
              </div>

              {/* Savings Highlight (Psychology Trigger) */}
              <div className="text-center mb-6 h-6">
                {plan.savings && (
                   <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      🎉 {plan.savings}
                   </span>
                )}
              </div>

              {/* Stats Box */}
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600 font-medium">Daily Leads</span>
                  <span className={`text-xl font-extrabold ${activeTab === 'boost' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {plan.dailySpeed} / day
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-medium">Total Volume</span>
                  <span className="text-lg font-bold text-slate-900">~{plan.totalVolume} Leads</span>
                </div>
              </div>

              {/* Per Lead Cost (The Selling Point) */}
              <div className={`border-2 rounded-xl p-3 mb-8 flex justify-between items-center ${
                 plan.perLeadCost < 12 ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-xs font-bold uppercase flex items-center gap-1 ${
                    plan.perLeadCost < 12 ? 'text-green-800' : 'text-slate-500'
                }`}>
                    <Zap size={12} className="fill-current"/> Effective Cost
                </span>
                <span className={`text-xl font-black ${
                    plan.perLeadCost < 12 ? 'text-green-600' : 'text-slate-700'
                }`}>
                    ₹{plan.perLeadCost.toFixed(2)}<span className="text-xs font-normal text-slate-400">/lead</span>
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 group">
                    <div className={`mt-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                       activeTab === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                        <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="font-medium group-hover:text-slate-900 transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                onClick={() => handleSubscribe(plan.id, plan.price)}
                disabled={loading === plan.id}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${plan.buttonColor}`}
              >
                {loading === plan.id ? 'Processing...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Trust */}
        <div className="text-center pb-8 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <span className="flex items-center gap-2"><Shield size={16} className="text-green-600"/> 100% Secure Payment</span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="flex items-center gap-2"><Zap size={16} className="text-blue-600"/> Instant Activation</span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="flex items-center gap-2"><Check size={16} className="text-slate-400"/> GST Invoice</span>
          </p>
        </div>

      </div>
    </div>
  );
};
