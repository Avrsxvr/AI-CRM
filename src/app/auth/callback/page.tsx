'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on the client so bots get a blank HTML shell
    if (typeof window === 'undefined') return;

    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const next = params.get('next') ?? '/leads';
      
      // Some legacy setups put tokens in the hash fragment
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      const supabase = createClient();

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        router.push(next);
      } else if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        router.push(next);
      } else {
        // Handle direct visits without tokens (or the bot returning an error payload)
        const errorDesc = params.get('error_description');
        setError(errorDesc || 'Invalid verification link. The link may have expired or was already used.');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center relative z-10">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Verifying Secure Login</h2>
            <p className="text-slate-500 font-medium">Please wait while we establish a secure session...</p>
          </>
        )}
      </div>
    </div>
  );
}
