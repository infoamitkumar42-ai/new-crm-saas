import React from 'react';
import { User } from '../types';

interface SubscriptionProps {
  user: User;
  onPaymentSuccess: (planId: string, paymentId: string) => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onPaymentSuccess }) => {
  
  // 🔥 FINAL LOCKED PLANS (Launch Ready)
  // Low CPL Advantage: High Margins for you, Great Value for User.
  const plans = [
    {
      id: 'starter',
      name: 'Starter Flow',
      price: 999,
      interval: 'month',
      dailyLimit: 2, // Backend logic ke liye (2 leads/day)
      leadsDisplay: '~40-50 Leads / Month',
      highlight: 'Perfect for Beginners',
      features: [
        'Daily Drop: 1-2 Leads',
        'Consistency: Steady Workflow',
        'No Overwhelm (Easy to manage)',
        'WhatsApp Support Included'
      ],
      color: 'bg-white border-slate-200',
      btnColor: 'bg-slate-900 text-white',
      badge: null
    },
    {
      id: 'pro',
      name: 'Pro Flow',
      price: 2999,
      interval: 'month',
      dailyLimit: 5, // 5 leads/day
      leadsDisplay: '~120-150 Leads / Month',
      highlight: 'Best Value for Growth',
      features: [
        'Daily Drop: 4-5 Leads',
        'Priority Delivery (Get leads first)',
        'Advanced Filtering (City/Age)',
        'High Conversion Rate Strategy'
      ],
      color: 'bg-brand-50 border-brand-500 ring-1 ring-brand-500',
      btnColor: 'bg-brand-600 text-white hover:bg-brand-700',
      badge: 'MOST POPULAR'
    },
    {
      id: 'agency',
      name: 'Agency Flow',
      price: 6999,
      interval: 'month',
      dailyLimit: 15, // 15 leads/day
      leadsDisplay: '~400+ Leads / Month',
      highlight: 'For Teams & Scaling',
      features: [
        'Daily Drop: 12-15 Leads',
        'Multiple Team Access',
        'Dedicated Account Manager',
        'Highest ROI (Lowest Cost Per Lead)'
      ],
      color: 'bg-white border-slate-200',
      btnColor: 'bg-slate-900 text-white',
      badge: 'MAX SCALE'
    }
  ];

  const handleBuy = (plan: any) => {
    // Razorpay Integration Logic yahan aayega
    // Payment success hone par hum DB mein user ka 'daily_limit' update karenge
    // Example: daily_limit = plan.dailyLimit
    alert(`Initiating ₹${plan.price} Monthly Subscription for ${plan.name}...`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Don't Buy "Data". Buy <span className="text-brand-600">Daily Business.</span>
        </h2>
        <p className="text-slate-500 mt-4 text-lg">
          Get <strong>fresh, interested leads delivered daily</strong>. 
          <br className="hidden md:block" />
          No bulk junk. No old databases. Just consistency.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative rounded-2xl p-8 shadow-sm border flex flex-col transition-transform hover:-translate-y-1 ${plan.color}`}>
            
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {plan.badge}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <div className="flex items-baseline mt-4">
                <span className="text-5xl font-extrabold text-slate-900">₹{plan.price}</span>
                <span className="text-slate-500 ml-2 font-medium">/ month</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{plan.highlight}</p>
            </div>

            <div className="flex-1">
              <div className="bg-slate-100/50 rounded-lg p-4 mb-6 text-center border border-slate-200/50">
                <span className="block text-xs text-slate-500 uppercase font-bold tracking-wider">Volume</span>
                <span className="text-xl font-bold text-slate-900">{plan.leadsDisplay}</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-700">
                    <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span className="leading-tight font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleBuy(plan)}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 ${plan.btnColor}`}
            >
              Start Daily Flow
            </button>
          </div>
        ))}
      </div>

      {/* Trust Philosophy */}
      <div className="bg-white rounded-2xl p-8 mx-4 border border-slate-200 text-center shadow-sm">
        <h4 className="text-lg font-bold text-slate-900 mb-2">Why "Daily Flow" Works?</h4>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Instead of dumping 100 leads at once (which you can't handle), we send you 
          <strong> small batches of fresh leads daily</strong>. This ensures you call them instantly 
          and close more deals. It's not magic, it's <strong>Logic.</strong>
        </p>
      </div>
    </div>
  );
};
