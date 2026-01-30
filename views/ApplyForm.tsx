import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle, ArrowRight, Loader, Lock, Users, Clock, AlertCircle, Shield, Briefcase, Star, MapPin, PhoneCall } from 'lucide-react';

// ----------------------------------------------------------------------
// 🔔 LIVE NOTIFICATION COMPONENT
// ----------------------------------------------------------------------
const NAMES = ["Priya", "Rahul", "Anjali", "Amit", "Sneha", "Vikram", "Pooja", "Rohit", "Neha", "Karan", "Simran", "Arjun"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Ahmedabad"];

const LiveNotification = () => {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState({ name: '', city: '', time: '' });

    useEffect(() => {
        const initialTimer = setTimeout(() => triggerNotification(), 3000);

        const triggerNotification = () => {
            const name = NAMES[Math.floor(Math.random() * NAMES.length)];
            const city = CITIES[Math.floor(Math.random() * CITIES.length)];
            const time = "Just now";
            setData({ name, city, time });
            setVisible(true);
            setTimeout(() => setVisible(false), 4000);
            const nextDelay = Math.random() * 5000 + 5000;
            setTimeout(triggerNotification, nextDelay);
        };
        return () => clearTimeout(initialTimer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-[slide-up_0.5s_ease-out]">
            <div className="bg-white/95 backdrop-blur-md border border-green-100 shadow-xl shadow-slate-200/50 rounded-xl p-3 flex items-center gap-3 w-fit mx-auto sm:mx-0">
                <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-800 font-bold">{data.name} just applied!</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin size={10} /> {data.city} • <span className="text-green-600 font-semibold">{data.time}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 📝 MAIN FORM COMPONENT
// ----------------------------------------------------------------------
export default function ApplyForm() {
    const [searchParams] = useSearchParams();
    const managerRef = searchParams.get('ref') || searchParams.get('manager');
    const urlPixelId = searchParams.get('pixel') || searchParams.get('pixel_id');

    // 🔒 DEFAULT PIXEL ID (Isolates data to this Dataset)
    const PIXEL_ID = urlPixelId || '1583951632944842';

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
    const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 22 });

    // --------------------------------------------------
    // 🔥 PIXEL INJECTION (ISOLATED TO THIS COMPONENT)
    // --------------------------------------------------
    useEffect(() => {
        if (PIXEL_ID) {
            console.log("Initializing Isolated Pixel:", PIXEL_ID);

            // Standard Meta Pixel Code
            !function (f, b, e, v, n, t, s) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ?
                        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s)
            }(window, document, 'script',
                'https://connect.facebook.net/en_US/fbevents.js');

            // @ts-ignore
            window.fbq('init', PIXEL_ID);
            // @ts-ignore
            window.fbq('track', 'PageView');
        }
    }, [PIXEL_ID]);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
                return { minutes: 15, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            const { data, error } = await supabase.functions.invoke('process-direct-lead', {
                body: formData
            });

            if (error) throw error;

            setAssignedAgent(data.assigned_to || 'Senior Mentor');

            // 🔥 FIRE LEAD EVENT
            if (PIXEL_ID && (window as any).fbq) {
                (window as any).fbq('track', 'Lead');
                console.log("Pixel Fired: Lead");
            }

            setStatus('success');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || 'Connection failed. Try again.');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-green-50 z-0 opacity-50"></div>
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 z-10 animate-[bounce-in_0.5s_ease-out] shadow-lg shadow-green-200">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <h2 className="text-3xl font-black text-slate-900 z-10 mb-2 tracking-tight leading-tight">
                    Application Sent!
                </h2>

                <div className="z-10 bg-white p-6 rounded-2xl border border-green-100 shadow-xl shadow-slate-100 max-w-sm w-full">

                    <div className="mb-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Private Access</p>
                        <h3 className="text-lg font-bold text-slate-900">
                            Welcome to the Mentorship Program
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            <PhoneCall size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-900 text-sm">Call from {assignedAgent}'s Team</p>
                            <p className="text-xs text-slate-500">Expect a call shortly for selection.</p>
                        </div>
                    </div>

                    <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-100 flex gap-2 text-left items-start">
                        <Clock size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
                            <strong>Action Required:</strong> Please pick up the call from an unknown number in the next 10-15 mins to confirm your slot.
                        </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400">
                        Application ID: #{Math.floor(Math.random() * 100000)} • Verified
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 overflow-x-hidden">

            <LiveNotification />

            {/* Official Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            LF
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight">LeadFlow</span>
                    </div>
                    <div className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100 flex items-center gap-1 animate-pulse">
                        <Clock size={10} /> Ends in {timeLeft.minutes}:{timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="max-w-[480px] mx-auto px-4 pt-6">

                {/* Headline */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-3">
                        <Star size={10} className="fill-blue-700" /> Official Application
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight mb-2">
                        Work From Home <br />
                        <span className="text-blue-600">Business Opportunity</span>
                    </h1>
                    <p className="text-slate-500 text-sm px-4">
                        Join 5,000+ people earning daily. Free mentorship & support.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">

                    {/* Progress Bar */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                <div className="w-[85%] bg-green-500 h-full rounded-full"></div>
                            </div>
                            <span className="text-xs font-bold text-green-600">85% Complete</span>
                        </div>
                        <Shield size={14} className="text-slate-400" />
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
                                <div className="relative">
                                    <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-sm outline-none"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">WhatsApp Number</label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-3.5 text-slate-500 font-bold text-sm">+91</div>
                                    <input
                                        type="tel"
                                        required
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-sm outline-none tracking-widest placeholder:font-normal placeholder:tracking-normal"
                                        placeholder="98765 XXXXX"
                                        value={formData.phone}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setFormData({ ...formData, phone: val });
                                        }}
                                    />
                                    {formData.phone.length === 10 && (
                                        <div className="absolute right-3 top-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle size={10} /> Valid
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">City</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-sm outline-none"
                                        placeholder="Your City"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Age</label>
                                    <select
                                        required
                                        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-sm outline-none appearance-none ${!formData.age ? 'text-slate-400' : 'text-slate-900'}`}
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    >
                                        <option value="" disabled>Select</option>
                                        <option value="18-24">18-24</option>
                                        <option value="25-30">25-30</option>
                                        <option value="31-40">31-40</option>
                                        <option value="40+">40+</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Current Profession</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                    <select
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-sm outline-none appearance-none text-slate-900"
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
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                                <AlertCircle size={14} /> {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg mt-2 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            {status === 'loading' ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Submit Application <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-4 pt-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png" className="h-4 object-contain" alt="Stripe" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3 object-contain" alt="Visa" />
                            <div className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">
                                <Lock size={8} /> SSL SECURE
                            </div>
                        </div>
                    </form>
                </div>

                {/* Trust Footer */}
                <div className="mt-8 mb-4">
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Why Choose Us?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-2">
                            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-slate-800">Verified Income</p>
                                <p className="text-[10px] text-slate-500">Proven system</p>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-2">
                            <Users size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-slate-800">Mentorship</p>
                                <p className="text-[10px] text-slate-500">Personal guidance</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-2 mt-8 pb-8 border-t border-slate-200 pt-6">
                    <div className="flex justify-center -space-x-2 mb-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-slate-50 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${10 + i}`} alt="User" />
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                        © 2026 LeadFlow Inc. • <Link to="/privacy">Privacy Policy</Link> • <Link to="/terms">Terms</Link>
                    </p>
                    <p className="text-[9px] text-slate-300 max-w-xs mx-auto leading-tight pt-2">
                        This site is not a part of the Facebook website or Facebook Inc. Additionally, This site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes bounce-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
