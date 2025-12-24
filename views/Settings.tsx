import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types'; // Ensure types exist or define them below
import { Save, MapPin, User as UserIcon, CheckCircle, AlertTriangle } from 'lucide-react';

// Temporary type fix if types file is missing
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

  // Filter State (State Selection Logic)
  const [selectedState, setSelectedState] = useState<string>(
    user.filters?.states?.[0] || ''
  );

  // Supported States List (Same as Database)
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
      // Logic: If State selected -> Use State. Else -> Pan India.
      const newFilters = {
        ...user.filters,
        states: selectedState ? [selectedState] : [], // Single state for now
        cities: [], // Clear specific cities to avoid conflict
        pan_india: selectedState === '' // True if no state selected
      };

      // 1. Update Supabase
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

      // 2. Update Local State
      await onUpdate(newFilters);
      setSuccess(true);
      
      // Auto hide success message
      setTimeout(() => setSuccess(false), 3000);

    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500">Manage your profile and targeting preferences.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-fade-in">
            <CheckCircle size={20} /> Saved!
          </div>
        )}
      </div>

      {/* 📍 TARGETING SECTION (Main Feature) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MapPin className="text-blue-600" /> Lead Targeting
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Preferred State
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700"
              >
                <option value="">🌍 All India (Pan-India Leads)</option>
                <option disabled>──────────</option>
                {availableStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
            
            {/* Context Message */}
            <div className={`mt-4 p-4 rounded-lg text-sm border ${selectedState ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {selectedState ? (
                <div className="flex gap-2">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Great choice!</strong> You will receive leads from <strong>ALL cities</strong> in {selectedState}.
                    <br/><span className="opacity-80 text-xs">(e.g., if Punjab: Ludhiana, Amritsar, Moga, etc. included automatically)</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Pan-India Mode:</strong> You will receive leads from <strong>ANYWHERE</strong> in India.
                    <br/><span className="opacity-80 text-xs">Select a state above if you want local leads only.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 👤 PROFILE SECTION */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <UserIcon className="text-blue-600" /> Personal Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp Number</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 9876543210"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 active:scale-[0.99] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              <Save size={20} /> Save Changes
            </>
          )}
        </button>
      </div>

    </div>
  );
};
