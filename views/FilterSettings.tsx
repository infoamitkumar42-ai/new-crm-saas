import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MapPin, Users, Check, Save, AlertCircle,
  ChevronDown, Globe, Filter, Loader2
} from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const STATE_CITIES: Record<string, string[]> = {
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Moga'],
  'Chandigarh': ['Chandigarh'],
  'Haryana': ['Panchkula', 'Gurgaon', 'Faridabad', 'Ambala', 'Karnal', 'Panipat'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Solan', 'Mandi'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Mussoorie', 'Haldwani'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai']
};

const AVAILABLE_STATES = Object.keys(STATE_CITIES);

// ============================================================
// MAIN COMPONENT
// ============================================================

export const FilterSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Extreme Safety Initialization (Crash Proof)
  const [filters, setFilters] = useState({
    pan_india: true, 
    states: [] as string[], 
    cities: [] as string[], 
    gender: 'all'
  });
  
  const [expandedState, setExpandedState] = useState<string | null>(null);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from('users').select('filters').eq('id', user.id).single();
      
      if (data?.filters) {
        // ✅ Ensure arrays are arrays (Fixes "includes" error)
        setFilters({
          pan_india: data.filters.pan_india ?? true,
          states: Array.isArray(data.filters.states) ? data.filters.states : [],
          cities: Array.isArray(data.filters.cities) ? data.filters.cities : [],
          gender: data.filters.gender || 'all'
        });
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true); setError(null); setSuccess(false);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { error } = await supabase.from('users').update({ 
        filters: filters, 
        updated_at: new Date().toISOString() 
      }).eq('id', user.id);
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const toggleState = (state: string) => {
    const currentStates = Array.isArray(filters.states) ? filters.states : [];
    const newStates = currentStates.includes(state) 
      ? currentStates.filter(s => s !== state) 
      : [...currentStates, state];
    
    // Clean up cities if state removed
    const currentCities = Array.isArray(filters.cities) ? filters.cities : [];
    const newCities = currentCities.filter(city => {
      const cityState = Object.entries(STATE_CITIES).find(
        ([_, cities]) => cities.includes(city)
      )?.[0];
      return cityState ? newStates.includes(cityState) : false;
    });

    setFilters({ ...filters, pan_india: false, states: newStates, cities: newCities });
  };

  const toggleCity = (city: string) => {
    const currentCities = Array.isArray(filters.cities) ? filters.cities : [];
    const newCities = currentCities.includes(city)
      ? currentCities.filter(c => c !== city)
      : [...currentCities, city];

    setFilters({ ...filters, pan_india: false, cities: newCities });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  );

  // ✅ Safe Derived Values for Rendering
  const safeStates = Array.isArray(filters.states) ? filters.states : [];
  const safeCities = Array.isArray(filters.cities) ? filters.cities : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 p-4 md:p-6">
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 p-4 shadow-sm md:static md:shadow-none md:border-none md:p-0 md:mb-6 rounded-xl">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
          <Filter size={24} className="text-blue-600"/> Audience Targeting
        </h1>
        <p className="text-slate-500 mt-1">Control exactly who you want to target.</p>
      </div>

      <div className="space-y-6">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
            <Check size={20} className="text-green-600"/> Preferences saved successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-center">
            <AlertCircle size={20} className="text-red-600"/> {error}
          </div>
        )}

        {/* Gender Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-bold mb-4 flex gap-2 text-slate-800 text-lg"><Users className="text-purple-600"/> Gender Preference</h2>
          <div className="grid grid-cols-3 gap-3">
            {['all', 'male', 'female'].map(g => (
              <button key={g} onClick={() => setFilters({...filters, gender: g})}
                className={`p-4 rounded-xl border-2 capitalize font-bold text-sm transition-all ${
                  filters.gender === g 
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-300 text-slate-600'
                }`}>
                {g === 'all' ? '👥 All' : g === 'male' ? '👨 Male' : '👩 Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Pan India Toggle */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setFilters({...filters, pan_india: !filters.pan_india})}
            className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
              filters.pan_india 
                ? 'border-green-500 bg-green-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`}>
            <div className="flex gap-4 items-center">
              <div className={`p-3 rounded-full ${filters.pan_india ? 'bg-green-200' : 'bg-slate-100'}`}>
                <Globe className={filters.pan_india ? "text-green-700" : "text-slate-400"} size={24} />
              </div>
              <div className="text-left">
                <span className={`block font-bold text-lg ${filters.pan_india ? 'text-green-800' : 'text-slate-700'}`}>All India (Pan India)</span>
                <span className="text-sm text-slate-500">Receive leads from anywhere in India (Fastest Delivery)</span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${filters.pan_india ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
              {filters.pan_india && <Check size={18} className="text-white"/>}
            </div>
          </button>
        </div>

        {/* Location Selection */}
        {!filters.pan_india && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold mb-2 flex gap-2 text-slate-800 text-lg"><MapPin className="text-blue-600"/> Select Specific Locations</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {AVAILABLE_STATES.map(state => {
                // ✅ CRASH PROOF CHECK (Using safeStates)
                const isSelected = safeStates.includes(state);
                const isExpanded = expandedState === state;
                const cities = STATE_CITIES[state] || [];
                const selectedCount = safeCities.filter(c => cities.includes(c)).length;

                return (
                  <div key={state} className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
                    <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-4 flex-1" onClick={() => toggleState(state)}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <Check size={14} className="text-white"/>}
                        </div>
                        <div>
                          <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{state}</span>
                          {selectedCount > 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{selectedCount} cities</span>}
                        </div>
                      </div>
                      {isSelected && (
                        <button onClick={() => setExpandedState(isExpanded ? null : state)} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors">
                          <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    
                    {isExpanded && isSelected && (
                      <div className="px-4 pb-4 pt-2 border-t border-blue-100 bg-white ml-10 mr-4 mt-2 mb-4 rounded-lg shadow-inner">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 mt-2">Select specific cities:</p>
                        <div className="flex flex-wrap gap-2">
                          {cities.map(city => {
                            // ✅ CRASH PROOF CHECK (Using safeCities)
                            const isCityActive = safeCities.includes(city);
                            return (
                              <button key={city} onClick={() => toggleCity(city)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                                  isCityActive 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300'
                                }`}>
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
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 z-30 shadow-lg md:static md:shadow-none md:border-none md:p-0 md:bg-transparent">
        <button 
          onClick={handleSave} 
          disabled={saving || (!filters.pan_india && safeStates.length === 0)}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-3 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl"
        >
          {saving ? <Loader2 className="animate-spin"/> : <Save size={22}/>} 
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
