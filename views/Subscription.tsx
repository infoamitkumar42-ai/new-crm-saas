import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Check, Zap, Shield, Crown, Rocket, Flame, Clock } from 'lucide-react';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // 👇 PAYMENT LOGIC (Standard Razorpay)
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
        description: `Plan: ${planId}`,
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

  // 👇 CLAUDE'S PSYCHOLOGY-BASED DATA
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
        features: [
          'Daily Drop: 2 Leads',
          'Valid: 30 Days',
          '✅ Replacement Guarantee',
          'Calling Script Included'
        ],
        buttonText: 'Subscribe Now',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Shield
      },
      {
        id: 'supervisor', // ⭐ SWEET SPOT
        name: 'Supervisor Plan',
        subtitle: 'BEST FOR RECRUITERS',
        price: 1999,
        duration: 30,
        dailySpeed: 5,
        totalVolume: 150,
        perLeadCost: 13.32, // Lowest Cost
        badge: 'STEADY GROWTH',
        features: [
          'Daily: 5 Leads',
          'Valid: 30 Days',
          '✅ Priority Replacement',
          'Target: Housewives/Job'
        ],
        buttonText: 'Subscribe Now',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        borderColor: 'border-blue-500',
        highlight: true, // Visually Popped
        icon: Crown
      },
      {
        id: 'manager', // DECOY
        name: 'Manager Plan',
        subtitle: 'FOR LEADERS',
        price: 4999,
        duration: 30,
        dailySpeed: 12,
        totalVolume: 360,
        perLeadCost: 13.88,
        badge: null,
        features: [
          'Daily: 12 Bulk Leads',
          'Valid: 30 Days',
          '✅ Team Distribution',
          'Dedicated Support'
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
        subtitle: 'MORE LEADS THAN MONTHLY',
        price: 999,
        duration: 7,
        dailySpeed: 10,
        totalVolume: 70,
        perLeadCost: 14.27,
        badge: 'SPEED',
        features: [
          'Daily: 10 Leads',
          'Valid: 7 Days Only',
          '⚡ High Speed Delivery',
          'Burn Budget Fast'
        ],
        buttonText: 'Activate Boost',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-400',
        icon: Zap
      },
      {
        id: 'turbo_weekly', // ⭐ BEST ROI
        name: 'Turbo Weekly',
        subtitle: 'INSTANT PIPELINE FILL',
        price: 1999,
        duration: 7,
        dailySpeed: 20,
        totalVolume: 140,
        perLeadCost: 14.27,
        badge: 'BEST ROI',
        features: [
          'Daily: 20 Leads',
          'Valid: 7 Days Only',
          '🔥 Aggressive Growth',
          'High Intent Data'
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
        dailySpeed: 30,
        totalVolume: 210,
        perLeadCost: 14.28,
        badge: 'BEAST',
        features: [
          'Daily: 30 Leads',
          'Valid: 7 Days Only',
          '💣 Maximum Blast',
          'Priority Support'
        ],
        buttonText: 'Activate Boost',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
        borderColor: 'border-orange-400',
        icon: Rocket
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
             Choose Your Growth Speed
           </h1>
           <p className="text-lg text-slate-500">
             Select a <span className="font-bold text-blue-600">Monthly Plan</span> for consistency or a <span className="font-bold text-orange-600">Boost Pack</span> for instant results.
           </p>
        </div>

        {/* Strategy Tabs (Toggle) */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Clock size={18} /> Monthly (Steady)
            </button>
            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all ${
                activeTab === 'boost'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Zap size={18} /> Boost Packs (Fast)
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
                    plan.badge === 'STEADY GROWTH' || plan.badge === 'BEST ROI' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                      : plan.badge === 'SPEED' || plan.badge === 'BEAST'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600'
                      : 'bg-slate-700'
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
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                  <span className="text-slate-500 font-medium">/ {plan.duration} Days</span>
                </div>
              </div>

              {/* Stats Box */}
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600 font-medium">Daily Speed</span>
                  <span className={`text-lg font-extrabold ${activeTab === 'boost' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {plan.dailySpeed} Leads
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-medium">Total Volume</span>
                  <span className="text-lg font-bold text-slate-900">~{plan.totalVolume} Leads</span>
                </div>
              </div>

              {/* Per Lead Cost (Psychology) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-8 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <Zap size={12} className="fill-current"/> Cost Per Lead
                </span>
                <span className="text-xl font-black text-emerald-600">₹{plan.perLeadCost.toFixed(2)}</span>
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
