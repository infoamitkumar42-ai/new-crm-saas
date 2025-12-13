import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Users, Crown } from 'lucide-react';

interface UpsellModalProps {
  user: {
    payment_status: string;
    daily_limit: number;
  };
}

export const UpsellModal: React.FC<UpsellModalProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Show modal only if user is inactive AND hasn't seen it recently
    const shouldShow = 
      user.payment_status === 'inactive' && 
      !hasShown && 
      !localStorage.getItem('upsell_dismissed'); 

    if (shouldShow) {
      // Show after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, hasShown]);

  const dismissForever = () => {
    // Dismiss for 24 hours (Logic can be adjusted)
    localStorage.setItem('upsell_dismissed', Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-in zoom-in slide-in-from-bottom-4">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-blue-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Missing Out on Leads?
        </h2>
        <p className="text-center text-slate-600 mb-6">
          You're currently on the <strong>Free Plan</strong> with <strong>0 daily leads</strong>. 
          Upgrade now to start receiving quality leads every day!
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
            <Crown className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">Get 2-12 qualified leads daily</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">Target your perfect audience</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/subscription'}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            View Plans & Pricing
          </button>
          <button 
            onClick={dismissForever}
            className="w-full text-slate-500 text-sm hover:text-slate-700"
          >
            Don't show this again today
          </button>
        </div>
      </div>
    </div>
  );
};
