import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageCircle, Building } from 'lucide-react';

export const ContactUs = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const WHATSAPP_NUMBER = "917009064038";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-blue-600" />
            <span className="font-bold text-slate-800">Contact Us</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-white text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-blue-100">We are here to help you grow your business</p>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            
            {/* Contact Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* Email */}
              <a 
                href="mailto:support@leadflowcrm.in"
                className="group bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center transition-colors">
                    <Mail size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Email Us</h3>
                    <p className="text-blue-600 font-medium">support@leadflowcrm.in</p>
                    <p className="text-slate-500 text-sm mt-1">Response within 24 hours</p>
                  </div>
                </div>
              </a>

              {/* WhatsApp */}
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi,%20I%20need%20help%20with%20LeadFlow%20CRM`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center transition-colors">
                    <Phone size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Call / WhatsApp</h3>
                    <p className="text-green-600 font-medium">+91 7009064038</p>
                    <p className="text-slate-500 text-sm mt-1">Quick response on WhatsApp</p>
                  </div>
                </div>
              </a>

              {/* Address */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <MapPin size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Operating Address</h3>
                    <p className="text-slate-600">
                      LeadFlow CRM<br />
                      Bhabat, Zirakpur<br />
                      Punjab - 140603
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Hours */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Support Hours</h3>
                    <p className="text-slate-600">
                      Monday to Saturday<br />
                      <strong>10:00 AM - 6:00 PM IST</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building size={20} className="text-slate-600" />
                <h3 className="font-bold text-slate-800">Business Information</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Business Name:</span>
                  <p className="font-medium text-slate-800">LeadFlow CRM</p>
                </div>
                <div>
                  <span className="text-slate-500">Operated By:</span>
                  <p className="font-medium text-slate-800">Amit Kumar Tamta</p>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="mt-8 text-center">
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi,%20I%20have%20a%20question%20about%20LeadFlow%20CRM`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                <MessageCircle size={24} />
                Chat on WhatsApp
              </a>
              <p className="text-slate-500 text-sm mt-3">
                Fastest way to get support
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
