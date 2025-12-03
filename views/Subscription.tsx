import React from 'react';
import { Check } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { User, PaymentPlan } from '../types';
import { logEvent } from '../supabaseClient';

const PLANS: PaymentPlan[] = [
  {
    id: 'daily',
    name: 'Day Pass',
    price: 15,
    interval: 'daily',
    features: ['Up to 10 leads/day', 'Basic Filtering', 'Email Support']
  },
  {
    id: 'weekly',
    name: 'Weekly Pro',
    price: 90,
    interval: 'weekly',
    features: ['Up to 50 leads/day', 'Advanced Filtering', 'Priority Support', 'Save 15%']
  },
  {
    id: 'monthly',
    name: 'Enterprise',
    price: 299,
    interval: 'monthly',
    features: ['Unlimited leads/day', 'All Filter Types', 'Dedicated Account Manager', 'Save 30%']
  }
];

interface SubscriptionProps {
  user: User;
  onPaymentSuccess: (planId: string, razorpayPaymentId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onPaymentSuccess }) => {
  
  const handlePurchase = (plan: PaymentPlan) => {
    // 1. Create Order on Backend (Mocked here)
    const options = {
      key: "rzp_test_YOUR_KEY_HERE", // Mock key
      amount: plan.price * 100, // Amount in lowest denomination (paise)
      currency: "USD",
      name: "LeadFlow SaaS",
      description: `Subscription: ${plan.name}`,
      image: "https://picsum.photos/200/200",
      handler: function (response: any) {
        // Log the success before updating state
        logEvent(user.id, 'payment_success_client', {
            plan_id: plan.id,
            amount: plan.price,
            razorpay_id: response.razorpay_payment_id
        });
        
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
    rzp1.open();
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h1>
        <p className="text-slate-500 mt-2">Start receiving high-quality leads directly to your spreadsheet today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`p-6 relative flex flex-col ${plan.id === 'weekly' ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}>
            {plan.id === 'weekly' && (
              <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-slate-900">${plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-slate-500">/{plan.interval}</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.id === 'weekly' ? 'primary' : 'secondary'} 
              className="w-full"
              onClick={() => handlePurchase(plan)}
            >
              Choose {plan.name}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
