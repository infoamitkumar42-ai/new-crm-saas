import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle, ArrowRight, Loader, ShieldCheck, Lock } from 'lucide-react';

export default function ApplyForm() {
    const [searchParams] = useSearchParams();
    const managerRef = searchParams.get('ref') || searchParams.get('manager');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        profession: 'Job',
        age: '',
        manager_ref: managerRef
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [assignedAgent, setAssignedAgent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            // Direct call to Edge Function
            const { data, error } = await supabase.functions.invoke('process-direct-lead', {
                body: formData
            });

            if (error) throw error;

            setAssignedAgent(data.assigned_to || 'Approved');
            setStatus('success');

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4 animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Registration Successful!</h2>
                    <p className="text-gray-600">
                        Your application has been approved and assigned to our senior expert <span className="font-bold text-green-700">{assignedAgent}</span>.
                    </p>
                    <div className="bg-green-100 p-4 rounded-xl border border-green-200">
                        <p className="font-semibold text-green-800 text-sm">
                            Please wait for a call within 10-15 minutes.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="mb-6 text-center space-y-2 max-w-lg">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Mentorship Program <span className="text-blue-600">Application</span>
                </h1>
                <p className="text-slate-500 font-medium">
                    Join 5,000+ members learning digital skills.
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp / Calling Number</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-medium">+91</span>
                            <input
                                type="tel"
                                required
                                pattern="[6789][0-9]{9}"
                                title="Please enter valid 10 digit Indian mobile number"
                                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white"
                                placeholder="98765 43210"
                                value={formData.phone}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setFormData({ ...formData, phone: val });
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white"
                                placeholder="Current City"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white text-slate-600"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                            >
                                <option value="" disabled>Select Age</option>
                                <option value="18-24">18 - 24</option>
                                <option value="25-30">25 - 30</option>
                                <option value="31-40">31 - 40</option>
                                <option value="40+">40+</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Profession</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white text-slate-600"
                            value={formData.profession}
                            onChange={e => setFormData({ ...formData, profession: e.target.value })}
                        >
                            <option value="Job">Job / Employee</option>
                            <option value="Student">Student</option>
                            <option value="Business">Business Owner</option>
                            <option value="Housewife">Housewife</option>
                            <option value="Retired">Retired</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Submit Application
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                        <ShieldCheck className="w-4 h-4" />
                        <span>100% Secure & Private Submission</span>
                    </div>

                </form>
            </div>

            {/* Footer & Disclaimer */}
            <footer className="mt-8 text-center text-slate-400 text-xs max-w-2xl px-4 space-y-4">

                <div className="flex justify-center gap-4">
                    <a href="/privacy" className="hover:text-slate-600 underline">Privacy Policy</a>
                    <a href="/terms" className="hover:text-slate-600 underline">Terms of Service</a>
                    <a href="/contact" className="hover:text-slate-600 underline">Contact Us</a>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <p className="leading-relaxed">
                        Disclaimer: This site is not a part of the Facebook™ website or Facebook™ Inc.
                        Additionally, This site is NOT endorsed by Facebook™ in any way.
                        FACEBOOK™ is a trademark of FACEBOOK™, Inc.
                    </p>
                </div>
            </footer>

        </div>
    );
}
