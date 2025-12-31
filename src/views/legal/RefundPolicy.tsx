import React, { useEffect } from 'react';

export const RefundPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Cancellation and Refund Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p>At LeadFlow CRM, we invest upfront in advertising costs to generate real-time leads for you. Due to the nature of digital goods and real-time ad spends, we follow a strict refund policy.</p>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">1. No Refunds After Lead Delivery Starts</h2>
            <p>Once your account is active and you have started receiving leads (even a single lead), <strong>no refunds</strong> will be issued. The budget allocated for your plan is immediately utilized in ad campaigns.</p>
          </section>
          
          <section className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h2 className="text-xl font-bold mb-2 text-green-800">2. 100% Replacement Guarantee</h2>
            <p className="text-green-700">Instead of refunds, we offer a <strong>Replacement Guarantee</strong> to ensure value for money:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-green-700">
              <li>If a lead number is <strong>invalid, disconnected, or wrong number</strong>, we will replace it for free.</li>
              <li>You must report the invalid lead via the dashboard within <strong>24 hours</strong> of receiving it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Refund Eligibility (Exceptions Only)</h2>
            <p>A refund is applicable <strong>ONLY</strong> in the following rare case:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You purchased a plan but <strong>did not receive any leads</strong> for 72 hours after activation due to a system error on our end.</li>
              <li>In such cases, a full refund will be processed within 5-7 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">4. Cancellation</h2>
            <p>You can stop your subscription renewal at any time. However, the current active plan will continue until the lead limit is exhausted. No partial refunds are provided for unused leads.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
