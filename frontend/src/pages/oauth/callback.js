import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/AuthContext';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const { code, state, error } = router.query;
      
      if (error) {
        console.error('OAuth error:', error);
        router.push({
          pathname: '/login',
          query: { error }
        });
        return;
      }
      
      if (code && state) {
        const result = await handleOAuthCallback(code, state);
        
        if (result.success) {
          router.push('/dashboard');
        } else {
          router.push({
            pathname: '/login',
            query: { error: result.error || 'Authentication failed' }
          });
        }
      } else {
        router.push('/login');
      }
    };

    if (router.isReady) {
      processCallback();
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>Connecting... - PM3K</title>
      </Head>
      
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Connecting to TikTok</h1>
          <p className="text-gray-400">Please wait while we complete the authentication...</p>
          <div className="mt-6">
            <div className="spinner w-8 h-8 border-primary-500 mx-auto"></div>
          </div>
        </div>
      </div>
    </>
  );
}
