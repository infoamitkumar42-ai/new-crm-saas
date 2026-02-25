/**
 * User Quick Edit Modal - Mobile Optimized
 * Allows admin to quickly edit daily_limit and reset leads_today
 */

import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, User, Target, Hash, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface UserData {
    id: string;
    name: string;
    email: string;
    daily_limit: number | null;
    daily_limit_override: number | null;
    leads_today: number | null;
    plan_name: string | null;
    is_active: boolean;
    target_gender?: string;
    target_state?: string;
}

interface UserQuickEditProps {
    user: UserData | null;
    onClose: () => void;
    onSave: () => void;
}

const UserQuickEdit: React.FC<UserQuickEditProps> = ({ user, onClose, onSave }) => {
    const [dailyLimit, setDailyLimit] = useState<number>(0);
    const [leadsToday, setLeadsToday] = useState<number>(0);
    const [targetGender, setTargetGender] = useState<string>('Any');
    const [targetState, setTargetState] = useState<string>('All India');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setDailyLimit(user.daily_limit_override || user.daily_limit || 0);
            setLeadsToday(user.leads_today || 0);
            setTargetGender(user.target_gender || 'Any');
            setTargetState(user.target_state || 'All India');
            setIsActive(user.is_active ?? true);
        }
    }, [user]);

    if (!user) return null;

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    daily_limit: dailyLimit,
                    daily_limit_override: dailyLimit,
                    leads_today: leadsToday,
                    target_gender: targetGender,
                    target_state: targetState,
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: '✅ Saved successfully!' });
            setTimeout(() => {
                onSave();
                onClose();
            }, 1000);
        } catch (err: any) {
            setMessage({ type: 'error', text: `❌ Error: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleResetLeads = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ leads_today: 0, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;
            setLeadsToday(0);
            setMessage({ type: 'success', text: '✅ Leads reset to 0!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: `❌ Error: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl animate-slideUp">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">{user.name || 'User'}</h3>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">

                    {/* Message */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Daily Limit */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Target size={16} className="text-blue-500" />
                            Daily Limit
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                                className="flex-1 px-4 py-3 text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                            />
                            <div className="flex gap-1">
                                {[5, 10, 15, 20].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setDailyLimit(n)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dailyLimit === n
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leads Today */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Hash size={16} className="text-green-500" />
                            Leads Today
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                value={leadsToday}
                                onChange={(e) => setLeadsToday(parseInt(e.target.value) || 0)}
                                className="flex-1 px-4 py-3 text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                            />
                            <button
                                onClick={handleResetLeads}
                                disabled={saving}
                                className="px-4 py-3 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Target Gender */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <User size={16} className="text-purple-500" />
                            Target Gender
                        </label>
                        <div className="flex gap-2">
                            {['Any', 'Female', 'Male'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setTargetGender(g)}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${targetGender === g
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target State */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Calendar size={16} className="text-teal-500" />
                            Target State
                        </label>
                        <select
                            value={targetState}
                            onChange={(e) => setTargetState(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors font-medium"
                        >
                            <option value="All India">All India</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="Chandigarh">Chandigarh</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Maharashtra">Maharashtra</option>
                        </select>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <span className="text-sm font-medium text-slate-700">User Active</span>
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={`relative w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-300'
                                }`}
                        >
                            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isActive ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Plan Info */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Current Plan</span>
                            <span className="px-3 py-1 bg-white rounded-full text-sm font-bold text-blue-700 shadow-sm">
                                {user.plan_name || 'No Plan'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <RefreshCw size={20} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default UserQuickEdit;
