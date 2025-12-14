import React, { useState } from 'react';
import { Check, Zap, Shield, Crown, Clock, Flame, Rocket, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // 👇 PAYMENT HANDLER (Razorpay Integration)
  const handleSubscribe = async (planId: string, amount: number) => {
    setLoading(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please login first");

      // 1. Create Order on Backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          amount, 
          userId: user.id,
          userEmail: user.email 
        }),
      });

      const orderData = await response.json();
      if (!response.ok) throw new Error(orderData.error);

      // 2. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "LeadFlow SaaS",
        description: `Subscription for ${planId}`,
        order_id: orderData.id,
        handler: async (response: any) => {
           // Payment Success Logic Here (Webhook handles actual activation)
           alert("Payment Successful! Plan will be active shortly.");
           window.location.href = '/';
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: activeTab === 'monthly' ? "#2563EB" : "#EA580C",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();

    } catch (error: any) {
      alert("Payment Error: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter',
        subtitle: 'Validation',
        price: 999,
        duration: 30,
        dailySpeed: 2,
        totalVolume: 60,
        perLeadCost: 16.65,
        badge: null,
        icon: Shield,
        features: ['2 Leads Daily', '30 Days Validity', 'Standard Support', 'Basic Script'],
        color: 'slate'
      },
      {
        id: 'supervisor',
        name: 'Supervisor',
        subtitle: 'Most Popular',
        price: 1999,
        duration: 30,
        dailySpeed: 5,
        totalVolume: 150,
        perLeadCost: 13.32,
        badge: 'BEST VALUE',
        icon: Crown,
        features: ['5 Leads Daily', '30 Days Validity', 'Priority Replacement', 'Hiring Guidance'],
        color: 'blue',
        popular: true
      },
      {
        id: 'manager',
        name: 'Manager',
        subtitle: 'Scaling Up',
        price: 4999,
        duration: 30,
        dailySpeed: 12,
        totalVolume: 360,
        perLeadCost: 13.88,
        badge: 'FOR TEAMS',
        icon: Rocket,
        features: ['12 Leads Daily', '30 Days Validity', 'Team Dashboard', 'Dedicated Manager'],
        color: 'indigo'
      }
    ],
    boost: [
      {
        id: 'fast_start',
        name: 'Fast Start',
        subtitle: 'Quick Test',
        price: 999,
        duration: 7,
        dailySpeed: 10,
        totalVolume: 70,
        perLeadCost: 14.27,
        badge: 'SPEED',
        icon: Zap,
        features: ['10 Leads Daily', '7 Days Only', 'Instant Delivery', 'High Intent'],
        color: 'orange'
      },
      {
        id: 'turbo_weekly',
        name: 'Turbo Weekly',
        subtitle: 'Pipeline Fill',
        price: 1999,
        duration: 7,
        dailySpeed: 20,
        totalVolume: 140,
        perLeadCost: 14.27,
        badge: 'AGGRESSIVE',
        icon: Flame,
        features: ['20 Leads Daily', '7 Days Only', 'Priority Queue', 'Bulk Discounts'],
        color: 'red',
        popular: true
      },
      {
        id: 'max_blast',
        name: 'Max Blast',
        subtitle: 'Nuclear Mode',
        price: 2999,
        duration: 7,
        dailySpeed: 30,
        totalVolume: 210,
        perLeadCost: 14.28,
        badge: 'VOLUME KING',
        icon: Rocket,
        features: ['30 Leads Daily', '7 Days Only', 'Top Priority', '24/7 Support'],
        color: 'rose'
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 pt-12 pb-16 px-4 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
         <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Growth Speed</span>
         </h1>
         <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Whether you need a steady flow of candidates or an instant pipeline burst, we have a plan for you.
         </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        
        {/* Toggle Switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-full shadow-lg border border-slate-200 inline-flex relative">
             {/* Slider Background */}
             <div 
               className={`absolute top-1.5 bottom-1.5 w-[140px] rounded-full bg-slate-900 transition-all duration-300 ease-out shadow-sm ${
                 activeTab === 'monthly' ? 'left-1.5' : 'left-[148px]'
               }`}
             ></div>
             
             <button
               onClick={() => setActiveTab('monthly')}
               className={`relative z-10 w-[140px] py-2.5 rounded-full font-bold text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${
                 activeTab === 'monthly' ? 'text-white' : 'text-slate-500 hover:text-slate-900'
               }`}
             >
               <Clock size={16} /> Monthly
             </button>
             <button
               onClick={() => setActiveTab('boost')}
               className={`relative z-10 w-[140px] py-2.5 rounded-full font-bold text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${
                 activeTab === 'boost' ? 'text-white' : 'text-slate-500 hover:text-slate-900'
               }`}
             >
               <Zap size={16} /> 7-Day Boost
             </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {currentPlans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-2xl transition-all duration-300 group
                ${plan.popular 
                   ? 'ring-4 ring-blue-600/20 shadow-2xl scale-105 z-10 border-2 border-blue-600' 
                   : 'border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1'
                }
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                    <Crown size={12} className="fill-current" /> Most Popular
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className="p-8 pb-0">
                 <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${
                       activeTab === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                       <plan.icon size={28} />
                    </div>
                    {plan.badge && !plan.popular && (
                       <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase">
                          {plan.badge}
                       </span>
                    )}
                 </div>
                 
                 <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                 <p className="text-slate-500 text-sm font-medium mb-6">{plan.subtitle}</p>

                 <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span>
                    <span className="text-slate-400 font-medium">/ {plan.duration} days</span>
                 </div>

                 {/* Cost Per Lead (Psychology Anchor) */}
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold mb-6">
                    <Zap size={12} className="fill-current" />
                    Only ₹{plan.perLeadCost.toFixed(1)} per lead
                 </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-2"></div>

              {/* Features */}
              <div className="p-8 pt-4">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-600">Daily Volume</span>
                    <span className={`text-lg font-bold ${activeTab === 'boost' ? 'text-orange-600' : 'text-blue-600'}`}>
                       {plan.dailySpeed} Leads
                    </span>
                 </div>
                 
                 <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                       <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                          <div className={`mt-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                             plan.popular ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                             <Check size={10} strokeWidth={4} />
                          </div>
                          <span className={idx === 0 ? 'font-semibold text-slate-900' : ''}>
                             {feature}
                          </span>
                       </li>
                    ))}
                 </ul>

                 <button
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                    disabled={loading === plan.id}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
                       ${plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                       }
                       ${loading === plan.id ? 'opacity-70 cursor-wait' : ''}
                    `}
                 >
                    {loading === plan.id ? 'Processing...' : (
                       <>
                          {plan.buttonText || (activeTab === 'monthly' ? 'Subscribe Now' : 'Activate Boost')} 
                          <ArrowRight size={16} />
                       </>
                    )}
                 </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Footer */}
        <div className="mt-16 text-center border-t border-slate-200 pt-10">
           <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                 <Shield size={18} className="text-emerald-500" /> Secure SSL Payment
              </span>
              <span className="hidden md:block text-slate-300">•</span>
              <span className="flex items-center gap-2">
                 <Zap size={18} className="text-blue-500" /> Instant Activation
              </span>
              <span className="hidden md:block text-slate-300">•</span>
              <span className="flex items-center gap-2">
                 <Check size={18} className="text-slate-400" /> GST Invoice Available
              </span>
           </div>
        </div>

      </div>
    </div>
  );
};
