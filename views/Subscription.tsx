// views/Subscription.tsx file ke sabse LAST me ye lines add karo:

export const Subscription = () => {
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
