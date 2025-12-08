
import React, { useState, useEffect } from 'react';
import { Activity, Users, Clock, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge, Card, StatCard, Button } from '../components/UI';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { refreshProfile } = useAuth();
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const isInactive = user.payment_status !== 'active';

  // Poll for sheet URL if it's missing (it might be creating in background)
  useEffect(() => {
    if (!user.sheet_url) {
        const interval = setInterval(async () => {
            await refreshProfile();
        }, 3000);
        return () => clearInterval(interval);
    }
  }, [user.sheet_url, refreshProfile]);

  const handleCreateSheet = async () => {
      setIsGeneratingSheet(true);
      try {
          const sheetResp = await fetch("/api/create-sheet", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ email: user.email, name: user.name }),
          });
          const sheetData = await sheetResp.json();
          
          if (sheetData.sheetUrl) {
              await supabase
                .from('users')
                .update({ 
                    sheet_url: sheetData.sheetUrl,
                    daily_limit: 10,
                    filters: {
                       age_min: 18,
                       age_max: 60,
                       cities: [],
                       genders: ['All'],
                       professions: [],
                       min_income: 0
                    }
                })
                .eq('id', user.id);
              await refreshProfile();
          } else {
              alert("Could not create sheet yet. Please try again in a moment.");
          }
      } catch (e) {
          console.error(e);
          alert("Connection error. Please check your internet.");
      } finally {
          setIsGeneratingSheet(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Badge status={user.payment_status === 'active' ? 'active' : 'inactive'}>
          Plan: {user.payment_status.toUpperCase()}
        </Badge>
      </div>

      {isInactive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Subscription Required</h3>
            <p className="mt-1 text-sm text-amber-700">
              You are currently inactive. To receive leads, please upgrade to a paid plan in the Subscription tab.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Leads Received Today" 
          value={isInactive ? 0 : 12} 
          icon={Users}
          trend={!isInactive ? "+2 from yesterday" : undefined}
        />
        <StatCard 
          title="Plan Valid Until" 
          value={user.valid_until ? new Date(user.valid_until).toLocaleDateString() : 'N/A'} 
          icon={Clock}
        />
        <StatCard 
          title="Avg. Lead Quality" 
          value="High" 
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Personal Lead Sheet</h2>
          <p className="text-slate-600 mb-6 text-sm">
            All your assigned leads are automatically synced to your private Google Sheet in real-time.
          </p>
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded">
                <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.033 16.01c-.564.588-1.527 1.053-2.188.588-.865-.609-1.297-2.618-1.297-2.618l3.485.03m3.485 2.033c.564-.588 1.527-1.053 2.188-.588.865.609 1.297 2.618 1.297 2.618l-3.485-.03m-3.485-2.033l3.485 2.033" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Google Sheet</p>
                <p className="text-xs text-slate-500">
                  {user.sheet_url ? 'Connected' : 'Creating... (This takes ~10s)'}
                </p>
              </div>
            </div>
            {user.sheet_url ? (
                <a href={user.sheet_url} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="text-sm">
                    Open Sheet <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
            ) : (
                <Button 
                    variant="primary" 
                    className="text-sm" 
                    onClick={handleCreateSheet} 
                    isLoading={isGeneratingSheet}
                >
                    {isGeneratingSheet ? "Generating..." : "Retry Connection"}
                </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Daily Limit Usage</span>
              <span className="font-medium text-slate-900">12 / {user.daily_limit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${(12/user.daily_limit)*100}%` }}></div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                You have reached 60% of your daily lead allocation. Filters are currently <span className="text-green-600 font-medium">Active</span>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
