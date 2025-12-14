import React from 'react';
import { supabase } from '../supabaseClient';

export const MemberDashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">👤 Member Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">My Leads</h2>
        <p className="text-gray-600">Your assigned leads will appear here.</p>
      </div>
    </div>
  );
};
