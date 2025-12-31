import React, { useEffect } from 'react';

export const TermsOfService = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Terms and Conditions</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">1. Service Description</h2>
            <p>LeadFlow provides a CRM dashboard and digital leads generation service for network marketers.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">2. Lead Quality</h2>
            <p>We do not guarantee sales or conversions. Success depends on your follow-up process.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Usage Policy</h2>
            <p>Leads are for personal business use only. Reselling leads is prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">4. Delivery</h2>
            <p>Leads delivered daily between 8:00 AM to 10:00 PM IST.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">5. Modifications</h2>
            <p>We reserve the right to modify prices and terms at any time.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
