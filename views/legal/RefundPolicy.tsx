import React, { useEffect } from 'react';

export const RefundPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Refund Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">1. No Refunds After Delivery</h2>
            <p>Once leads are delivered, no refunds will be issued.</p>
          </section>
          
          <section className="bg-green-50 p-4 rounded-xl border border-green-100">
            <h2 className="text-xl font-bold mb-2 text-green-800">2. Replacement Guarantee</h2>
            <p className="text-green-700">Invalid or wrong numbers will be replaced free within 24 hours.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">3. Exceptions</h2>
            <p>Full refund only if no leads delivered for 72 hours due to system error.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2 text-slate-800">4. Cancellation</h2>
            <p>You can stop renewal anytime. No partial refunds for unused leads.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
