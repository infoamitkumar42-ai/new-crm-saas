import React from 'react';
import { User } from '../types';

interface SubscriptionProps {
  user: User;
  onPaymentSuccess: (planId: string, paymentId: string) => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onPaymentSuccess }) => {
  
  // PLANS CONFIGURATION
  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      price: 499,
      leads: 40, // Approx
      costPerLead: '₹12',
      features: ['Valid for 7 Days', 'Basic City Filtering', 'Email Support'],
      color: 'bg-white border-slate-200',
      btnColor: 'bg-slate-900 text-white',
      badge: null
    },
    {
      id: 'pro',
      name: 'Growth Pack',
      price: 1999,
      leads: 200, // Approx
      costPerLead: '₹9.9', // Psychology Trigger!
      features: ['Valid for 30 Days', 'Advanced Targeting', 'Priority WhatsApp Support', 'No Daily Limit'],
      color: 'bg-brand-50 border-brand-500 ring-1 ring-brand-500',
      btnColor: 'bg-brand-600 text-white hover:bg-brand-700',
      badge: 'MOST POPULAR'
    },
    {
      id: 'agency',
      name: 'Agency / Team',
      price: 7999,
      leads: 1000,
      costPerLead: '₹8', // Cheapest!
      features: ['Valid for 60 Days', '5 Team Members', 'Dedicated Account Manager', 'Custom Integrations'],
      color: 'bg-white border-slate-200',
      btnColor: 'bg-slate-900 text-white',
      badge: 'BEST VALUE'
    }
  ];

  const handleBuy = (plan: any) => {
    // Abhi ke liye bas alert, baad mein Razorpay
    alert(`Redirecting to payment for ${plan.name} (₹${plan.price})...`);
    // onPaymentSuccess(plan.id, "dummy_payment_id");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
        <p className="text-slate-500 mt-2 text-lg">
          No monthly salary. No hidden fees. Pay only for the leads you get.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative rounded-2xl p-6 shadow-sm border flex flex-col ${plan.color}`}>
            
            {/* Badge (Most Popular etc) */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {plan.badge}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <div className="flex items-baseline mt-2">
                <span className="text-4xl font-bold text-slate-900">₹{plan.price}</span>
                <span className="text-slate-500 ml-2 text-sm">/ one-time</span>
              </div>
              <div className="mt-2 inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-medium">
                Effective Cost: {plan.costPerLead} / lead
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-sm text-slate-700 font-medium">
                <svg className="w-5 h-5 text-brand-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ~{plan.leads} High Quality Leads
              </li>
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-center text-sm text-slate-600">
                  <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleBuy(plan)}
              className={`w-full py-3 rounded-lg font-bold transition-all shadow-md ${plan.btnColor}`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      {/* Psychology Note */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
        <p className="text-slate-600 text-sm">
          🔒 <strong>100% Secure Payment via Razorpay.</strong> Leads are distributed based on your "Settings" filters (City/Age).
        </p>
      </div>
    </div>
  );
};
