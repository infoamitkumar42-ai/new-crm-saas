import React, { useState } from 'react';
import { Download, Upload, Users, DollarSign } from 'lucide-react';
import { Card, Button, Badge, StatCard } from '../components/UI';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  // Mock Data for Admin
  const [users] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john@co.com', payment_status: 'active', valid_until: '2023-12-31', role: 'user', daily_limit: 10, sheet_url: '#', filters: {} as any },
    { id: '2', name: 'Jane Smith', email: 'jane@agency.com', payment_status: 'inactive', valid_until: null, role: 'user', daily_limit: 20, sheet_url: '#', filters: {} as any },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Master Admin</h1>
        <p className="text-slate-500">Manage system-wide lead distribution and users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} icon={Users} />
        <StatCard title="Active Subs" value={users.filter(u => u.payment_status === 'active').length} icon={Users} />
        <StatCard title="Revenue Today" value="$450" icon={DollarSign} trend="+12% vs last week" />
        <StatCard title="Leads in Buffer" value="1,240" icon={Upload} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main User Table */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Registered Users</h3>
            <Button variant="secondary" className="text-sm">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sheet</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{u.name}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={u.payment_status}>{u.payment_status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {u.daily_limit}/day
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 hover:text-brand-900">
                      <a href={u.sheet_url}>Open</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Master Control */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-slate-700">
            <h3 className="font-semibold mb-4 text-white">Master Sheet Link</h3>
            <p className="text-slate-400 text-sm mb-4">
              This is the source of truth. The GAS automation pulls from here.
            </p>
            <a href="#" className="text-brand-400 hover:text-brand-300 underline text-sm break-all">
              https://docs.google.com/spreadsheets/d/MASTER-SHEET-ID
            </a>
            <div className="mt-6 pt-6 border-t border-slate-700">
               <h4 className="text-sm font-semibold mb-2">Manual Actions</h4>
               <Button className="w-full bg-slate-700 hover:bg-slate-600 mb-2">
                 <Upload className="w-4 h-4 mr-2" />
                 Upload Leads (CSV)
               </Button>
               <Button className="w-full bg-brand-600 hover:bg-brand-700">
                 Force Distribution Run
               </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};