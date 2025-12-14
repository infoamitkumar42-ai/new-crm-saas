// File: views/member/MemberDashboard.tsx
import React from 'react';
import { supabase } from '../../supabaseClient';

export const MemberDashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">👤 Member Dashboard</h1>
      <p className="text-gray-600">Welcome! Here you will see your assigned leads.</p>
      <button 
        onClick={() => supabase.auth.signOut()} 
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Sign Out
      </button>
    </div>
  );
};
