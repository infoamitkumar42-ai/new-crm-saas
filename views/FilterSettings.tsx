/**
 * ============================================================
 * FILTER SETTINGS - CRASH-PROOF VERSION
 * ============================================================
 * Handles ALL edge cases to prevent "includes" error
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MapPin, Users, Check, Save, AlertCircle, ArrowLeft,
  ChevronDown, Globe, Filter, Loader2, X, RefreshCw
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
interface FilterData {
  pan_india: boolean;
  states: string[];
  cities: string[];
  gender: 'all' | 'male' | 'female';
}

// ============================================================
// DEFAULT FILTERS (Prevents undefined errors)
// ============================================================
const DEFAULT_FILTERS: FilterData = {
  pan_india: true,
  states: [],
  cities: [],
  gender: 'all'
};

// ============================================================
// STATE-CITY MAPPING
// ============================================================
const STATE_CITIES: Record<string, string[]> = {
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 
    'Mohali', 'Pathankot', 'Moga', 'Batala', 'Abohar', 'Khanna',
    'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur',
    'Kapurthala', 'Hoshiarpur', 'Faridkot', 'Sangrur', 'Gurdaspur'
  ],
  'Chandigarh': ['Chandigarh'],
  'Haryana': [
    'Panchkula', 'Gurugram', 'Gurgaon', 'Faridabad', 'Ambala', 
    'Karnal', 'Panipat', 'Rohtak', 'Hisar', 'Sonipat', 'Yamunanagar'
  ],
  'Delhi': [
    'New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 
    'West Delhi', 'Dwarka', 'Rohini', 'Laxmi Nagar', 'Saket',
    'Karol Bagh', 'Pitampura', 'Janakpuri'
  ],
  'Himachal Pradesh': [
    'Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Solan', 
    'Mandi', 'Palampur', 'Kangra', 'Kasauli', 'Dalhousie'
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 
    'Mussoorie', 'Haldwani', 'Roorkee', 'Rudrapur'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 
    'Navi Mumbai', 'Aurangabad', 'Kolhapur', 'Solapur'
  ]
};

const AVAILABLE_STATES = Object.keys(STATE_CITIES);

// ============================================================
// HELPER FUNCTIONS - CRASH PROOF
// ============================================================

/**
 * Safely get array from value (NEVER returns undefined)
 */
function safeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string');
  }
  return [];
}

/**
 * Safely check if array includes item
 */
function safeIncludes(arr: unknown, item: string): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.includes(item);
}

/**
 * Parse filters from database (handles all edge cases)
 */
function parseFilters(data: unknown): FilterData {
  // If null/undefined, return defaults
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_FILTERS };
  }

  const obj = data as Record<string, unknown>;

  return {
    pan_india: typeof obj.pan_india === 'boolean' ? obj.pan_india : true,
    states: safeArray(obj.states),
    cities: safeArray(obj.cities),
    gender: ['all', 'male', 'female'].includes(obj.gender as string) 
      ? (obj.gender as 'all' | 'male' | 'female') 
      : 'all'
  };
}

// ============================================================
// COMPONENT PROPS
// ============================================================
interface FilterSettingsProps {
  onClose?: () => void;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export const FilterSettings: React.FC<FilterSettingsProps> = ({ onClose }) => {
  // State
  const [filters, setFilters] = useState<FilterData>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ============================================================
  // FETCH FILTERS
  // ============================================================
  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please login to continue');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('filters')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        // Don't throw - just use defaults
      }

      // ✅ SAFE PARSING - Never fails
      const parsedFilters = parseFilters(data?.filters);
      setFilters(parsedFilters);

    } catch (err) {
      console.error('Unexpected error:', err);
      // Still use defaults on any error
      setFilters(DEFAULT_FILTERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // ============================================================
  // SAVE FILTERS
  // ============================================================
  const handleSave = async () => {
    if (!userId) {
      setError('User not found. Please refresh.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: saveError } = await supabase
        .from('users')
        .update({ 
          filters: filters,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TOGGLE STATE
  // ============================================================
  const toggleState = (state: string) => {
    setFilters(prev => {
      // ✅ SAFE - Always get array
      const currentStates = safeArray(prev.states);
      const isSelected = currentStates.includes(state);

      const newStates = isSelected
        ? currentStates.filter(s => s !== state)
        : [...currentStates, state];

      // Clean up cities when state is removed
      const stateCities = STATE_CITIES[state] || [];
      const currentCities = safeArray(prev.cities);
      const newCities = isSelected
        ? currentCities.filter(c => !stateCities.includes(c))
        : currentCities;

      return {
        ...prev,
        pan_india: false,
        states: newStates,
        cities: newCities
      };
    });
  };

  // ============================================================
  // TOGGLE CITY
  // ============================================================
  const toggleCity = (city: string) => {
    setFilters(prev => {
      // ✅ SAFE - Always get array
      const currentCities = safeArray(prev.cities);
      const isSelected = currentCities.includes(city);

      const newCities = isSelected
        ? currentCities.filter(c => c !== city)
        : [...currentCities, city];

      return {
        ...prev,
        pan_india: false,
        cities: newCities
      };
    });
  };

  // ============================================================
  // TOGGLE PAN INDIA
  // ============================================================
  const togglePanIndia = () => {
    setFilters(prev => ({
      ...prev,
      pan_india: !prev.pan_india,
      // Clear selections when enabling Pan India
      states: prev.pan_india ? prev.states : [],
      cities: prev.pan_india ? prev.cities : []
    }));
  };

  // ============================================================
  // CLEAR ALL
  // ============================================================
  const clearAll = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      gender: filters.gender // Keep gender
    });
  };

  // ============================================================
  // SAFE GETTERS (For rendering)
  // ============================================================
  const safeStates = safeArray(filters.states);
  const safeCities = safeArray(filters.cities);
  const isStateSelected = (state: string) => safeStates.includes(state);
  const isCitySelected = (city: string) => safeCities.includes(city);
  
  const getCityCountForState = (state: string): number => {
    const stateCities = STATE_CITIES[state] || [];
    return safeCities.filter(c => stateCities.includes(c)).length;
  };

  const canSave = filters.pan_india || safeStates.length > 0;

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading preferences...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ArrowLeft size={18} className="text-slate-600" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Filter size={20} className="text-blue-600" />
                  Target Audience
                </h1>
                <p className="text-xs text-slate-500">Configure which leads you receive</p>
              </div>
            </div>

            <button
              onClick={fetchFilters}
              className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-4 pb-28 space-y-6">

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex gap-3 items-center animate-in fade-in">
            <Check size={20} className="text-green-600 flex-shrink-0" />
            <span className="font-medium">Preferences saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-center">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* GENDER SELECTION */}
        {/* ============================================================ */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-bold mb-4 flex gap-2 text-slate-800">
            <Users className="text-purple-600" size={20} />
            Gender Preference
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {(['all', 'male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={() => setFilters(prev => ({ ...prev, gender: g }))}
                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                  filters.gender === g
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                    : 'border-slate-100 hover:border-slate-300 text-slate-600'
                }`}
              >
                {g === 'all' ? '👥 All' : g === 'male' ? '👨 Male' : '👩 Female'}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* PAN INDIA TOGGLE */}
        {/* ============================================================ */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={togglePanIndia}
            className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
              filters.pan_india
                ? 'border-green-500 bg-green-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex gap-4 items-center">
              <div className={`p-3 rounded-full ${filters.pan_india ? 'bg-green-200' : 'bg-slate-100'}`}>
                <Globe className={filters.pan_india ? 'text-green-700' : 'text-slate-400'} size={24} />
              </div>
              <div className="text-left">
                <span className={`block font-bold text-lg ${filters.pan_india ? 'text-green-800' : 'text-slate-700'}`}>
                  All India (Pan India)
                </span>
                <span className="text-sm text-slate-500">
                  Receive leads from anywhere in India
                </span>
              </div>
            </div>
            
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              filters.pan_india ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'
            }`}>
              {filters.pan_india && <Check size={18} className="text-white" />}
            </div>
          </button>

          {filters.pan_india && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-green-700 text-sm text-center font-medium">
                ✓ You will receive leads from all cities across India
              </p>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* STATE/CITY SELECTION */}
        {/* ============================================================ */}
        {!filters.pan_india && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex gap-2 text-slate-800">
                <MapPin className="text-blue-600" size={20} />
                Select Locations
              </h2>
              
              {(safeStates.length > 0 || safeCities.length > 0) && (
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Summary */}
            {safeStates.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-700 text-sm font-medium">
                  {safeStates.length} state(s) selected
                  {safeCities.length > 0 && ` • ${safeCities.length} city(ies)`}
                </span>
              </div>
            )}

            {/* State List */}
            <div className="space-y-3">
              {AVAILABLE_STATES.map(state => {
                const isSelected = isStateSelected(state);
                const isExpanded = expandedState === state;
                const cities = STATE_CITIES[state] || [];
                const selectedCityCount = getCityCountForState(state);

                return (
                  <div
                    key={state}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      isSelected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
                    }`}
                  >
                    {/* State Header */}
                    <div className="p-4 flex justify-between items-center">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => toggleState(state)}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        
                        <div>
                          <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {state}
                          </span>
                          {selectedCityCount > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                              {selectedCityCount} cities
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <button
                          onClick={() => setExpandedState(isExpanded ? null : state)}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        >
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Cities (Expanded) */}
                    {isExpanded && isSelected && (
                      <div className="px-4 pb-4 border-t border-blue-100">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-3 mb-3">
                          Select specific cities (optional):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cities.map(city => {
                            const citySelected = isCitySelected(city);
                            return (
                              <button
                                key={city}
                                onClick={() => toggleCity(city)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                  citySelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}
                              >
                                {city}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {safeStates.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select at least one state to continue</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SUMMARY */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="font-bold text-indigo-900 mb-3">📋 Current Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-indigo-700">Gender:</span>
              <span className="text-indigo-900 font-medium capitalize">{filters.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-700">Location:</span>
              <span className="text-indigo-900 font-medium">
                {filters.pan_india
                  ? 'All India'
                  : safeStates.length > 0
                    ? `${safeStates.length} state(s)`
                    : 'Not selected'}
              </span>
            </div>
            {!filters.pan_india && safeCities.length > 0 && (
              <div className="flex justify-between">
                <span className="text-indigo-700">Cities:</span>
                <span className="text-indigo-900 font-medium">{safeCities.length} selected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FLOATING SAVE BUTTON */}
      {/* ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-slate-200 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-3 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Saving...
              </>
            ) : (
              <>
                <Save size={22} />
                Save Preferences
              </>
            )}
          </button>
          
          {!canSave && !filters.pan_india && (
            <p className="text-center text-sm text-red-500 mt-2">
              Please select Pan India or at least one state
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSettings;
