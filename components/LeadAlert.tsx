import React from 'react';
import { Sidebar } from './Sidebar';
import { LeadAlert } from './LeadAlert'; // 👈 Import kiya

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <LeadAlert /> {/* 👈 Yahan laga diya. Ab ye har page par active rahega */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
