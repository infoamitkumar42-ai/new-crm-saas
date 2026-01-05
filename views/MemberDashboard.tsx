/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🧪 TEST VERSION - MemberDashboard.tsx                     ║
 * ║  This will DEFINITELY show if component is mounting        ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const MemberDashboard = () => {
  const [status, setStatus] = useState('Starting...');
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎯 MemberDashboard MOUNTED');
    
    const test = async () => {
      try {
        // Step 1
        setStatus('Step 1: Getting auth user...');
        console.log('Step 1: Getting auth user...');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error('Auth error: ' + authError.message);
        }
        
        if (!user) {
          throw new Error('No user found - not logged in');
        }
        
        console.log('Step 1 ✅ User:', user.email);
        
        // Step 2
        setStatus('Step 2: Fetching profile from database...');
        console.log('Step 2: Fetching profile...');
        
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, name, email, role, plan_name, is_active')
          .eq('id', user.id)
          .single();
        
        console.log('Step 2 Response:', { profileData, profileError });
        
        if (profileError) {
          throw new Error('Profile error: ' + profileError.message);
        }
        
        if (!profileData) {
          throw new Error('No profile found in database');
        }
        
        console.log('Step 2 ✅ Profile:', profileData);
        setProfile(profileData);
        setStatus('✅ SUCCESS! Dashboard loaded.');
        
      } catch (err: any) {
        console.error('❌ ERROR:', err);
        setError(err.message);
        setStatus('❌ Failed: ' + err.message);
      }
    };
    
    test();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f1f5f9', 
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        margin: '0 auto', 
        background: 'white', 
        borderRadius: '16px', 
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          🧪 Dashboard Test
        </h1>
        
        {/* Status */}
        <div style={{ 
          padding: '16px', 
          background: error ? '#fef2f2' : '#f0fdf4', 
          borderRadius: '12px',
          marginBottom: '24px',
          border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`
        }}>
          <p style={{ 
            fontWeight: 'bold', 
            color: error ? '#dc2626' : '#16a34a',
            fontSize: '14px'
          }}>
            {status}
          </p>
        </div>
        
        {/* Profile Info */}
        {profile && (
          <div style={{ 
            padding: '16px', 
            background: '#eff6ff', 
            borderRadius: '12px',
            border: '1px solid #bfdbfe'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#1e40af' }}>
              ✅ Profile Loaded:
            </h3>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Role:</strong> {profile.role}</p>
            <p><strong>Plan:</strong> {profile.plan_name || 'None'}</p>
            <p><strong>Active:</strong> {profile.is_active ? 'Yes' : 'No'}</p>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Retry
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              🚪 Logout
            </button>
          </div>
        )}
        
        {/* Instructions */}
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#fefce8', 
          borderRadius: '12px',
          border: '1px solid #fef08a',
          fontSize: '12px'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>📋 Check Console (F12):</p>
          <p>Look for these messages:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>🎯 MemberDashboard MOUNTED</li>
            <li>Step 1: Getting auth user...</li>
            <li>Step 2: Fetching profile...</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
