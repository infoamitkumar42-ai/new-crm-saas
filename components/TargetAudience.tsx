import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MapPin, Users, Check, Save, AlertCircle,
  ChevronDown, Globe, Filter, Loader2
} from 'lucide-react';

interface UserFilters {
  pan_india: boolean;
  states: string[];
  cities: string[];
  gender: 'all' | 'male' | 'female';
}

const AVAILABLE_STATES = [
  'Punjab', 'Chandigarh', 'Haryana', 'Delhi', 
  'Himachal Pradesh', 'Uttarakhand', 'Maharashtra'
];

const STATE_CITIES: Record<string, string[]> = {
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  'Chandigarh': ['Chandigarh'],
  'Haryana': ['Panchkula', 'Gurgaon', 'Faridabad', 'Ambala', 'Karnal'],
  'Delhi': ['Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Solan'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Mussoorie'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane']
};

export const TargetAudience: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    pan_india: true, states: [], cities: [], gender: 'all'
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
      if (data?.filters) setFilters(data.filters);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true); setError(null); setSuccess(false);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { error } = await supabase.from('users').update({ filters, updated_at: new Date() }).eq('id', user.id);
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const toggleState = (state: string) => {
    const newStates = filters.states.includes(state) 
      ? filters.states.filter(s => s !== state) 
      : [...filters.states, state];
    setFilters({ ...filters, pan_india: false, states: newStates });
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b sticky top-0 z-20 p-4 shadow-sm">
        <h1 className="text-lg font-bold flex items-center gap-2"><Filter size={20} className="text-blue-600"/> Target Audience</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {success && <div className="bg-green-100 text-green-800 p-3 rounded-lg flex gap-2"><Check size={16}/> Saved!</div>}
        {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg flex gap-2"><AlertCircle size={16}/> {error}</div>}

        <div className="bg-white p-5 rounded-2xl border">
          <h2 className="font-bold mb-4 flex gap-2"><Users className="text-purple-600"/> Gender</h2>
          <div className="grid grid-cols-3 gap-2">
            {['all', 'male', 'female'].map(g => (
              <button key={g} onClick={() => setFilters({...filters, gender: g as any})}
                className={`p-3 rounded-xl border-2 capitalize ${filters.gender === g ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border">
          <button onClick={() => setFilters({...filters, pan_india: !filters.pan_india})}
            className={`w-full flex justify-between p-4 rounded-xl border-2 ${filters.pan_india ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
            <div className="flex gap-3"><Globe className="text-green-600"/> <span className="font-bold">All India</span></div>
            {filters.pan_india && <Check className="text-green-600"/>}
          </button>
        </div>

        {!filters.pan_india && (
          <div className="bg-white p-5 rounded-2xl border space-y-2">
            <h2 className="font-bold mb-4 flex gap-2"><MapPin className="text-blue-600"/> Locations</h2>
            {AVAILABLE_STATES.map(state => (
              <div key={state} className="border rounded-xl overflow-hidden">
                <div className={`p-3 flex justify-between cursor-pointer ${filters.states.includes(state) ? 'bg-blue-50' : ''}`}
                     onClick={() => toggleState(state)}>
                  <span className="font-medium">{state}</span>
                  {filters.states.includes(state) && <Check size={16} className="text-blue-600"/>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2">
          {saving ? <Loader2 className="animate-spin"/> : <Save/>} Save Preferences
        </button>
      </div>
    </div>
  );
};
