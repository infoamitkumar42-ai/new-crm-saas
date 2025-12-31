import React, { useEffect } from 'react';

export const PrivacyPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">1. Information Collection</h2>
            <p>We collect Name, Email, Phone Number, and Payment details via Razorpay.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">2. Lead Exclusivity</h2>
            <p>Leads assigned to you are exclusively yours.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Data Usage</h2>
            <p>Your data is used only to provide services and send operational alerts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">4. Third-Party Sharing</h2>
            <p>We do not sell your personal information to others.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">5. Security</h2>
            <p>We use industry-standard encryption to protect your data.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
