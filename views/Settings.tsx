import React, { useState, useEffect } from 'react';
import { User, FilterConfig } from '../types';
import { supabase } from '../supabaseClient';

interface SettingsProps {
  user: User;
  onUpdate: (filters: FilterConfig) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  // Filters State
  const [cities, setCities] = useState<string>(user.filters?.cities?.join(', ') || '');
  const [minAge, setMinAge] = useState<number>(user.filters?.age_min || 18);
  const [maxAge, setMaxAge] = useState<number>(user.filters?.age_max || 60);

  // Profile State
  const [name, setName] = useState(user.name);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Prepare Data
      const cityArray = cities.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      const newFilters: FilterConfig = {
        ...user.filters,
        cities: cityArray,
        age_min: minAge,
        age_max: maxAge
      };

      // 2. Update Supabase
      const { error } = await supabase
        .from('users')
        .update({ 
            name: name,
            filters: newFilters
        })
        .eq('id', user.id);

      if (error) throw error;

      // 3. Update App State
      await onUpdate(newFilters);
      alert('Settings saved successfully! ✅');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Account & Targeting</h2>
        <p className="text-slate-500">Manage your profile and lead preferences.</p>
      </div>

      {/* 1. Targeting Section (Sabse Important) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🎯 Lead Targeting (Filters)
        </h3>
        
        <div className="space-y-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Cities</label>
            <input
              type="text"
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              placeholder="e.g. Mumbai, Pune, Delhi (Comma separated)"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Leave empty to receive leads from <strong>All India</strong>.</p>
          </div>

          {/* Age Group */}
          <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* 2. Profile Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">👤 Profile Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Read Only)</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-slate-300 px-4 py-2 bg-slate-50 text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 shadow-lg shadow-brand-100 transition-all"
        >
          {loading ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

    </div>
  );
};
