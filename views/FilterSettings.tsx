import React, { useState } from 'react';
import { User, FilterConfig } from '../types';

interface FilterSettingsProps {
  user: User;
  onUpdate: (filters: FilterConfig, dailyLimit?: number) => Promise<void>;
}

export const FilterSettings: React.FC<FilterSettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string>(user.filters?.cities?.join(', ') || '');
  const [minAge, setMinAge] = useState<number>(user.filters?.age_min || 18);
  const [maxAge, setMaxAge] = useState<number>(user.filters?.age_max || 60);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Split by comma
      const cityArray = cities.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      const newFilters: FilterConfig = {
        ...user.filters,
        cities: cityArray,
        age_min: minAge,
        age_max: maxAge
      };

      await onUpdate(newFilters);
      alert('Targeting preferences updated! ✅');
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Audience Targeting</h2>
        <p className="text-slate-500">Define who you want to pitch to.</p>
      </div>

      {/* 1. Location Logic Explanation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          📍 Location Preferences
        </h3>
        
        <div className="mb-4 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
          <strong>How matching works:</strong> 
          <ul className="list-disc ml-4 mt-1 space-y-1">
            <li>Our system uses <strong>Smart Matching</strong>.</li>
            <li>If you type <strong>"Punjab"</strong>, we will send leads from <em>Ludhiana, Amritsar, Chandigarh</em>, etc.</li>
            <li>If you type <strong>"Mumbai"</strong>, we will match <em>Mumbai, Navi Mumbai, Thane</em>.</li>
            <li>You can enter multiple locations separated by commas.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Enter States or Cities (Comma separated)
          </label>
          <textarea
            rows={3}
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            placeholder="e.g. Maharashtra, Delhi, Bangalore, Punjab"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none"
          />
          <p className="text-xs text-slate-400">
            *Leave completely empty to receive leads from <strong>All India (Fastest Delivery)</strong>.
          </p>
        </div>
      </div>

      {/* 2. Age Range */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">👥 Age Demographics</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Age</label>
            <input
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Age</label>
            <input
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 shadow-lg shadow-brand-100 transition-all w-full md:w-auto"
        >
          {loading ? 'Saving Preferences...' : 'Save Targeting'}
        </button>
      </div>

    </div>
  );
};
