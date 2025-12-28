import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Check, Zap, Shield, Crown, Rocket, Flame, Clock, TrendingUp, 
  Gift, ArrowRight, Star, Timer, Award, BarChart3, Target
} from 'lucide-react';

export const Subscription = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

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
      if (!response.ok) throw new Error(orderData.error || "Order creation failed");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "LeadFlow Plans",
        description: `Activation: ${planId}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          alert("🎉 Payment Successful! Plan activated.");
          window.location.href = '/';
        },
        prefill: { email: user.email },
        theme: { color: activeTab === 'monthly' ? "#2563EB" : "#EA580C" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter',
        subtitle: 'FOR BEGINNERS',
        price: 999,
        originalPrice: 1299,
        duration: 30,
        dailySpeed: 2,
        totalVolume: 60,
        perLeadCost: 16.65,
        weight: 1,
        priority: 'Standard',
        priorityColor: 'bg-slate-500',
        queuePosition: '~15-20',
        expectedLeadsPerHour: 0.25,
        savings: null,
        badge: null,
        features: [
          '2 Fresh Leads/Day',
          'Personal Dashboard',
          'WhatsApp Alerts',
          'Email Support',
          'Standard Queue Priority'
        ],
        buttonText: 'Start Now',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Shield,
        highlight: false
      },
      {
        id: 'supervisor', 
        name: 'Supervisor',
        subtitle: 'MOST POPULAR',
        price: 1999,
        originalPrice: 2499,
        duration: 30,
        dailySpeed: 6,
        totalVolume: 180,
        perLeadCost: 11.10,
        weight: 3,
        priority: 'High',
        priorityColor: 'bg-blue-500',
        queuePosition: '~5-10',
        expectedLeadsPerHour: 0.75,
        savings: '₹5.5/lead cheaper',
        badge: '⭐ BEST VALUE',
        features: [
          '6 Fresh Leads/Day',
          'Priority Support',
          'Lead Replacement Guarantee',
          'Performance Analytics',
          'WhatsApp + Call Alerts',
          '3× Higher Priority'
        ],
        buttonText: 'Get Best Value',
        buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        borderColor: 'border-blue-500',
        highlight: true,
        icon: Crown
      },
      {
        id: 'manager', 
        name: 'Manager',
        subtitle: 'FOR TEAM LEADERS',
        price: 4999,
        originalPrice: 5999,
        duration: 30,
        dailySpeed: 16,
        totalVolume: 480,
        perLeadCost: 10.41,
        weight: 5,
        priority: 'Highest',
        priorityColor: 'bg-orange-500',
        queuePosition: '~1-5',
        expectedLeadsPerHour: 2,
        savings: 'Lowest ₹/lead',
        badge: 'MAX VOLUME',
        features: [
          '16 Fresh Leads/Day',
          'Team Dashboard (5 members)',
          'Auto Lead Assignment',
          'Dedicated Account Manager',
          'Priority Replacement',
          '5× Highest Priority'
        ],
        buttonText: 'Go Premium',
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        icon: Rocket,
        highlight: false
      }
    ],
    boost: [
      {
        id: 'fast_start',
        name: 'Fast Start',
        subtitle: '7-DAY TRIAL',
        price: 499,
        originalPrice: 699,
        duration: 7,
        dailySpeed: 5,
        totalVolume: 35,
        perLeadCost: 14.25,
        weight: 8,
        priority: 'Turbo',
        priorityColor: 'bg-orange-500',
        queuePosition: '~1-3',
        expectedLeadsPerHour: 1.5,
        savings: null,
        badge: 'TRY FIRST',
        features: [
          '5 Leads/Day for 7 Days',
          'Test the System',
          'Full Dashboard Access',
          'Upgrade Anytime',
          '8× Priority Weight'
        ],
        buttonText: 'Try Now - ₹499',
        buttonColor: 'bg-orange-500 hover:bg-orange-600',
        borderColor: 'border-orange-300',
        icon: Zap,
        highlight: false
      },
      {
        id: 'turbo_weekly',
        name: 'Turbo Week',
        subtitle: 'HIGH VOLUME',
        price: 1499,
        originalPrice: 1999,
        duration: 7,
        dailySpeed: 20,
        totalVolume: 140,
        perLeadCost: 10.70,
        weight: 10,
        priority: 'Ultra',
        priorityColor: 'bg-red-500',
        queuePosition: '#1',
        expectedLeadsPerHour: 3,
        savings: 'Best Weekly ROI',
        badge: '🔥 POPULAR',
        features: [
          '20 Leads/Day for 7 Days',
          'High Intent Leads',
          'Priority Queue',
          'Perfect for Campaigns',
          '10× Ultra Priority'
        ],
        buttonText: 'Boost Now',
        buttonColor: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
        borderColor: 'border-orange-500',
        highlight: true,
        icon: Flame
      },
      {
        id: 'max_blast',
        name: 'Max Blast',
        subtitle: 'MAXIMUM LEADS',
        price: 2499,
        originalPrice: 2999,
        duration: 7,
        dailySpeed: 35,
        totalVolume: 245,
        perLeadCost: 10.20,
        weight: 12,
        priority: 'Maximum',
        priorityColor: 'bg-purple-600',
        queuePosition: '#1 Always',
        expectedLeadsPerHour: 5,
        savings: 'Lowest Cost',
        badge: 'BEAST MODE',
        features: [
          '35 Leads/Day for 7 Days',
          'Exclusive Territory',
          '24/7 Priority Support',
          'Recruitment Drives',
          '12× Maximum Priority'
        ],
        buttonText: 'Go Beast Mode',
        buttonColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
        borderColor: 'border-purple-400',
        icon: TrendingUp,
        highlight: false
      }
    ]
  };

  const currentPlans = plans[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Offer Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 mb-8 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Gift size={20} className="animate-bounce" />
            <span className="font-bold">First-Time Buyer Bonus:</span>
            <span>Get <strong>5 EXTRA Leads FREE</strong> with any plan!</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold ml-2">Auto-Applied ✓</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Choose Your Lead Plan
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Fresh leads daily. <span className="text-green-600 font-bold">₹10-17 per lead</span>. 
            Higher plan = <span className="text-blue-600 font-bold">Faster delivery</span>.
          </p>
        </div>

        {/* Priority Explainer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">🚀 How Priority Works</h3>
              <p className="text-sm text-blue-700 mt-1">
                Each plan has a <strong>Weight</strong> (1-12). Higher weight = Higher score = You get leads first!
                Booster plans have maximum priority for fastest delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Clock size={18} /> Monthly Plans
            </button>
            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'boost'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Zap size={18} /> 7-Day Boost
            </button>
          </div>
        </div>

        {/* Tab Description */}
        <div className="text-center mb-8">
          {activeTab === 'monthly' ? (
            <p className="text-slate-600 bg-blue-50 inline-block px-4 py-2 rounded-lg">
              📅 <strong>Monthly Plans:</strong> Steady daily leads for consistent growth
            </p>
          ) : (
            <p className="text-slate-600 bg-orange-50 inline-block px-4 py-2 rounded-lg">
              ⚡ <strong>7-Day Boost:</strong> High volume for short campaigns or testing
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-stretch">
          {currentPlans.map((plan) => {
            const PlanIcon = plan.icon;
            
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl border-2 ${plan.borderColor} p-6 relative transition-all duration-300 hover:shadow-xl flex flex-col ${
                  plan.highlight 
                    ? `ring-4 ring-opacity-30 shadow-2xl md:scale-105 z-10 ${activeTab === 'monthly' ? 'ring-blue-400' : 'ring-orange-400'}` 
                    : 'shadow-sm'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black text-white shadow-lg whitespace-nowrap ${
                      plan.highlight 
                        ? activeTab === 'monthly' 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                        : 'bg-slate-700'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-4 pt-4">
                  <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                      activeTab === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    <PlanIcon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{plan.subtitle}</p>
                  
                  {/* Priority Badge */}
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-bold text-white ${plan.priorityColor}`}>
                    <Star size={10} />
                    Weight: {plan.weight} • {plan.priority}
                  </div>
                </div>

                {/* Price */}
                <div className="text-center mb-2">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-slate-400 line-through text-lg">₹{plan.originalPrice}</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">
                      SAVE ₹{plan.originalPrice - plan.price}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                    <span className="text-slate-500 text-sm">/{plan.duration} days</span>
                  </div>
                </div>

                {/* Queue Position */}
                <div className="text-center mb-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    📍 Queue Position: {plan.queuePosition}
                  </span>
                </div>

                {/* Savings Badge */}
                <div className="text-center mb-4 h-6">
                  {plan.savings && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      ✓ {plan.savings}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className={`rounded-xl p-4 mb-4 ${activeTab === 'monthly' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Daily Leads</span>
                    <span className={`text-lg font-extrabold ${activeTab === 'monthly' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {plan.dailySpeed}/day
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Total Leads</span>
                    <span className="text-lg font-bold text-slate-800">~{plan.totalVolume}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Leads/Hour</span>
                    <span className="text-lg font-bold text-green-600">~{plan.expectedLeadsPerHour}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-sm text-slate-600 font-medium">Cost/Lead</span>
                    <span className={`text-lg font-black ${plan.perLeadCost < 12 ? 'text-green-600' : 'text-slate-700'}`}>
                      ₹{plan.perLeadCost.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${activeTab === 'monthly' ? 'text-blue-500' : 'text-orange-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id, plan.price)}
                  disabled={loading === plan.id}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2 ${plan.buttonColor}`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {plan.buttonText} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield size={20} className="text-green-500" />
              <span><strong>7-Day Money Back</strong> Guarantee</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-slate-600">
              <Zap size={20} className="text-blue-500" />
              <span><strong>Instant</strong> Activation</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-slate-600">
              <Star size={20} className="text-yellow-500" />
              <span><strong>500+</strong> Happy Agents</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2 text-slate-600">
              <Check size={20} className="text-slate-400" />
              <span><strong>GST</strong> Invoice</span>
            </div>
          </div>
        </div>

        {/* Priority Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="font-bold text-lg text-slate-800 mb-4 text-center">
            ⚡ Priority Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Plan</th>
                  <th className="text-center p-2">Weight</th>
                  <th className="text-center p-2">Priority</th>
                  <th className="text-center p-2">Queue</th>
                  <th className="text-center p-2">Speed</th>
                </tr>
              </thead>
              <tbody>
                {[...plans.monthly, ...plans.boost].map(plan => (
                  <tr key={plan.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-2 font-medium">{plan.name}</td>
                    <td className="text-center p-2">
                      <span className={`px-2 py-0.5 rounded text-white text-xs font-bold ${plan.priorityColor}`}>
                        {plan.weight}×
                      </span>
                    </td>
                    <td className="text-center p-2">{plan.priority}</td>
                    <td className="text-center p-2">{plan.queuePosition}</td>
                    <td className="text-center p-2">{plan.expectedLeadsPerHour}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Mini */}
        <div className="bg-slate-50 rounded-2xl p-6 text-center">
          <p className="text-slate-600 mb-2">
            <strong>Questions?</strong> WhatsApp us anytime
          </p>
          <a 
            href="https://wa.me/917009064038" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition-colors"
          >
            💬 Chat on WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
};

export default Subscription;
