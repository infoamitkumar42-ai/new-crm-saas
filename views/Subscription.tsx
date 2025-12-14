import React, { useState } from 'react';
import { Check, Zap, Shield, Crown, Clock, Flame, Rocket, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, amount: number) => {
    // (Payment Logic Same as Before...)
    alert(`Simulating Razorpay for ${planId} (₹${amount})`);
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
        colorTheme: 'slate',
        darkBg: 'from-slate-800 to-slate-900',
        accent: 'slate-400'
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
        colorTheme: 'blue',
        darkBg: 'from-blue-900 to-slate-900', // Dark Blue Gradient
        accent: 'blue-400',
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
        badge: null,
        icon: Rocket,
        features: ['12 Leads Daily', '30 Days Validity', 'Team Dashboard', 'Dedicated Manager'],
        colorTheme: 'indigo',
        darkBg: 'from-indigo-900 to-slate-900',
        accent: 'indigo-400'
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
        badge: null,
        icon: Zap,
        features: ['10 Leads Daily', '7 Days Only', 'Instant Delivery', 'High Intent'],
        colorTheme: 'orange',
        darkBg: 'from-orange-900 to-slate-900',
        accent: 'orange-400'
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
        badge: 'BEST ROI',
        icon: Flame,
        features: ['20 Leads Daily', '7 Days Only', 'Priority Queue', 'Bulk Discounts'],
        colorTheme: 'red',
        darkBg: 'from-red-900 to-slate-900', // Dark Red/Orange Gradient
        accent: 'red-400',
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
        badge: null,
        icon: Rocket,
        features: ['30 Leads Daily', '7 Days Only', 'Top Priority', '24/7 Support'],
        colorTheme: 'rose',
        darkBg: 'from-rose-900 to-slate-900',
        accent: 'rose-400'
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-20">
      {/* Dark Header with Gradient */}
      <div className="relative overflow-hidden pt-16 pb-24 px-4 text-center">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/20 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
         <div className="absolute top-20 left-1/4 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

         <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight relative z-10">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Growth Engine</span>
         </h1>
         <p className="text-lg text-slate-400 max-w-2xl mx-auto relative z-10">
            Steady flow or instant blast. Select the plan that fits your hiring speed.
         </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        
        {/* Dark Toggle Switcher */}
        <div className="flex justify-center mb-16 animate-fade-in-up">
          <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-slate-800 inline-flex relative">
             {/* Slider Background */}
             <div 
               className={`absolute top-1.5 bottom-1.5 w-[150px] rounded-full transition-all duration-300 ease-out shadow-lg ${
                 activeTab === 'monthly' 
                 ? 'left-1.5 bg-gradient-to-r from-blue-600 to-blue-500' 
                 : 'left-[158px] bg-gradient-to-r from-orange-600 to-orange-500'
               }`}
             ></div>
             
             <button
               onClick={() => setActiveTab('monthly')}
               className={`relative z-10 w-[150px] py-3 rounded-full font-bold text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${
                 activeTab === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-white'
               }`}
             >
               <Clock size={18} /> Monthly
             </button>
             <button
               onClick={() => setActiveTab('boost')}
               className={`relative z-10 w-[150px] py-3 rounded-full font-bold text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${
                 activeTab === 'boost' ? 'text-white' : 'text-slate-400 hover:text-white'
               }`}
             >
               <Zap size={18} /> 7-Day Boost
             </button>
          </div>
        </div>

        {/* Dark Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {currentPlans.map((plan, idx) => (
            <div 
              key={plan.id}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 group animate-in fade-in zoom-in
                ${plan.popular 
                   ? `scale-105 z-10 shadow-2xl shadow-${plan.accent}/20 border-2 border-${plan.accent}` 
                   : 'border border-slate-800 shadow-lg hover:-translate-y-2 hover:shadow-xl hover:border-slate-700'
                }
              `}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.darkBg} opacity-90 -z-10`}></div>
              {/* Noise Texture Overlay (Optional) */}
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay -z-10 pointer-events-none"></div>

              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 flex justify-center -mt-4">
                  <span className={`bg-gradient-to-r ${activeTab === 'monthly' ? 'from-blue-500 to-indigo-500' : 'from-orange-500 to-red-500'} text-white text-xs font-bold px-6 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1`}>
                    <Crown size={14} className="fill-current" /> {plan.badge}
                  </span>
                </div>
              )}

              {/* Card Header */}
              <div className={`p-8 pb-0 ${plan.popular ? 'pt-10' : ''}`}>
                 <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-slate-800/50 backdrop-blur-sm text-${plan.accent} shadow-inner border border-slate-700/50`}>
                       <plan.icon size={32} strokeWidth={1.5} />
                    </div>
                    {plan.badge && !plan.popular && (
                       <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-slate-700">
                          {plan.badge}
                       </span>
                    )}
                 </div>
                 
                 <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                 <p className={`text-sm font-medium mb-6 text-${plan.accent}`}>{plan.subtitle}</p>

                 <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-extrabold text-white tracking-tight">₹{plan.price}</span>
                    <span className="text-slate-400 font-medium">/ {plan.duration} days</span>
                 </div>

                 {/* Cost Per Lead (High Contrast) */}
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-8 border border-emerald-500/20">
                    <Zap size={14} className="fill-current" />
                    Only ₹{plan.perLeadCost.toFixed(1)} per lead
                 </div>
              </div>

              {/* Divider with Glow */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2 relative">
                 {plan.popular && <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-${plan.accent} blur-[2px]`}></div>}
              </div>

              {/* Features */}
              <div className="p-8 pt-4">
                 <div className="flex items-center justify-between mb-6 p-3 bg-slate-800/30 rounded-xl border border-slate-800/50">
                    <span className="text-sm font-semibold text-slate-400">Daily Volume</span>
                    <span className={`text-xl font-extrabold text-${plan.accent}`}>
                       {plan.dailySpeed} Leads
                    </span>
                 </div>
                 
                 <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                       <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                          <div className={`mt-0.5 min-w-[20px] h-[20px] rounded-full flex items-center justify-center ${
                             plan.popular ? `bg-${plan.accent} text-slate-900` : `bg-slate-800 text-${plan.accent}`
                          }`}>
                             <Check size={12} strokeWidth={4} />
                          </div>
                          <span className={idx === 0 ? 'font-semibold text-white' : ''}>
                             {feature}
                          </span>
                       </li>
                    ))}
                 </ul>

                 <button
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                    disabled={loading === plan.id}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden
                       ${plan.popular 
                          ? `bg-gradient-to-r ${activeTab === 'monthly' ? 'from-blue-600 to-indigo-600' : 'from-orange-600 to-red-600'} text-white shadow-lg shadow-${plan.accent}/30 hover:scale-[1.02]` 
                          : `bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:border-${plan.accent}/50`
                       }
                       ${loading === plan.id ? 'opacity-70 cursor-wait' : ''}
                    `}
                 >
                    {/* Button Shine Effect */}
                    {plan.popular && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>}
                    
                    <span className="relative z-10 flex items-center gap-2">
                        {loading === plan.id ? 'Processing...' : (
                           <>
                              {activeTab === 'monthly' ? 'Subscribe Now' : 'Activate Boost'} 
                              <ArrowRight size={18} />
                           </>
                        )}
                    </span>
                 </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dark Trust Footer */}
        <div className="mt-20 text-center border-t border-slate-800 pt-10">
           <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                 <Shield size={18} className="text-emerald-400" /> Secure SSL Payment
              </span>
              <span className="hidden md:block text-slate-600">•</span>
              <span className="flex items-center gap-2">
                 <Zap size={18} className="text-blue-400" /> Instant Activation
              </span>
              <span className="hidden md:block text-slate-600">•</span>
              <span className="flex items-center gap-2">
                 <Check size={18} className="text-slate-400" /> GST Invoice Available
              </span>
           </div>
        </div>

      </div>
    </div>
  );
};
