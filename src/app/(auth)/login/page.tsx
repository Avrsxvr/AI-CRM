'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message || 'Invalid email or password.');
      }

      if (data.session) {
        router.push('/leads');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Allows client to bypass authentication during sandbox testing/demos
  const handleSandboxBypass = () => {
    setIsSandboxLoading(true);
    setError(null);
    setTimeout(() => {
      // Direct routing to Leads dashboard
      router.push('/leads');
      setIsSandboxLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center neon-glow-primary mx-auto">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Welcome to AI CRM</h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Log in to capture trade show leads and trigger follow-up sequences.
          </p>
        </div>

        {/* Login Panel */}
        <div className="glass-panel p-8 rounded-3xl space-y-6 border border-white/5 bg-black/40 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rep@yourcompany.com"
                required
                className="w-full bg-black/50 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all outline-none shadow-inner"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/50 border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-all outline-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isSandboxLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white flex items-center justify-center gap-2 neon-glow-primary hover:scale-[1.02] transition-all shadow-xl"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-transparent backdrop-blur-md text-[10px] uppercase font-bold text-zinc-500 tracking-widest rounded-full">
              Or Demo App
            </span>
          </div>

          {/* Sandbox Bypass Action */}
          <button
            onClick={handleSandboxBypass}
            disabled={isLoading || isSandboxLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-zinc-300 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            {isSandboxLoading ? (
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Bypass Auth (Sandbox Mode)
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-zinc-600 font-mono">
          Secured with Supabase Auth & RLS policies
        </p>
      </div>
    </div>
  );
}
