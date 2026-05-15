import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Video, Play, Zap, Shield, Upload } from 'lucide-react';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithTikTok, handleOAuthCallback, isAuthenticated, isLoading: authLoading, error } = useAuth();
  const [oauthUrl, setOauthUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Handle OAuth callback from URL
  useEffect(() => {
    const handleCallback = async () => {
      const { code, state, error: oauthError } = router.query;
      
      if (oauthError) {
        setLoginError(oauthError === 'access_denied' 
          ? 'Login was cancelled. Please try again.' 
          : oauthError
        );
        setIsLoading(false);
        return;
      }
      
      if (code) {
        setIsLoading(true);
        const result = await handleOAuthCallback(code, state || '');
        
        if (result.success) {
          router.push('/dashboard');
        } else {
          setLoginError(result.error || 'Authentication failed');
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [router.query, handleOAuthCallback, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const result = await loginWithTikTok();
      
      if (result.success && result.oauthUrl) {
        // Store state for verification
        sessionStorage.setItem('oauth_state', result.state);
        
        // Redirect to TikTok OAuth
        window.location.href = result.oauthUrl;
      } else {
        setLoginError(result.error || 'Failed to initiate login');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>PM3K - TikTok Content Posting Platform</title>
        <meta name="description" content="Post videos to TikTok sandbox easily" />
      </Head>
      
      <div className="min-h-screen bg-dark-400 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          {/* Logo and Branding */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-glow">
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-2">
              <span className="gradient-text">PM3K</span>
            </h1>
            <p className="text-gray-400 text-lg">TikTok Content Posting Platform</p>
            <div className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
              TikTok Sandbox Mode
            </div>
          </div>

          {/* Login Card */}
          <div className="card max-w-md w-full p-8 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-dark-300 rounded-full border border-gray-700">
              <span className="text-xs text-gray-400">Sandbox Environment</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
              <p className="text-gray-400 text-sm">
                Connect your TikTok sandbox account to start posting videos
              </p>
            </div>

            {/* Error Message */}
            {(loginError || error) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm text-center">{loginError || error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="btn-tiktok w-full flex items-center justify-center gap-3 text-lg py-4"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                  <span>Login with TikTok</span>
                </>
              )}
            </button>

            {/* Info Text */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                By continuing, you agree to connect your TikTok sandbox account
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mt-12 max-w-lg">
            <div className="glass-panel p-4 text-center">
              <Upload className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Video Upload</p>
              <p className="text-xs text-gray-500">Upload MP4 videos</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <Play className="w-6 h-6 text-pink-400 mx-auto mb-2" />
              <p className="text-sm font-medium">One-Click Post</p>
              <p className="text-xs text-gray-500">Publish to TikTok</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Fast Processing</p>
              <p className="text-xs text-gray-500">Quick uploads</p>
            </div>
            <div className="glass-panel p-4 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Secure Auth</p>
              <p className="text-xs text-gray-500">JWT protection</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-xs">
              PM3K v1.0 - TikTok Sandbox Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
