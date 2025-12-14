import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Lead } from '../types';
import { Users, UserPlus, Send, RefreshCw, Phone, MapPin, TrendingUp, CheckCircle } from 'lucide-react';

export const ManagerDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lead Form State
  const [newLead, setNewLead] = useState({ name: '', phone: '', city: '' });
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get My Profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(userData);

      // 2. Get My Team Members (Jinhone mera Team Code use kiya hai)
      // Logic: manager_id = My ID
      const { data: teamData, error: teamError } = await supabase
        .from('users')
        .select('*')
        .eq('manager_id', user.id);

      if (teamError) console.error("Team Fetch Error:", teamError);
      setTeamMembers(teamData || []);

      // Default select first member
      if (teamData && teamData.length > 0) {
        setSelectedMember(teamData[0].id);
      }

    } catch (error) {
      console.error("Manager Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Assign Lead Function
  const handleAssignLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    if (!selectedMember) {
        alert("Please select a team member first!");
        return;
    }

    try {
        const { error } = await supabase.from('leads').insert({
            name: newLead.name,
            phone: newLead.phone,
            city: newLead.city,
            status: 'Fresh',
            assigned_to: selectedMember,  // 👈 Member ID
            manager_id: profile?.id       // 👈 My ID (Owner)
        });

        if (error) throw error;

        setStatusMsg('Lead Assigned Successfully! 🎉');
        setNewLead({ name: '', phone: '', city: '' }); // Reset Form
        
        // Clear success msg after 3s
        setTimeout(() => setStatusMsg(''), 3000);

    } catch (error: any) {
        alert("Error: " + error.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Manager Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👔 Manager Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Team Code: <span className="font-mono font-bold bg-yellow-100 px-2 py-1 rounded text-yellow-800 select-all">{profile?.team_code || 'Loading...'}</span>
            <span className="ml-2 text-xs text-slate-400">(Share this code with your team)</span>
          </p>
        </div>
        <button onClick={fetchManagerData} className="p-2 bg-white border rounded-lg shadow-sm hover:bg-slate-50">
            <RefreshCw size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: Lead Assignment Form */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-blue-600" /> Assign New Lead
                </h2>

                <form onSubmit={handleAssignLead} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Member</label>
                        <select 
                            className="w-full border p-2.5 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                        >
                            <option value="" disabled>-- Select Team Member --</option>
                            {teamMembers.map(member => (
                                <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                            ))}
                        </select>
                        {teamMembers.length === 0 && <p className="text-xs text-red-500 mt-1">No members found. Ask them to join using your Team Code.</p>}
                    </div>

                    <div className="space-y-3">
                        <input 
                            className="w-full border p-2.5 rounded-lg outline-none" 
                            placeholder="Lead Name" 
                            value={newLead.name} 
                            onChange={e => setNewLead({...newLead, name: e.target.value})} 
                            required 
                        />
                        <input 
                            className="w-full border p-2.5 rounded-lg outline-none" 
                            placeholder="Phone Number" 
                            value={newLead.phone} 
                            onChange={e => setNewLead({...newLead, phone: e.target.value})} 
                            required 
                        />
                        <input 
                            className="w-full border p-2.5 rounded-lg outline-none" 
                            placeholder="City (Optional)" 
                            value={newLead.city} 
                            onChange={e => setNewLead({...newLead, city: e.target.value})} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={teamMembers.length === 0}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} /> Assign Lead
                    </button>

                    {statusMsg && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm text-center font-medium animate-pulse">
                            {statusMsg}
                        </div>
                    )}
                </form>
            </div>
        </div>

        {/* RIGHT COL: Team List */}
        <div className="lg:col-span-2">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg">
                    <p className="text-indigo-200 text-xs font-bold uppercase">Team Size</p>
                    <h3 className="text-3xl font-bold">{teamMembers.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-slate-400 text-xs font-bold uppercase">Active Today</p>
                    <h3 className="text-3xl font-bold text-green-600 flex items-center gap-2">
                        {teamMembers.length} <span className="text-xs font-normal text-slate-400">(All Active)</span>
                    </h3>
                </div>
            </div>

            {/* Team Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">My Team Members</h3>
                </div>

                {teamMembers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Users size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-medium">You have no team members yet.</p>
                        <p className="text-sm mt-2 bg-slate-100 inline-block px-3 py-1 rounded">
                            Share Code: <span className="font-mono font-bold text-slate-800">{profile?.team_code}</span>
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-xs">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Joined On</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {teamMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            {member.name || 'Unknown'}
                                        </td>
                                        <td className="p-4 text-slate-600">{member.email}</td>
                                        <td className="p-4 text-slate-500 text-xs">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 justify-end w-fit ml-auto">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
