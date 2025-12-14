// views/Subscription.tsx

export const Subscription = () => {
  // Plans array ko component ke ANDAR define karo
  const plans = [
    // ========================================
    // MONTHLY PLANS (Stable Growth)
    // ========================================
    {
      id: 'new_member',
      type: 'monthly', 
      name: 'New Member',
      price: 1000,
      duration: '30 Days', 
      dailyLimit: 2, 
      totalLeads: '60+ Leads',
      highlight: 'Consistent Daily Flow', 
      features: [
        '60+ Monthly Leads', 
        '2 Leads Daily Drop', 
        '✅ Housewife Target',
        '✅ Student Target',
        '✅ Job Seeker Leads',
        'Replacement Guarantee', 
        'WhatsApp Support'
      ],
      color: 'bg-white border-slate-200', 
      btnColor: 'bg-slate-800 text-white hover:bg-slate-900', 
      badge: null
    },
    {
      id: 'supervisor',
      type: 'monthly', 
      name: 'Supervisor Plan', 
      price: 2000,
      duration: '30 Days', 
      dailyLimit: 4,
      totalLeads: '130+ Leads',
      highlight: 'Steady Team Building', 
      features: [
        '130+ Monthly Leads',
        '4-5 Daily Lead Drop',
        '✅ All Target Categories',
        '✅ Priority Distribution',
        'Fast Replacement', 
        'Calling Script Included',
        '📊 Monthly Analytics'
      ],
      color: 'bg-blue-50 border-blue-500 ring-2 ring-blue-500', 
      btnColor: 'bg-blue-600 text-white hover:bg-blue-700', 
      badge: 'CONSISTENT'
    },
    {
      id: 'manager',
      type: 'monthly',
      name: 'Manager Plan',
      price: 3500,
      duration: '30 Days',
      dailyLimit: 7,
      totalLeads: '200+ Leads',
      highlight: 'Long-term Growth',
      features: [
        '200+ Monthly Leads',
        '7 Daily Lead Guarantee',
        '✅ Premium Quality',
        '✅ Team Distribution',
        'Dedicated Support',
        '🎯 Custom Filters'
      ],
      color: 'bg-white border-slate-200',
      btnColor: 'bg-slate-800 text-white hover:bg-slate-900',
      badge: null
    },
    
    // ========================================
    // BOOST PACKS (Aggressive Campaign Mode)
    // ========================================
    {
      id: 'boost_a', 
      type: 'boost', 
      name: 'Fast Start Pack', 
      price: 999,
      duration: '7 Days ONLY', 
      dailyLimit: 10, 
      totalLeads: '70+ Leads',
      highlight: 'Quick Pipeline Fill', 
      features: [
        '70 Leads in 7 Days', 
        '10 Daily Lead Blast', 
        '⚡ High Speed Delivery',
        '✅ All Target Groups',
        'Perfect for: Campaign Mode',
        '🔥 Burn Budget Fast'
      ],
      color: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400', 
      btnColor: 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg', 
      badge: 'SPEED'
    },
    {
      id: 'boost_b', 
      type: 'boost', 
      name: 'Beast Mode Pack', 
      price: 1499,
      duration: '7 Days ONLY',
      dailyLimit: 17,
      totalLeads: '120+ Leads',
      highlight: 'Instant Team Building',
      features: [
        '120 Leads in 7 Days',
        '15-18 Daily Lead Drop',
        '🔥 High Intent Audience',
        '✅ Premium Quality',
        'Perfect for: Aggressive Growth',
        '⚡ Maximum Momentum'
      ],
      color: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-500 ring-2 ring-orange-500',
      btnColor: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg',
      badge: 'MOST POPULAR'
    },
    {
      id: 'boost_c',
      type: 'boost',
      name: 'Max Blast Pack',
      price: 1999,
      duration: '7 Days ONLY',
      dailyLimit: 26,
      totalLeads: '180+ Leads',
      highlight: 'Nuclear Speed',
      features: [
        '180 Leads in 7 Days',
        '25-28 Daily Lead Bomb',
        '💣 Maximum Blast Mode',
        '✅ Exclusive Quality',
        'For: Managers/Supervisors',
        '🚀 Fastest Pipeline Fill'
      ],
      color: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-500',
      btnColor: 'bg-red-600 text-white hover:bg-red-700 shadow-lg',
      badge: 'BEAST'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-slate-600">
            Select the perfect plan for your business needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`rounded-xl p-6 ${plan.color} relative`}>
              {plan.badge && (
                <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {plan.badge}
                </span>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-4">
                ₹{plan.price}
                <span className="text-sm text-slate-600">/{plan.duration}</span>
              </div>
              
              <p className="text-slate-600 mb-4">{plan.highlight}</p>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-slate-700">
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-3 rounded-lg font-semibold ${plan.btnColor}`}>
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
