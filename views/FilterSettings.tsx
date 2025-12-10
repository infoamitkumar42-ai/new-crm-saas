import React, { useState } from 'react';
import { User, FilterConfig } from '../types';

interface FilterSettingsProps {
  user: User;
  onUpdate: (filters: FilterConfig, dailyLimit: number) => Promise<void>;
}

export const FilterSettings: React.FC<FilterSettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  // State initialize karo user ke purane data se
  const [cities, setCities] = useState<string>(user.filters?.cities?.join(', ') || '');
  const [minAge, setMinAge] = useState<number>(user.filters?.age_min || 18);
  const [maxAge, setMaxAge] = useState<number>(user.filters?.age_max || 60);
  const [dailyLimit, setDailyLimit] = useState<number>(user.daily_limit || 10);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Comma separated cities ko Array mein convert karo (Ex: "Delhi, Mumbai" -> ["Delhi", "Mumbai"])
      const cityArray = cities.split(',').map(c => c.trim()).filter(c => c.length > 0);

      const newFilters: FilterConfig = {
        ...user.filters, // Purane filters retain karo
        cities: cityArray,
        age_min: minAge,
        age_max: maxAge
      };

      // App.tsx wala function call karo
      await onUpdate(newFilters, dailyLimit);
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Targeting & Filters</h2>
        <p className="text-slate-500 mt-1">
          Customize the type of leads you want to receive.
        </p>
      </div>

      {/* 1. Location Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          📍 Location Targeting
        </h3>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Target Cities (Comma separated)
          </label>
          <input
            type="text"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            placeholder="e.g. Mumbai, Pune, Delhi, Bangalore"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
          <p className="text-xs text-slate-400">
            *Leave empty to receive leads from <strong>All India</strong>.
          </p>
        </div>
      </div>

      {/* 2. Demographics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          👥 Demographics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Age</label>
            <input
              type="number"
              min="18"
              max="100"
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Age</label>
            <input
              type="number"
              min="18"
              max="100"
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* 3. Daily Limit */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          ⚡ Delivery Settings
        </h3>
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">
             Daily Lead Limit
           </label>
           <div className="flex items-center gap-4">
             <input
               type="range"
               min="1"
               max="100"
               value={dailyLimit}
               onChange={(e) => setDailyLimit(Number(e.target.value))}
               className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
             />
             <span className="text-lg font-bold text-brand-600 min-w-[3rem] text-center">
               {dailyLimit}
             </span>
           </div>
           <p className="text-xs text-slate-400 mt-2">
             You will not receive more than {dailyLimit} leads per day.
           </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-slate-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-slate-200"
        >
          {loading ? (
             <>
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
               Saving...
             </>
          ) : (
             'Save Preferences'
          )}
        </button>
      </div>

    </div>
  );
};
