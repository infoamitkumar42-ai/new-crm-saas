import React, { useState } from 'react';
import { User, FilterConfig } from '../types';
import { MapPin, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface FilterSettingsProps {
  user: User;
  onUpdate: (filters: FilterConfig) => Promise<void>;
}

export const FilterSettings: React.FC<FilterSettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initial State from User Filters
  const [selectedState, setSelectedState] = useState<string>(
    user.filters?.states?.[0] || ''
  );

  // States List (Matches Database)
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
      // Logic: Save selected state
      const newFilters: FilterConfig = {
        ...user.filters,
        states: selectedState ? [selectedState] : [],
        cities: [], // Clear manual cities
        pan_india: selectedState === '',
        age_min: 18, // Default
        age_max: 60  // Default
      };

      await onUpdate(newFilters);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audience Targeting</h2>
          <p className="text-slate-500">Control where your leads come from.</p>
        </div>
        {success && (
          <div className="text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">
            <CheckCircle size={16} /> Saved!
          </div>
        )}
      </div>

      {/* 📍 State Selection Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="text-blue-600" /> Location Preference
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Preferred State
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
              >
                <option value="">🌍 All India (Fastest Delivery)</option>
                <option disabled>──────────</option>
                {availableStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className={`p-4 rounded-lg text-sm border flex gap-3 ${selectedState ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            {selectedState ? (
              <>
                <Info size={20} className="shrink-0 mt-0.5" />
                <div>
                  <strong>{selectedState} Selected:</strong> You will receive leads from ALL cities in {selectedState}.
                  <br/><span className="opacity-80 text-xs">System automatically maps cities like Ludhiana, Amritsar, etc.</span>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Pan-India Mode:</strong> You will receive leads from anywhere in India.
                  <br/><span className="opacity-80 text-xs">This ensures maximum lead volume and speed.</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-lg transition-all w-full md:w-auto"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

    </div>
  );
};
