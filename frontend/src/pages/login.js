'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Video, Play, Zap, Shield, Upload } from 'lucide-react';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithTikTok, handleOAuthCallback, isAuthenticated, isLoading: authLoading, error } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    const { code, state, error: oauthError } = router.query;
    
    if (oauthError) {
      setLoginError(oauthError === 'access_denied' ? 'Login was cancelled.' : oauthError);
      return;
    }
    
    if (code && !isAuthenticated) {
      setIsProcessing(true);
      handleOAuthCallback(code, state || '')
        .then((result) => {
          if (result.success) {
            router.push('/dashboard');
          } else {
            setLoginError(result.error || 'Authentication failed');
            setIsProcessing(false);
          }
        });
    }
  }, [router.query]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async () => {
    setLoginError(null);
    const result = await loginWithTikTok();
    if (result.success && result.oauthUrl) {
      window.location.href = result.oauthUrl;
    } else {
      setLoginError(result.error || 'Failed to start login');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="spinner w-12 h-12 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>PM3K - Login</title>
      </Head>
      
      <div className="min-h-screen bg-dark-400 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-glow">
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-2">
              <span className="gradient-text">PM3K</span>
            </h1>
            <p className="text-gray-400 text-lg">TikTok Sandbox Platform</p>
            <div className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
              Sandbox Mode Only
            </div>
          </div>

          <div className="card max-w-md w-full p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Welcome</h2>
              <p className="text-gray-400 text-sm">Login with TikTok Test Account</p>
            </div>

            {(loginError || error) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm text-center">{loginError || error}</p>
              </div>
            )}

            {isProcessing ? (
              <div className="text-center py-4">
                <div className="spinner w-8 h-8 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Connecting to TikTok...</p>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="btn-tiktok w-full flex items-center justify-center gap-3 text-lg py-4"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
                <span>Login with TikTok</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-12 max-w-lg">
            <div className="glass-panel p-4 text-center">
              <Upload className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Video Upload</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <Play className="w-6 h-6 text-pink-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Post Videos</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Fast Upload</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Secure</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
