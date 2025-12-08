import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, Button, Input } from '../components/UI';
import { User, FilterConfig } from '../types';
import { logEvent } from '../supabaseClient';

interface FilterSettingsProps {
  user: User;
  onUpdate: (filters: FilterConfig, dailyLimit: number) => Promise<void>;
}

export const FilterSettings: React.FC<FilterSettingsProps> = ({ user, onUpdate }) => {
  const [filters, setFilters] = useState<FilterConfig>(user.filters);
  const [dailyLimit, setDailyLimit] = useState(user.daily_limit);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    
    await onUpdate(filters, dailyLimit);
    
    // Log the event
    await logEvent('filter_updated', {
      user_id: user.id,
      previous_limit: user.daily_limit,
      new_limit: dailyLimit,
      new_filters: filters
    });

    setLoading(false);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Simple CSV parser for demo
    const val = e.target.value.split(',').map(s => s.trim());
    setFilters({ ...filters, cities: val });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lead Targeting</h1>
        <p className="text-slate-500 mt-1">Configure exactly what kind of leads you want to receive.</p>
      </div>

      <Card className="p-6 space-y-8">
        {/* Demographics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-100 pb-2">Demographics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age Range</label>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="number" 
                    value={filters.age_min}
                    onChange={(e) => setFilters({...filters, age_min: parseInt(e.target.value)})}
                    placeholder="Min" 
                  />
                  <span className="text-slate-400">-</span>
                  <Input 
                    type="number" 
                    value={filters.age_max}
                    onChange={(e) => setFilters({...filters, age_max: parseInt(e.target.value)})}
                    placeholder="Max" 
                  />
                </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Income (Annual)</label>
               <Input 
                 type="number" 
                 value={filters.min_income}
                 onChange={(e) => setFilters({...filters, min_income: parseInt(e.target.value)})}
               />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Gender Preference</label>
             <div className="flex space-x-4 mt-2">
               {['All', 'Male', 'Female'].map(g => (
                 <label key={g} className="flex items-center">
                   <input 
                     type="radio" 
                     name="gender" 
                     checked={filters.genders.includes(g)}
                     onChange={() => setFilters({...filters, genders: [g]})}
                     className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300" 
                   />
                   <span className="ml-2 text-sm text-slate-700">{g}</span>
                 </label>
               ))}
             </div>
          </div>
        </div>

        {/* Location & Profession */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-100 pb-2">Targeting</h3>
          
          <div>
            <Input 
              label="Target Cities (Comma separated)"
              value={filters.cities.join(', ')}
              onChange={handleCityChange}
              placeholder="New York, London, Tokyo"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Target Professions</label>
             <select 
               multiple
               className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md border"
               value={filters.professions}
               onChange={(e) => {
                 const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                 setFilters({...filters, professions: selected});
               }}
               style={{ height: '120px' }}
             >
               {['Software Engineer', 'Doctor', 'Lawyer', 'Real Estate Agent', 'Teacher', 'Small Business Owner'].map(p => (
                 <option key={p} value={p}>{p}</option>
               ))}
             </select>
             <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-100 pb-2">Volume Control</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Daily Lead Limit</label>
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={dailyLimit} 
                onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <span className="text-slate-900 font-bold w-12 text-right">{dailyLimit}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Maximum number of leads to push to your Google Sheet per day.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} isLoading={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Filter Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};