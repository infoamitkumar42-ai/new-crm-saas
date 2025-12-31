import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Monitor, Clock, CheckCircle, Zap } from 'lucide-react';

export const ShippingPolicy = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Truck size={20} className="text-orange-600" />
            <span className="font-bold text-slate-800">Shipping & Delivery Policy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">Shipping and Delivery Policy</h1>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-8 text-slate-600 leading-relaxed">
            
            {/* Digital Service Notice */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Monitor size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg mb-1">100% Digital Service</h3>
                <p className="text-blue-700">
                  Since LeadFlow CRM deals in <strong>digital services</strong> (Leads and Software access), there is <strong>no physical shipping</strong> involved.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">1. Mode of Delivery</h2>
              </div>
              <p>
                All services are delivered digitally via:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="font-semibold text-slate-800">LeadFlow Dashboard</span>
                  </div>
                  <p className="text-sm text-slate-500">Your personal CRM with all leads</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="font-semibold text-slate-800">Google Sheet</span>
                  </div>
                  <p className="text-sm text-slate-500">Linked spreadsheet for easy access</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                You will receive login credentials via email immediately after purchase.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">2. Delivery Timeline</h2>
              </div>
              
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-green-600" />
                    <span className="font-bold text-green-800">Account Activation</span>
                  </div>
                  <p className="text-green-700">
                    <strong>Instant activation</strong> immediately after successful payment.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-blue-600" />
                    <span className="font-bold text-blue-800">Lead Delivery</span>
                  </div>
                  <p className="text-blue-700">
                    Fresh leads are distributed daily between <strong>8:00 AM to 10:00 PM IST</strong>.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-amber-600" />
                    <span className="font-bold text-amber-800">Backlog Policy</span>
                  </div>
                  <p className="text-amber-700">
                    If leads are not delivered on a specific day due to ad constraints, they will be <strong>carried over to the next day</strong> automatically.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">3. Proof of Delivery</h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p>
                  The appearance of lead details (<strong>Name, Phone Number, City</strong>) in your specific CRM dashboard constitutes <strong>successful delivery</strong> of the service.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                For delivery-related queries, contact{' '}
                <a href="mailto:support@leadflowcrm.in" className="text-blue-600 hover:underline">
                  support@leadflowcrm.in
                </a>
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
