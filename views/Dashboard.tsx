// Dashboard.tsx ke andar ye logic add karenge:

const calculateDaysLeft = (validUntil: string | null) => {
  if (!validUntil) return 0;
  const today = new Date();
  const expiry = new Date(validUntil);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const daysLeft = calculateDaysLeft(user.valid_until);

// Return ke andar sabse upar ye Banner lagayenge:
return (
  <div className="space-y-6">
    {/* 🔴 RENEWAL COUNTDOWN BANNER */}
    {daysLeft <= 3 && daysLeft > 0 && (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex justify-between items-center animate-pulse">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <p className="font-bold text-amber-800">Plan Expiring Soon!</p>
            <p className="text-sm text-amber-700">
              Only {daysLeft} days left. Renew now to avoid losing your lead flow.
            </p>
          </div>
        </div>
        <button 
          onClick={() => window.location.href='/subscription'}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700"
        >
          Renew Now
        </button>
      </div>
    )}

    {daysLeft <= 0 && user.payment_status === 'active' && (
       <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <p className="font-bold text-red-700">Plan Expired!</p>
          <p className="text-sm text-red-600">Please recharge immediately to resume services.</p>
       </div>
    )}
    
    {/* Baaki Dashboard Cards... */}
