import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Check, Zap, Shield, Crown, Rocket, Flame, Clock, TrendingUp, 
  Gift, ArrowRight, Star, BarChart3, X, ChevronLeft
} from 'lucide-react';

interface SubscriptionProps {
  onClose?: () => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, originalAmount: number) => {
    setLoading(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please login first to subscribe.");

      // 👇 FOR TESTING: Force amount to ₹1 (100 paise)
      const testAmount = 100; // 100 paise = ₹1

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: testAmount, // ₹1 for testing
        currency: "INR",
        name: "LeadFlow CRM",
        description: `Test Payment: ${planId}`,
        image: '/logo.png', // Add your logo URL if available
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email,
          contact: user.user_metadata?.phone || ''
        },
        notes: {
          user_id: user.id,           // ⭐ Critical
          plan_name: planId,          // ⭐ Critical
          user_email: user.email,
          is_test: 'true'
        },
        theme: {
          color: activeTab === 'monthly' ? "#2563EB" : "#EA580C"
        },
        handler: async function(response: any) {
          console.log('Payment Success:', response);
          alert("🎉 Payment Successful! Plan will activate shortly.");
          
          // Optional: Verify payment via backend here if needed
          
          window.location.href = '/';
        },
        modal: {
          ondismiss: function() {
            setLoading(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert(`Payment Failed: ${response.error.description}`);
        setLoading(null);
      });
      
      rzp.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      alert("Error: " + error.message);
      setLoading(null);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.back();
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
    <div className="fixed inset-0 z-50 bg-white md:bg-black/50 md:backdrop-blur-sm overflow-hidden">
      <div className="h-full w-full overflow-y-auto md:flex md:items-start md:justify-center md:py-4">
        <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 md:rounded-2xl md:shadow-2xl md:my-4 min-h-full md:min-h-0">
          
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Gift size={18} className="text-purple-600" />
              <span>Choose Plan (Test Mode: ₹1)</span>
            </h1>

            <button
              onClick={handleClose}
              className="p-2 -mr-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          <div className="px-4 py-6 md:px-6">
            
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-sm">
              <p className="font-bold">⚠️ TEST MODE ACTIVE</p>
              <p className="text-sm">All plans will cost only <strong>₹1</strong> for testing.</p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-6 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 flex-wrap text-sm sm:text-base">
                <Gift size={18} className="animate-bounce flex-shrink-0" />
                <span className="font-bold">First-Time Bonus:</span>
                <span><strong>5 EXTRA Leads FREE</strong></span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">Auto-Applied ✓</span>
              </div>
            </div>

            <div className="text-center mb-6 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 sm:mb-3 tracking-tight">
                Choose Your Lead Plan
              </h1>
              <p className="text-sm sm:text-lg text-slate-500 max-w-2xl mx-auto px-2">
                Fresh leads daily. <span className="text-green-600 font-bold">₹10-17 per lead</span>. 
                Higher plan = <span className="text-blue-600 font-bold">Faster delivery</span>.
              </p>
            </div>

            <div className="flex justify-center mb-6 sm:mb-10">
              <div className="bg-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 inline-flex w-full max-w-xs sm:max-w-none sm:w-auto">
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'monthly'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Clock size={16} /> 
                  <span>Monthly</span>
                </button>
                <button
                  onClick={() => setActiveTab('boost')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'boost'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Zap size={16} /> 
                  <span>7-Day Boost</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 items-stretch">
              {currentPlans.map((plan) => {
                const PlanIcon = plan.icon;
                
                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl sm:rounded-3xl border-2 ${plan.borderColor} p-4 sm:p-6 relative transition-all duration-300 hover:shadow-xl flex flex-col ${
                      plan.highlight 
                        ? `ring-2 sm:ring-4 ring-opacity-30 shadow-xl sm:shadow-2xl md:scale-105 z-10 ${activeTab === 'monthly' ? 'ring-blue-400' : 'ring-orange-400'}` 
                        : 'shadow-sm'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 z-20">
                        <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black text-white shadow-lg whitespace-nowrap ${
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

                    <div className="text-center mb-3 sm:mb-4 pt-3 sm:pt-4">
                      <div className={`mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 ${
                          activeTab === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        <PlanIcon size={24} className="sm:w-7 sm:h-7" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide">{plan.subtitle}</p>
                      
                      <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white ${plan.priorityColor}`}>
                        <Star size={8} className="sm:w-2.5 sm:h-2.5" />
                        Weight: {plan.weight} • {plan.priority}
                      </div>
                    </div>

                    <div className="text-center mb-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-slate-400 line-through text-base sm:text-lg">₹{plan.originalPrice}</span>
                        <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
                          SAVE ₹{plan.originalPrice - plan.price}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900">₹{plan.price}</span>
                        <span className="text-slate-500 text-xs sm:text-sm">/{plan.duration} days</span>
                      </div>
                    </div>

                    <div className="text-center mb-3 sm:mb-4">
                      <span className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                        📍 Queue: {plan.queuePosition}
                      </span>
                    </div>

                    <div className={`rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 ${activeTab === 'monthly' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm text-slate-600">Daily Leads</span>
                        <span className={`text-base sm:text-lg font-extrabold ${activeTab === 'monthly' ? 'text-blue-600' : 'text-orange-600'}`}>
                          {plan.dailySpeed}/day
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm text-slate-600">Total Leads</span>
                        <span className="text-base sm:text-lg font-bold text-slate-800">~{plan.totalVolume}</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 sm:space-y-2.5 mb-4 sm:mb-6 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700">
                          <Check size={14} className={`mt-0.5 flex-shrink-0 sm:w-4 sm:h-4 ${activeTab === 'monthly' ? 'text-blue-500' : 'text-orange-500'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id, plan.price)}
                      disabled={loading === plan.id}
                      className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-white text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 ${plan.buttonColor}`}
                    >
                      {loading === plan.id ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        <>
                          Pay ₹1 (Test) <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="h-20 sm:h-0"></div>

          </div>

          <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 p-3 shadow-lg z-30">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Subscription;
