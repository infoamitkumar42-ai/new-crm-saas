import React, { useEffect } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const ContactUs = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-8 text-slate-900 text-center">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Email Us</h3>
                <p className="text-slate-600">support@leadflowcrm.in</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">WhatsApp</h3>
                <p className="text-slate-600">+91 7009064038</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">address</h3>
                <p className="text-slate-600">Zirakpur, Punjab 140603</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Support Hours</h3>
                <p className="text-slate-600">Mon-Sat, 10 AM - 6 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
