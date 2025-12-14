import { useState } from 'react';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState('monthly');

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
        borderColor: 'border-slate-200'
      },
      {
        id: 'supervisor',
        name: 'Supervisor Plan',
        subtitle: 'BEST FOR RECRUITERS',
        price: 1999,
        duration: 30,
        dailySpeed: 5,
        totalVolume: 150,
        perLeadCost: 13.32,
        badge: 'STEADY GROWTH',
        features: [
          'Daily: 5 Leads',
          'Valid: 30 Days',
          '✅ Priority Replacement',
          'Target: Housewives/Job'
        ],
        buttonText: 'Subscribe Now',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        borderColor: 'border-blue-500'
      },
      {
        id: 'manager',
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
        borderColor: 'border-slate-200'
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
        borderColor: 'border-orange-400'
      },
      {
        id: 'turbo_weekly',
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
        borderColor: 'border-orange-500'
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
        borderColor: 'border-orange-400'
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Strategy Tabs */}
        <div className="flex justify-center mb-8 gap-4">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'monthly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}
          >
            📅 Monthly (Steady)
          </button>
          <button
            onClick={() => setActiveTab('boost')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'boost'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300'
            }`}
          >
            🚀 Boost Packs (Fast)
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 ${plan.borderColor} p-6 relative transition-all hover:shadow-lg ${
                plan.badge === 'STEADY GROWTH' || plan.badge === 'BEST ROI' ? 'ring-2 ring-offset-2 ring-blue-400' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                    plan.badge === 'STEADY GROWTH' || plan.badge === 'BEST ROI' 
                      ? 'bg-blue-600' 
                      : plan.badge === 'SPEED' || plan.badge === 'BEAST'
                      ? 'bg-orange-600'
                      : 'bg-slate-600'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                  {plan.subtitle}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-slate-900">
                    ₹{plan.price}
                  </span>
                  <span className="text-slate-600 text-sm">/ {plan.duration} Days</span>
                </div>
              </div>

              {/* Speed & Volume Stats */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Daily Speed:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {plan.dailySpeed} Leads/day
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Volume:</span>
                  <span className="text-lg font-bold text-slate-900">
                    ~{plan.totalVolume} Leads
                  </span>
                </div>
              </div>

              {/* Per Lead Cost - Green Box */}
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-800">
                    Per Lead Cost
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{plan.perLeadCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-3.5 rounded-lg font-semibold text-white transition-all ${plan.buttonColor} shadow-md hover:shadow-lg`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <span className="text-lg">🔒</span>
            100% Secure Payment via Razorpay. Invalid numbers replaced automatically.
          </p>
        </div>

      </div>
    </div>
  );
};
