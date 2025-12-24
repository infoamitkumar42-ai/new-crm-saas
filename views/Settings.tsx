import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, MapPin, User as UserIcon, CheckCircle, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { usePushNotification } from '../hooks/usePushNotification'; // Import the hook

interface SettingsProps {
  user: any;
  onUpdate: (filters: any) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Profile State
  const [name, setName] = useState(user.name || '');
  const [whatsapp, setWhatsapp] = useState(user.phone || '');
  const [selectedState, setSelectedState] = useState<string>(user.filters?.states?.[0] || '');

  // Push Notification Hook
  const { subscribe, isSubscribed, testNotification, permission } = usePushNotification();

  const availableStates = [
    'Punjab', 'Haryana', 'Delhi', 'Maharashtra', 'Himachal Pradesh', 
    'Uttarakhand', 'Uttar Pradesh', 'Rajasthan', 'Gujarat', 
    'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Bihar', 
    'Madhya Pradesh', 'Kerala', 'Chandigarh'
  ];

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const newFilters = {
        ...user.filters,
        states: selectedState ? [selectedState] : [],
        cities: [],
        pan_india: selectedState === ''
      };

      const { error } = await supabase
        .from('users')
        .update({ 
            name: name,
            phone: whatsapp,
            filters: newFilters,
            updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) throw error;
      await onUpdate(newFilters);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        {success && <div className="text-green-600 bg-green-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><CheckCircle size={20} /> Saved!</div>}
      </div>

      {/* 🔔 NOTIFICATION SETTINGS (The Missing Piece) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 ring-2 ring-blue-500 ring-offset-2">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Bell className="text-blue-600" /> Mobile Notifications
        </h3>
        <p className="text-sm text-slate-500 mb-6">Enable this on your phone to get instant "TING" alerts even when phone is locked.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {!isSubscribed ? (
            <button 
              onClick={subscribe}
              className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <Bell size={20} /> Enable Mobile Alerts
            </button>
          ) : (
            <div className="flex-1 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle size={20} /> Alerts are Active
              </div>
              <button onClick={testNotification} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">Test Push</button>
            </div>
          )}
        </div>
        {permission === 'denied' && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <BellOff size={12} /> Notification permission denied. Please reset Chrome settings.
          </p>
        )}
      </div>

      {/* 📍 TARGETING SECTION */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MapPin className="text-blue-600" /> Lead Targeting
        </h3>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full p-4 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
        >
          <option value="">🌍 All India (Pan-India Leads)</option>
          {availableStates.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </div>

      {/* 👤 PROFILE SECTION */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <UserIcon className="text-blue-600" /> Personal Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl" placeholder="Full Name" />
          <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl" placeholder="WhatsApp Number" />
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800">
        {loading ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  );
};
