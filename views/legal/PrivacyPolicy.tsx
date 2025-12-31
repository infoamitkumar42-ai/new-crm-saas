import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Users, Server } from 'lucide-react';

export const PrivacyPolicy = () => {
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
            <Shield size={20} className="text-green-600" />
            <span className="font-bold text-slate-800">Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
            <p className="text-green-100 mt-2">Last Updated: {lastUpdated}</p>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-8 text-slate-600 leading-relaxed">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <Lock className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <p className="text-green-800">
                At <strong>LeadFlow CRM</strong>, we prioritize the privacy of our users and the leads generated. Your data is safe with us.
              </p>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">1. Information Collection</h2>
              </div>
              <p className="pl-13 ml-13">
                We collect your <strong>Name, Email, Phone Number</strong>, and <strong>Payment details</strong> (processed securely via Razorpay) solely to create your account and provide services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">2. Lead Exclusivity</h2>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 ml-13">
                <p className="text-purple-800">
                  ✅ The leads assigned to you are <strong>exclusively yours</strong>. We do not sell the same lead to multiple users simultaneously to ensure high quality and exclusivity.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <Eye size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">3. Data Usage</h2>
              </div>
              <p className="ml-13">
                Your data is used only to:
              </p>
              <ul className="list-disc pl-6 ml-13 space-y-1">
                <li>Provide the subscribed services</li>
                <li>Manage your account</li>
                <li>Send operational alerts (via WhatsApp/Email)</li>
              </ul>
              <p className="ml-13 text-slate-500 text-sm">
                We do <strong>not</strong> use your personal data for ad targeting or marketing to third parties.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">4. Third-Party Sharing</h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 ml-13">
                <p>
                  🔒 We do <strong>not sell, trade, or rent</strong> your personal identification information to others. Data is shared only with trusted partners (like Razorpay) necessary for service delivery.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                  <Server size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">5. Security</h2>
              </div>
              <p className="ml-13">
                We use <strong>industry-standard encryption</strong> and secure servers to protect your data on our dashboard. All payment transactions are processed through Razorpay's secure payment gateway.
              </p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                For privacy-related queries, email us at{' '}
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
