import React, { useState } from 'react';
import { User, MOCK_USER } from '../types';
import { Button, Input, Card } from '../components/UI';
import { logEvent } from '../supabaseClient';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate Supabase Auth
    setTimeout(async () => {
      // In reality, Supabase Auth would handle this and return session
      const user = { ...MOCK_USER, email: email || MOCK_USER.email };
      
      // If admin check (mock)
      if (email.includes('admin')) {
        user.role = 'admin';
      }

      // Log the authentication event
      await logEvent(user.id, isLogin ? 'user_login' : 'user_signup', {
        method: 'email',
        email_domain: user.email.split('@')[1]
      });

      onLogin(user);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          LeadFlow
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLogin ? 'Sign in to your account' : 'Start your 14-day free trial'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <Input label="Full Name" placeholder="John Doe" required />
            )}
            
            <Input 
              label="Email address" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input 
              label="Password" 
              type="password" 
              required 
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              {isLogin ? 'Sign in' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {isLogin ? 'New to LeadFlow?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-center">
             <p className="text-xs text-slate-400">Demo Login: Leave blank or use 'admin@demo.com' for Admin view</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
