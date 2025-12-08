
import React from 'react';
import { Check } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { User, PaymentPlan } from '../types';
import { logEvent } from '../supabaseClient';
import { ENV } from '../config/env';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS: PaymentPlan[] = [
  {
    id: 'daily',
    name: 'Day Pass',
    price: 49,           // ₹49 per day
    interval: 'daily',
    features: ['Up to 10 leads/day', 'Basic Filtering', 'Email Support']
  },
  {
    id: 'weekly',
    name: 'Growth',
    price: 299,          // ₹299 per week
    interval: 'weekly',
    features: ['Up to 15 leads/day', 'Advanced Filters', 'Priority Support']
  },
  {
    id: 'monthly',
    name: 'Pro',
    price: 999,          // ₹999 per month
    interval: 'monthly',
    features: ['Up to 25 leads/day', 'All Filters', 'Highest Priority Support']
  }
];

interface SubscriptionProps {
  user: User;
  onPaymentSuccess: (planId: string, razorpayPaymentId: string) => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onPaymentSuccess }) => {

  const handlePurchase = (plan: PaymentPlan) => {
    if (!window.Razorpay) {
      alert('Razorpay SDK not loaded');
      return;
    }

    const options = {
      key: ENV.RAZORPAY_KEY_ID,
      amount: plan.price * 100, // paise
      currency: 'INR',
      name: 'LeadFlow CRM',
      description: `${plan.name} (${plan.interval})`,
      prefill: {
        email: user.email,
        name: user.name
      },
      notes: {
        email: user.email,
        planId: plan.id
      },
      handler: async function (response: any) {
        await logEvent('payment_success', {
          planId: plan.id,
          paymentId: response.razorpay_payment_id
        });

        onPaymentSuccess(plan.id, response.razorpay_payment_id);
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Subscription</h2>
        <p className="text-sm text-slate-500">
          Choose a plan to start receiving leads. All prices in INR.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`p-5 flex flex-col ${
              plan.id === 'weekly' ? 'border-brand-500 ring-1 ring-brand-200' : ''
            }`}
          >
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-slate-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-sm text-slate-500">/ {plan.interval}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant={plan.id === 'weekly' ? 'primary' : 'secondary'}
              className="w-full mt-4"
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
