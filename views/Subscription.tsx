import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Check, Zap, Shield, Crown, Rocket, Flame, Clock, 
  Gift, ArrowRight, Star, X, ChevronLeft, TrendingUp,
  Users, Phone, MessageCircle, BarChart3
} from 'lucide-react';

interface SubscriptionProps {
  onClose?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Subscription: React.FC<SubscriptionProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'boost'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINAL PLAN CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const plans = {
    monthly: [
      {
        id: 'starter',
        name: 'Starter',
        subtitle: 'Perfect for Beginners',
        price: 999,
        duration: 10,
        dailyLeads: 5,
        totalLeads: 50,
        perDay: 99.9,
        weight: 1,
        priority: 'Standard',
        priorityColor: 'bg-slate-500',
        features: [
          '5 Fresh Leads Every Day',
          '100% Verified Numbers',
          'Real-time WhatsApp Alerts',
          'Personal Dashboard',
          'Email Support',
          'Invalid Lead Replacement'
        ],
        icon: Shield,
        highlight: false,
        badge: null,
        buttonColor: 'bg-slate-800 hover:bg-slate-900',
        borderColor: 'border-slate-200',
        bgGradient: 'from-slate-50 to-white'
      },
      {
        id: 'supervisor',
        name: 'Supervisor',
        subtitle: 'Most Popular Choice',
        price: 1999,
        duration: 15,
        dailyLeads: 7,
        totalLeads: 105,
        perDay: 133.27,
        weight: 3,
        priority: 'High',
        priorityColor: 'bg-blue-500',
        features: [
          '7 Fresh Leads Every Day',
          '100% Exclusive Leads',
          'Priority Delivery Queue',
          'WhatsApp + Call Alerts',
          'Performance Analytics',
          'Priority Support',
          'Invalid Lead Replacement'
        ],
        icon: Crown,
        highlight: true,
        badge: '⭐ BEST VALUE',
        buttonColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        borderColor: 'border-blue-400',
        bgGradient: 'from-blue-50 to-indigo-50'
      },
      {
        id: 'manager',
        name: 'Manager',
        subtitle: 'For Serious Closers',
        price: 2999,
        duration: 20,
        dailyLeads: 8,
        totalLeads: 160,
        perDay: 149.95,
        weight: 5,
        priority: 'Premium',
        priorityColor: 'bg-purple-500',
        features: [
          '8 Fresh Leads Every Day',
          'Highest Priority Queue',
          'Exclusive Territory Option',
          'Dedicated Support',
          'Advanced Analytics',
          'Team Dashboard Access',
          'Priority Replacement',
          'Monthly Strategy Call'
        ],
        icon: Rocket,
        highlight: false,
        badge: '👑 PRO',
        buttonColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
        borderColor: 'border-purple-300',
        bgGradient: 'from-purple-50 to-indigo-50'
      }
    ],
    boost: [
      {
        id: 'weekly_boost',
        name: 'Weekly Boost',
        subtitle: '7-Day Power Pack',
        price: 1999,
        duration: 7,
        dailyLeads: 12,
        totalLeads: 84,
        perDay: 285.57,
        weight: 7,
        priority: 'Turbo',
        priorityColor: 'bg-orange-500',
        features: [
          '12 Leads Every Day',
          'Turbo Priority Queue',
          'Perfect for Campaigns',
          'Real-time Delivery',
          'Full Dashboard Access',
          'WhatsApp Alerts'
        ],
        icon: Zap,
        highlight: false,
        badge: '🚀 FAST',
        buttonColor: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
        borderColor: 'border-orange-300',
        bgGradient: 'from-orange-50 to-amber-50'
      },
      {
        id: 'turbo_boost',
        name: 'Turbo Boost',
        subtitle: 'Maximum Volume',
        price: 2499,
        duration: 7,
        dailyLeads: 14,
        totalLeads: 98,
        perDay: 357,
        weight: 9,
        priority: 'Ultra',
        priorityColor: 'bg-red-500',
        features: [
          '14 Leads Every Day',
          'Ultra Priority - #1 Queue',
          'Best for Recruitments',
          'Instant Notifications',
          'Premium Support',
          'Guaranteed Delivery',
          'Invalid Replacement'
        ],
        icon: Flame,
        highlight: true,
        badge: '🔥 POPULAR',
        buttonColor: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
        borderColor: 'border-red-400',
        bgGradient: 'from-red-50 to-orange-50'
      }
    ]
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PAYMENT HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleSubscribe = async (plan: typeof plans.monthly[0]) => {
    setLoading(plan.id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Please login first to subscribe.");
        setLoading(null);
        return;
      }

      // Production amount (paise)
      const amount = plan.price * 100;
      
      // For testing, use ₹1
      // const amount = 100; // Uncomment for testing

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "LeadFlow CRM",
        description: `${plan.name} Plan - ${plan.duration} Days`,
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email,
          contact: user.user_metadata?.phone || ''
        },
        notes: {
          user_id: user.id,
          plan_name: plan.id,
          plan_duration: plan.duration.toString(),
          daily_leads: plan.dailyLeads.toString(),
          total_leads: plan.totalLeads.toString(),
          user_email: user.email
        },
        theme: {
          color: activeTab === 'monthly' ? "#2563EB" : "#EA580C"
        },
        handler: async function(response: any) {
          console.log('✅ Payment Success:', response);
          alert("🎉 Payment Successful! Your plan is now active.");
          window.location.href = '/dashboard';
        },
        modal: {
          ondismiss: function() {
            setLoading(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function(response: any) {
        console.error('❌ Payment Failed:', response.error);
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

  const currentPlans = plans[activeTab];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden">
      <div className="h-full w-full overflow-y-auto pb-24">
        
        {/* ━━━ Header ━━━ */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={handleClose}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-sm p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Gift size={18} className="text-blue-600" />
            Choose Your Plan
          </h1>

          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-5">
          
          {/* ━━━ Welcome Offer ━━━ */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 mb-5 shadow-lg">
            <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
              <Gift size={18} className="animate-bounce" />
              <span className="font-bold">Welcome Bonus:</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                5 EXTRA Leads FREE! ✓
              </span>
            </div>
          </div>

          {/* ━━━ Header Text ━━━ */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              Fresh Leads, Daily Delivery
            </h2>
            <p className="text-sm text-slate-500">
              100% Exclusive • Verified Numbers • Real-time Alerts
            </p>
          </div>

          {/* ━━━ Tab Switcher ━━━ */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-1 rounded-xl shadow-md border border-slate-200 inline-flex w-full max-w-xs">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === 'monthly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Clock size={16} />
                Monthly
              </button>
              <button
                onClick={() => setActiveTab('boost')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === 'boost'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Zap size={16} />
                7-Day Boost
              </button>
            </div>
          </div>

          {/* ━━━ Plan Cards ━━━ */}
          <div className="space-y-4">
            {currentPlans.map((plan) => {
              const PlanIcon = plan.icon;
              
              return (
                <div
                  key={plan.id}
                  className={`bg-gradient-to-br ${plan.bgGradient} rounded-2xl border-2 ${plan.borderColor} p-4 relative transition-all duration-300 ${
                    plan.highlight 
                      ? 'shadow-xl ring-2 ring-opacity-50 ' + (activeTab === 'monthly' ? 'ring-blue-400' : 'ring-orange-400')
                      : 'shadow-sm'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-2.5 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black text-white shadow-md ${
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

                  <div className="flex gap-4">
                    {/* Left: Icon + Info */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        activeTab === 'monthly' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        <PlanIcon size={28} />
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                          <p className="text-xs text-slate-500">{plan.subtitle}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900">₹{plan.price}</div>
                          <div className="text-xs text-slate-500">{plan.duration} days</div>
                        </div>
                      </div>

                      {/* Key Stats */}
                      <div className="flex flex-wrap gap-2 mt-3 mb-3">
                        <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-500">Daily: </span>
                          <span className={`text-sm font-bold ${activeTab === 'monthly' ? 'text-blue-600' : 'text-orange-600'}`}>
                            {plan.dailyLeads} leads
                          </span>
                        </div>
                        <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-500">₹</span>
                          <span className="text-sm font-bold text-green-600">
                            {plan.perDay.toFixed(0)}/day
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg ${plan.priorityColor} text-white`}>
                          <span className="text-xs font-bold">
                            {plan.priority} Priority
                          </span>
                        </div>
                      </div>

                      {/* Features Preview */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white/60 px-2 py-0.5 rounded">
                            <Check size={10} className="text-green-500" />
                            {feature.split(' ').slice(0, 3).join(' ')}
                          </span>
                        ))}
                        {plan.features.length > 3 && (
                          <span className="text-xs text-slate-400">+{plan.features.length - 3} more</span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={loading === plan.id}
                        className={`w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 ${plan.buttonColor}`}
                      >
                        {loading === plan.id ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          <>
                            Get Started <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ━━━ Why Choose Us ━━━ */}
          <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 text-center">
              Why LeadFlow is Different
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">100% Exclusive</p>
                  <p className="text-[10px] text-slate-500">Only YOU get this lead</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Verified Numbers</p>
                  <p className="text-[10px] text-slate-500">95%+ valid contacts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Instant Alerts</p>
                  <p className="text-[10px] text-slate-500">Real-time WhatsApp</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={16} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Replacement</p>
                  <p className="text-[10px] text-slate-500">Invalid? We replace!</p>
                </div>
              </div>
            </div>
          </div>

          {/* ━━━ Testimonial ━━━ */}
          <div className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl">
                👨
              </div>
              <div>
                <p className="text-sm italic">"15 din mein 4 joining ki. Best investment!"</p>
                <p className="text-xs opacity-80 mt-1">- Rahul K., Ludhiana ⭐⭐⭐⭐⭐</p>
              </div>
            </div>
          </div>

          {/* ━━━ Trust Badges ━━━ */}
          <div className="mt-4 flex justify-center gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900">10,000+</div>
              <div className="text-[10px] text-slate-500">Leads Delivered</div>
            </div>
            <div className="w-px bg-slate-300"></div>
            <div>
              <div className="text-lg font-bold text-slate-900">500+</div>
              <div className="text-[10px] text-slate-500">Happy Users</div>
            </div>
            <div className="w-px bg-slate-300"></div>
            <div>
              <div className="text-lg font-bold text-slate-900">4.8⭐</div>
              <div className="text-[10px] text-slate-500">Rating</div>
            </div>
          </div>

        </div>
      </div>

      {/* ━━━ Bottom Bar (Mobile) ━━━ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-lg z-30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            🔒 Secure Payment via Razorpay
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
