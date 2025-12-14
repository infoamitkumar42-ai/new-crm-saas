// ... (File start is the same)
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
// 👇 MessageSquare (WhatsApp Icon) import kiya
import { Phone, MapPin, RefreshCw, FileSpreadsheet, MessageSquare } from 'lucide-react'; 

export const MemberDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
// ... (rest of the file is the same until getWhatsAppLink) ...

  // 👇 WhatsApp Link Generator Function
  const getWhatsAppLink = (phone: string, name: string) => {
      // Message URL Encode karna zaruri hai
      const message = encodeURIComponent(`Hi ${name}, mera naam ${profile?.name} hai. Maine aapki lead dekhi thi. Kya aap free hain abhi baat karne ke liye?`);
      
      // Indian numbers ke liye 91 prefix zaruri hai
      const cleanPhone = phone.replace(/\D/g, ''); 
      const prefixedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      return `https://wa.me/${prefixedPhone}?text=${message}`;
  };


  if (loading) return <div className="p-10 text-center text-slate-500">Loading your workspace...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
// ... (rest of the file is the same until the table body) ...

              <tbody className="divide-y divide-slate-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">{lead.name}</td>
                    <td className="p-4 text-slate-600 flex items-center gap-2">
                      
                        {/* 1. PHONE CALL BUTTON */}
                      <a href={`tel:${lead.phone}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Phone size={14} className="text-blue-500"/> 
                            {lead.phone}
                        </a>
                        
                        {/* 👇 2. WHATSAPP BUTTON (FINAL DESIGN - p-1.5, rounded-full) */}
                        <a 
                            href={getWhatsAppLink(lead.phone, lead.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            // 🟢 p-1.5 aur rounded-full class se yeh gol aur chhota dikhega
                            className="ml-3 p-1.5 bg-green-600 rounded-full hover:bg-green-700 transition-colors shadow-md"
                            title={`Message ${lead.name} on WhatsApp`}
                        >
                            {/* Icon ko white kiya for contrast */}
                            <MessageSquare size={16} className="text-white"/>
                        </a>
                    </td>
// ... (rest of the file is the same) ...
