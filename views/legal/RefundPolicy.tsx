import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, XCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export const RefundPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const lastUpdated = "January 2025";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-purple-600" />
            <span className="font-bold text-slate-800">Cancellation & Refund Policy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">Cancellation and Refund Policy</h1>
            <p className="text-purple-200 mt-2">Last Updated: {lastUpdated}</p>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-8 text-slate-600 leading-relaxed">
            
            {/* Intro Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
              <p className="text-amber-800">
                At LeadFlow CRM, we invest upfront in advertising costs to generate real-time leads for you. Due to the nature of digital goods and real-time ad spends, we follow a <strong>strict refund policy</strong>.
              </p>
            </div>

            {/* Section 1 - No Refunds */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <XCircle size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">1. No Refunds After Lead Delivery Starts</h2>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <p className="text-red-800">
                  Once your account is active and you have started receiving leads (<strong>even a single lead</strong>), <strong>no refunds will be issued</strong>.
                </p>
                <p className="text-red-700 mt-2 text-sm">
                  The budget allocated for your plan is immediately utilized in ad campaigns and cannot be recovered.
                </p>
              </div>
            </section>

            {/* Section 2 - Replacement Guarantee */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <RefreshCw size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">2. 100% Replacement Guarantee</h2>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={24} className="text-green-600" />
                  <span className="text-xl font-bold text-green-800">We Guarantee Value for Money!</span>
                </div>
                <p className="text-green-700 mb-4">
                  Instead of refunds, we offer a <strong>Replacement Guarantee</strong>:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-green-800">If a lead number is <strong>invalid, disconnected, or wrong number</strong>, we will replace it for <strong>FREE</strong>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock size={18} className="text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-green-800">You must report the invalid lead via the dashboard within <strong>24 hours</strong> of receiving it.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 - Exceptions */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">3. Refund Eligibility (Rare Exceptions)</h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="mb-3">A refund is applicable <strong>ONLY</strong> in the following rare case:</p>
                <div className="bg-white border border-slate-300 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>You purchased a plan but <strong>did not receive any leads for 72 hours</strong> after activation due to a system error on our end.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>In such cases, a <strong>full refund</strong> will be processed within <strong>5-7 business days</strong>.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 - Cancellation */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <XCircle size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">4. Cancellation</h2>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                <ul className="space-y-3 text-orange-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                    <span>You can stop your subscription renewal at any time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                    <span>However, the current active plan will continue until the lead limit is exhausted.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                    <span><strong>No partial refunds</strong> are provided for unused leads.</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                For refund queries, email{' '}
                <a href="mailto:support@leadflowcrm.in" className="text-blue-600 hover:underline">
                  support@leadflowcrm.in
                </a>{' '}
                with your registered phone number.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
