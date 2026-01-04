/**
 * FILTER SETTINGS - 100% CRASH PROOF VERSION
 * No .includes() without safety check
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MapPin, Users, Check, Save, AlertCircle, ArrowLeft,
  ChevronDown, Globe, Loader2, X, RefreshCw
} from 'lucide-react';

// ============================================================
// SAFE HELPER - NEVER CRASHES
// ============================================================
const safeArray = (val: unknown): string[] => {
  if (!val) return [];
  if (!Array.isArray(val)) return [];
  return val.filter((item): item is string => typeof item === 'string');
};

const safeIncludes = (arr: unknown, item: string): boolean => {
  const safe = safeArray(arr);
  return safe.includes(item);
};

// ============================================================
// CONSTANTS
// ============================================================
const STATE_CITIES: Record<string, string[]> = {
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Moga'],
  'Chandigarh': ['Chandigarh'],
  'Haryana': ['Panchkula', 'Gurugram', 'Faridabad', 'Ambala', 'Karnal', 'Panipat'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Solan', 'Mandi'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Mussoorie', 'Haldwani'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai']
};

const STATES = Object.keys(STATE_CITIES);

// ============================================================
// TYPES
// ============================================================
interface Filters {
  pan_india: boolean;
  states: string[];
  cities: string[];
  gender: string;
}

const DEFAULT_FILTERS: Filters = {
  pan_india: true,
  states: [],
  cities: [],
  gender: 'all'
};

// ============================================================
// COMPONENT
// ============================================================
export const FilterSettings: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        const { data } = await supabase
          .from('users')
          .select('filters')
          .eq('id', user.id)
          .single();
        
        if (data?.filters) {
          // SAFE PARSE - Can NEVER crash
          setFilters({
            pan_india: data.filters.pan_india === true || data.filters.panIndia === true,
            states: safeArray(data.filters.states),
            cities: safeArray(data.filters.cities),
            gender: typeof data.filters.gender === 'string' ? data.filters.gender : 'all'
          });
        }
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ============================================================
  // HANDLERS - ALL SAFE
  // ============================================================
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    
    try {
      await supabase.from('users').update({ 
        filters,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleState = (state: string) => {
    const current = safeArray(filters.states);
    const isSelected = current.includes(state);
    
    const newStates = isSelected 
      ? current.filter(s => s !== state)
      : [...current, state];
    
    // Remove cities of deselected state
    const stateCities = STATE_CITIES[state] || [];
    const currentCities = safeArray(filters.cities);
    const newCities = isSelected
      ? currentCities.filter(c => !stateCities.includes(c))
      : currentCities;
    
    setFilters({
      ...filters,
      pan_india: false,
      states: newStates,
      cities: newCities
    });
  };

  const toggleCity = (city: string) => {
    const current = safeArray(filters.cities);
    const isSelected = current.includes(city);
    
    setFilters({
      ...filters,
      pan_india: false,
      cities: isSelected ? current.filter(c => c !== city) : [...current, city]
    });
  };

  // ============================================================
  // DERIVED VALUES - ALL SAFE
  // ============================================================
  const safeStates = safeArray(filters.states);
  const safeCities = safeArray(filters.cities);
  const isStateSelected = (s: string) => safeStates.includes(s);
  const isCitySelected = (c: string) => safeCities.includes(c);
  const getCityCount = (state: string) => {
    const cities = STATE_CITIES[state] || [];
    return safeCities.filter(c => cities.includes(c)).length;
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-bold text-lg">Target Audience</h1>
            <p className="text-xs text-slate-500">Configure lead preferences</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Alerts */}
        {saved && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex gap-2 items-center text-green-800">
            <Check size={18} /> Saved successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-2 items-center text-red-800">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Gender */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h2 className="font-bold mb-4 flex gap-2 items-center">
            <Users size={18} className="text-purple-600" /> Gender
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {['all', 'male', 'female'].map(g => (
              <button
                key={g}
                onClick={() => setFilters({ ...filters, gender: g })}
                className={`p-3 rounded-xl border-2 font-medium capitalize ${
                  filters.gender === g
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {g === 'all' ? '👥 All' : g === 'male' ? '👨 Male' : '👩 Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Pan India */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <button
            onClick={() => setFilters({ ...filters, pan_india: !filters.pan_india, states: [], cities: [] })}
            className={`w-full flex justify-between items-center p-4 rounded-xl border-2 ${
              filters.pan_india ? 'border-green-500 bg-green-50' : 'border-slate-200'
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className={`p-2 rounded-full ${filters.pan_india ? 'bg-green-200' : 'bg-slate-100'}`}>
                <Globe size={20} className={filters.pan_india ? 'text-green-700' : 'text-slate-400'} />
              </div>
              <div className="text-left">
                <p className="font-bold">All India (Pan India)</p>
                <p className="text-sm text-slate-500">Receive leads from anywhere</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              filters.pan_india ? 'border-green-500 bg-green-500' : 'border-slate-300'
            }`}>
              {filters.pan_india && <Check size={14} className="text-white" />}
            </div>
          </button>
        </div>

        {/* States & Cities */}
        {!filters.pan_india && (
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h2 className="font-bold flex gap-2 items-center">
              <MapPin size={18} className="text-blue-600" /> Select Locations
            </h2>

            {safeStates.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg text-blue-700 text-sm">
                {safeStates.length} state(s), {safeCities.length} city(ies) selected
              </div>
            )}

            <div className="space-y-3">
              {STATES.map(state => {
                const selected = isStateSelected(state);
                const isExpanded = expanded === state;
                const cities = STATE_CITIES[state] || [];
                const cityCount = getCityCount(state);

                return (
                  <div key={state} className={`border rounded-xl overflow-hidden ${
                    selected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
                  }`}>
                    <div className="p-4 flex justify-between items-center">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleState(state)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}>
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                        <span className={selected ? 'font-bold text-blue-700' : 'text-slate-700'}>
                          {state}
                        </span>
                        {cityCount > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {cityCount} cities
                          </span>
                        )}
                      </div>
                      {selected && (
                        <button 
                          onClick={() => setExpanded(isExpanded ? null : state)}
                          className="p-2 hover:bg-blue-100 rounded-lg"
                        >
                          <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {isExpanded && selected && (
                      <div className="px-4 pb-4 border-t border-blue-100">
                        <p className="text-xs text-slate-500 mt-3 mb-2">Select cities:</p>
                        <div className="flex flex-wrap gap-2">
                          {cities.map(city => (
                            <button
                              key={city}
                              onClick={() => toggleCity(city)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                                isCitySelected(city)
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white border-slate-200 hover:border-blue-300'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {safeStates.length === 0 && (
              <p className="text-center text-slate-400 py-4">Select at least one state</p>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
          <h3 className="font-bold text-indigo-900 mb-2">📋 Summary</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-indigo-700">Gender:</span> <span className="font-medium capitalize">{filters.gender}</span></p>
            <p><span className="text-indigo-700">Location:</span> <span className="font-medium">
              {filters.pan_india ? 'All India' : safeStates.length > 0 ? `${safeStates.length} states` : 'Not selected'}
            </span></p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <button
          onClick={handleSave}
          disabled={saving || (!filters.pan_india && safeStates.length === 0)}
          className="w-full max-w-2xl mx-auto block bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-indigo-700"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default FilterSettings;
