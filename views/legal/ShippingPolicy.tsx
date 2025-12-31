import React, { useEffect } from 'react';

export const ShippingPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Shipping & Delivery Policy</h1>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p className="bg-blue-50 p-4 rounded-lg text-blue-800 font-medium">
            LeadFlow is a digital service. No physical shipping involved.
          </p>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">1. Mode of Delivery</h2>
            <p>All services delivered via Dashboard and Google Sheet.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">2. Delivery Timeline</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Activation:</strong> Instant after payment.</li>
              <li><strong>Lead Delivery:</strong> Daily 8:00 AM to 10:00 PM IST.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Proof of Delivery</h2>
            <p>Lead details appearing in your CRM constitutes successful delivery.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
