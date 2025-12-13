import React, { useState } from 'react';
import { User } from '../types';
import { Check, Zap, Crown, Users, TrendingUp } from 'lucide-react';

interface SubscriptionProps {
  user: User;
  onPaymentSuccess: (planId: string, paymentId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  // 🔥 PRODUCTION PLANS (Your Real Business)
  const plans = [
    {
      id: 'new_member',
      name: 'New Member',
      price: 1000,
      duration: '30 Days',
      totalLeads: 60,
      dailyLeads: 2,
      highlight: 'Perfect to Start',
      features: [
        '60 Guaranteed Leads/Month',
        '2 Fresh Leads Daily',
        '✅ Housewife Target',
        '✅ Student Target',
        '✅ Job Seeker Target',
        'Invalid Number Replacement',
        'WhatsApp Support'
      ],
      color: 'bg-white border-slate-200',
      btnColor: 'bg-slate-800 text-white hover:bg-slate-900',
      badge: null
    },
    {
      id: 'supervisor',
      name: 'Supervisor',
      price: 2000,
      duration: '30 Days',
      totalLeads: 130,
      dailyLeads: 4,
      highlight: 'Most Popular Choice',
      features: [
        '130+ Monthly Leads',
        '4-5 Daily Lead Drop',
        '✅ All Target Categories',
        '✅ Priority Distribution',
        '✅ Better Quality Leads',
        'Fast Replacement',
        'Priority Support',
        '📞 Calling Script Included'
      ],
      color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 ring-2 ring-blue-500',
      btnColor: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg',
      badge: 'RECOMMENDED'
    },
    {
      id: 'manager',
      name: 'Manager',
      price: 3500,
      duration: '30 Days',
      totalLeads: 200,
      dailyLeads: 7,
      highlight: 'For Team Leaders',
      features: [
        '200+ Premium Leads',
        '7 Daily Lead Guarantee',
        '✅ Exclusive Quality',
        '✅ Team Distribution Ready',
        '✅ Custom Filter Priority',
        'Instant Replacement',
        'Dedicated Account Manager',
        '🎯 First Access to New Leads'
      ],
      color: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400',
      btnColor: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg',
      badge: 'PREMIUM'
    }
  ];

  const handleBuy = async (plan: any) => {
    setLoading(true);
    try {
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

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "LeadFlow CRM",
        description: `${plan.name} - ${plan.totalLeads} Monthly Leads`,
        order_id: order.id,
        handler: function (response: any) {
          alert(`✅ Payment Successful! Leads will start from tomorrow morning.`);
          onPaymentSuccess(plan.id, response.razorpay_payment_id);
          setTimeout(() => window.location.reload(), 1500);
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert(`❌ Payment Failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp1.open();

    } catch (error: any) {
      console.error('Payment Error:', error);
      alert('Failed to start payment. Please contact support.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-semibold mb-4">
          <TrendingUp className="w-4 h-4" />
          50+ Active Clients • 5000+ Leads Delivered
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Choose Your Growth Plan 🎯
        </h1>
        <p className="text-lg text-slate-600">
          Get daily <strong>Housewife + Student + Job Seeker</strong> leads directly in your Google Sheet
        </p>
      </div>

      {/* Current Status (If Active) */}
      {user.payment_status === 'active' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl p-6 mx-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-full">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900 text-lg">✅ Plan Active</h3>
              <p className="text-green-700">
                Current Limit: <strong>{user.daily_limit} leads/day</strong> • 
                Expires: <strong>{user.valid_until ? new Date(user.valid_until).toLocaleDateString('en-IN') : 'N/A'}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative rounded-2xl p-8 shadow-lg border-2 flex flex-col transition-all hover:scale-105 ${plan.color}`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg uppercase">
                {plan.badge}
              </div>
            )}

            {/* Icon */}
            <div className="mb-4">
              {plan.id === 'new_member' && <Users className="w-8 h-8 text-slate-600" />}
              {plan.id === 'supervisor' && <Zap className="w-8 h-8 text-blue-600" />}
              {plan.id === 'manager' && <Crown className="w-8 h-8 text-purple-600" />}
            </div>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-600 font-medium">{plan.highlight}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-slate-900">₹{plan.price}</span>
                <span className="text-slate-500">/ month</span>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-900 text-white rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs opacity-70">Daily Delivery</span>
                <span className="text-2xl font-bold">{plan.dailyLeads}</span>
              </div>
              <div className="h-px bg-white/20 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-70">Total Monthly</span>
                <span className="font-bold text-green-400">{plan.totalLeads}+</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handleBuy(plan)}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 ${plan.btnColor} ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? 'Processing...' : user.payment_status === 'active' ? 'Upgrade Plan' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Trust Section */}
      <div className="bg-slate-50 rounded-2xl p-8 mx-4">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
            <p className="text-slate-600 font-medium">Active Clients</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">5000+</div>
            <p className="text-slate-600 font-medium">Leads Delivered</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
            <p className="text-slate-600 font-medium">Replacement Guarantee</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-600 mb-2">24/7</div>
            <p className="text-slate-600 font-medium">WhatsApp Support</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-500 px-4 space-y-2">
        <p>🔒 100% Secure Payment via Razorpay • GST Invoice Provided</p>
        <p>📞 Support: <a href="https://wa.me/919876543210" className="text-blue-600 font-semibold hover:underline">WhatsApp Us</a></p>
      </div>
    </div>
  );
};
