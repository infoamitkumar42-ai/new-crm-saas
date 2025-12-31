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
            <p>We collect your Name, Email, Phone Number, and Payment details (processed securely via Razorpay) solely to create your account and provide services.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">2. Lead Exclusivity</h2>
            <p>The leads assigned to you are exclusively yours. We do not sell the same lead to multiple users simultaneously to ensure high quality and exclusivity.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Data Usage</h2>
            <p>Your data is used only to provide the services, manage your account, and send operational alerts (via WhatsApp/Email). We do not use your personal data for ad targeting.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">4. Third-Party Sharing</h2>
            <p>We do not sell, trade, or rent your personal identification information to others. Data is shared only with trusted partners (like Razorpay) necessary for service delivery.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">5. Security</h2>
            <p>We use industry-standard encryption and secure servers to protect your data on our dashboard.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
