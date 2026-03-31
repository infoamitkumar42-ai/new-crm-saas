import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export const TermsOfService = () => {
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
            <FileText size={20} className="text-blue-600" />
            <span className="font-bold text-slate-800">Terms and Conditions</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">Terms and Conditions</h1>
            <p className="text-blue-100 mt-2">Last Updated: {lastUpdated}</p>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-8 text-slate-600 leading-relaxed">
            <p className="text-lg">
              Welcome to <strong className="text-slate-800">LeadFlow CRM</strong>. By purchasing our services, you agree to the following terms:
            </p>

            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">1</span>
                <h2 className="text-xl font-bold text-slate-800">Service Description</h2>
              </div>
              <p className="pl-11">
                LeadFlow provides a CRM dashboard and digital leads generation service for network marketers. We generate leads via social media ads targeted at specific interests (Work from Home / Business Opportunity).
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">2</span>
                <h2 className="text-xl font-bold text-slate-800">Lead Quality & Conversion</h2>
              </div>
              <div className="pl-11">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800">
                    <strong>⚠️ Important:</strong> While we target high-intent audiences, we <strong>do not guarantee sales or conversions</strong>. Success depends on your communication skills and follow-up process. We are a lead provider, not a sales guarantee service.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">3</span>
                <h2 className="text-xl font-bold text-slate-800">Usage Policy</h2>
              </div>
              <div className="pl-11">
                <p>The leads provided are for your <strong>personal business use only</strong>.</p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
                  <p className="text-red-700">
                    🚫 <strong>Reselling, sharing, or distributing</strong> these leads to others is strictly prohibited and will result in an <strong>immediate account ban without refund</strong>.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">4</span>
                <h2 className="text-xl font-bold text-slate-800">Delivery</h2>
              </div>
              <p className="pl-11">
                Leads are delivered daily to your dashboard and Google Sheet as per your active plan limits. Delivery timings are generally between <strong>8:00 AM to 10:00 PM IST</strong>.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">5</span>
                <h2 className="text-xl font-bold text-slate-800">Liability</h2>
              </div>
              <p className="pl-11">
                LeadFlow is <strong>not responsible</strong> for any business loss or lack of conversions. We are a data and tool provider only.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">6</span>
                <h2 className="text-xl font-bold text-slate-800">Modifications</h2>
              </div>
              <p className="pl-11">
                We reserve the right to modify prices, plan features, or these terms at any time with prior notice. Continued use of the service constitutes acceptance of these changes.
              </p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                For questions regarding these terms, contact us at{' '}
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
