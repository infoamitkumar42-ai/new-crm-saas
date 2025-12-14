import React from 'react';
import { Sidebar } from './Sidebar'; // Check karna ye file exist krti hai na?
import { useAuth } from '../auth/useAuth';
import { supabase } from '../supabaseClient';
import { LogOut } from 'lucide-react';

// 👇 Yahan 'children' prop add kiya hai taaki wo andar ka content dikha sake
interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="hidden md:block w-64 fixed h-full z-10">
        <Sidebar />
      </div>

      {/* Mobile / Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* Mobile Header (Optional - Agar sidebar mobile mein hidden hai) */}
        <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-20">
            <span className="font-bold text-blue-600">LeadFlow</span>
            {/* Mobile Menu Button logic yahan aa sakta hai */}
        </div>

        {/* 👇 MAIN CONTENT (Yahan Dashboard/Pages dikhenge) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
