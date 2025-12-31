import React, { useEffect } from 'react';

const TermsOfService = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Terms and Conditions</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">1. Service Description</h2>
            <p>LeadFlow provides a CRM dashboard and digital leads generation service for network marketers. We generate leads via social media ads targeted at specific interests (Work from Home/Business Opportunity).</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">2. Lead Quality & Conversion</h2>
            <p>While we target high-intent audiences, we do not guarantee sales or conversions. Success depends on your communication skills and follow-up process. We are a lead provider, not a sales guarantee service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Usage Policy</h2>
            <p>The leads provided are for your personal business use only. Reselling, sharing, or distributing these leads to others is strictly prohibited and will result in an immediate account ban without refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">4. Delivery</h2>
            <p>Leads are delivered daily to your dashboard and Google Sheet as per your active plan limits. Delivery timings are generally between 8:00 AM to 10:00 PM IST.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">5. Modifications</h2>
            <p>We reserve the right to modify prices, plan features, or these terms at any time. Continued use of the service constitutes acceptance of these changes.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
