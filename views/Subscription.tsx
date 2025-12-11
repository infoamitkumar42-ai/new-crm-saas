import React, { useState } from 'react';
import { User } from '../types';

interface SubscriptionProps {
  user: User;
  onPaymentSuccess: (planId: string, paymentId: string) => void;
}

// Window object mein Razorpay add karo taaki Typescript chillaye nahi
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onPaymentSuccess }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState(false);

  // --- PLANS SETUP ---
  const plans = [
    // Monthly Plans
    {
      id: 'starter_monthly', type: 'monthly', name: 'Starter Plan', price: 999,
      duration: '30 Days', dailyLimit: 2, totalLeads: '~60 Leads',
      highlight: 'For Beginners', features: ['Daily Drop: 2 Leads', 'Valid: 30 Days', '✅ Replacement Guarantee', 'Calling Script Included'],
      color: 'bg-white border-slate-200', btnColor: 'bg-slate-800 text-white', badge: null
    },
    {
      id: 'growth_monthly', type: 'monthly', name: 'Supervisor Plan', price: 1999,
      duration: '30 Days', dailyLimit: 5, totalLeads: '~150 Leads',
      highlight: 'Best for Recruiters', features: ['Daily: 5 Leads', 'Valid: 30 Days', '✅ Priority Replacement', 'Target: Housewives/Job'],
      color: 'bg-brand-50 border-brand-500 ring-1 ring-brand-500', btnColor: 'bg-brand-600 text-white hover:bg-brand-700', badge: 'STEADY GROWTH'
    },
    {
      id: 'team_monthly', type: 'monthly', name: 'Manager Plan', price: 4999,
      duration: '30 Days', dailyLimit: 12, totalLeads: '~360 Leads',
      highlight: 'For Leaders', features: ['Daily: 12 Bulk Leads', 'Valid: 30 Days', '✅ Team Distribution', 'Dedicated Support'],
      color: 'bg-white border-slate-200', btnColor: 'bg-slate-800 text-white', badge: null
    },
    // Weekly Boost Plans
    {
      id: 'boost_a', type: 'boost', name: 'Fast Start', price: 999,
      duration: '7 Days', dailyLimit: 10, totalLeads: '~70 Leads',
      highlight: 'More Leads than Monthly', features: ['Daily: 10 Leads', 'Valid: 7 Days Only', '⚡ High Speed Delivery', 'Burn Budget Fast'],
      color: 'bg-white border-slate-200', btnColor: 'bg-amber-600 text-white hover:bg-amber-700', badge: 'SPEED'
    },
    {
      id: 'boost_b', type: 'boost', name: 'Turbo Weekly', price: 1999,
      duration: '7 Days', dailyLimit: 20, totalLeads: '~140 Leads',
      highlight: 'Instant Pipeline Fill', features: ['Daily: 20 Leads', 'Valid: 7 Days Only', '🔥 Aggressive Growth', 'High Intent Data'],
      color: 'bg-amber-50 border-amber-500 ring-1 ring-amber-500', btnColor: 'bg-amber-600 text-white hover:bg-amber-700', badge: 'BEST ROI'
    }
  ];

  const filteredPlans = plans.filter(p => p.type === activeTab);

  // --- PAYMENT LOGIC ---
  const handleBuy = async (plan: any) => {
    setLoading(true);
    try {
      // 1. Create Order on Server
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          price: plan.price,
          userId: user.id
        })
      });

      const order = await response.json();

      if (!response.ok) {
        throw new Error(order.error || 'Order creation failed');
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Frontend Key
        amount: order.amount,
        currency: order.currency,
        name: "LeadFlow CRM",
        description: `Subscription for ${plan.name}`,
        order_id: order.id,
        handler: function (response: any) {
          // Success!
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          onPaymentSuccess(plan.id, response.razorpay_payment_id);
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert(`Payment Failed: ${response.error.description}`);
      });
      rzp1.open();

    } catch (error: any) {
      console.error('Payment Error:', error);
      alert('Failed to start payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header & Toggle */}
      <div className="text-center max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Choose Your Strategy 🎯</h2>
        <p className="text-slate-500 mt-3 text-lg">Do you want consistent daily leads (Monthly)? Or a massive burst this week (Boost)?</p>
        <div className="flex justify-center mt-8">
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center shadow-inner border border-slate-200">
            <button onClick={() => setActiveTab('monthly')} className={`px-6 md:px-8 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'monthly' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🗓️ Monthly (Steady)</button>
            <button onClick={() => setActiveTab('boost')} className={`px-6 md:px-8 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'boost' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🚀 Boost Packs (Fast)</button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className={`relative rounded-2xl p-6 shadow-sm border flex flex-col hover:-translate-y-1 transition-transform duration-200 ${plan.color}`}>
            {plan.badge && <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm ${plan.type === 'monthly' ? 'bg-brand-600' : 'bg-amber-600'}`}>{plan.badge}</div>}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{plan.highlight}</p>
              <div className="mt-4 flex items-baseline"><span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span><span className="text-xs text-slate-500 ml-1 font-medium">/ {plan.duration}</span></div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 mb-5 border border-slate-100">
              <div className="flex justify-between items-center text-sm mb-1"><span className="text-slate-600">Daily Speed:</span><span className={`font-bold ${plan.type === 'monthly' ? 'text-brand-700' : 'text-amber-700'}`}>{plan.dailyLimit} Leads/day</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-600">Total Volume:</span><span className="font-bold text-slate-900">{plan.totalLeads}</span></div>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start text-xs text-slate-700 font-medium">
                  <svg className={`w-4 h-4 mr-2 flex-shrink-0 ${plan.type === 'monthly' ? 'text-brand-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {feat}
                </li>
              ))}
            </ul>
            <button onClick={() => handleBuy(plan)} disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 ${plan.btnColor} ${loading ? 'opacity-70 cursor-wait' : ''}`}>
              {loading ? 'Processing...' : (plan.type === 'monthly' ? 'Subscribe Now' : 'Activate Boost')}
            </button>
          </div>
        ))}
      </div>
      <div className="text-center mt-8 px-4 text-xs text-slate-400"><p>🔒 100% Secure Payment via Razorpay. Invalid numbers replaced automatically.</p></div>
    </div>
  );
};
