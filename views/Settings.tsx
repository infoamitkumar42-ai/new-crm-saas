import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { User, FilterCriteria } from '../types';

export const SettingsView: React.FC = () => {
  const { profile, refreshProfile, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<string>('');
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(60);

  // Load current filters when profile loads
  useEffect(() => {
    if (profile?.filters) {
      const f = profile.filters as FilterCriteria;
      setCities(f.cities ? f.cities.join(', ') : '');
      setMinAge(f.age_min || 18);
      setMaxAge(f.age_max || 60);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!profile) return;

      // Convert comma string to array (e.g., "Mumbai, Pune" -> ["Mumbai", "Pune"])
      const cityArray = cities.split(',').map(c => c.trim()).filter(c => c.length > 0);

      const newFilters = {
        ...profile.filters,
        cities: cityArray,
        age_min: minAge,
        age_max: maxAge
      };

      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ filters: newFilters })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      alert('Filters updated successfully! You will now receive leads for: ' + (cityArray.length ? cityArray.join(', ') : 'All Cities'));
    } catch (err) {
      alert('Failed to save settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Lead Filtering (Targeting)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Set your preferences. Our system will prioritize sending you leads matching these criteria.
        </p>

        <div className="space-y-4">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Cities (Comma separated)
            </label>
            <input
              type="text"
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              placeholder="e.g. Mumbai, Pune, Delhi"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">Leave empty to receive leads from ANY city.</p>
          </div>

          {/* Age Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Age</label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Age</label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Filters'}
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Account Settings</h2>
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium">{profile?.name}</p>
                <p className="text-slate-500 text-sm">{profile?.email}</p>
            </div>
            <button 
                onClick={signOut}
                className="text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
            >
                Sign Out
            </button>
        </div>
      </div>
    </div>
  );
};
