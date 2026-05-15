import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { Video, Upload, Zap, Shield, Play, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-400 flex items-center justify-center">
        <div className="spinner w-12 h-12 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>PM3K - TikTok Content Posting Platform</title>
        <meta name="description" content="Post videos to TikTok sandbox easily with PM3K" />
      </Head>
      
      <div className="min-h-screen bg-dark-400 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PM3K</span>
            </div>
            <Link href="/login" className="btn-tiktok py-2">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-full mb-6">
              TikTok Sandbox Environment
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Post Videos</span>
              <br />
              to TikTok Easily
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              PM3K is a modern content posting platform that makes uploading and sharing videos on TikTok sandbox effortless.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="btn-tiktok text-lg px-8 py-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Start Posting Now
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Upload</h3>
              <p className="text-gray-400">
                Drag and drop your videos with just a few clicks. Supports MP4, MOV, AVI, and WebM formats.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast Processing</h3>
              <p className="text-gray-400">
                Quick video uploads with real-time progress tracking. Get your content live in minutes.
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Safe</h3>
              <p className="text-gray-400">
                JWT authentication and secure token storage. Your account and data are always protected.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative z-10 px-4 py-20 max-w-4xl mx-auto text-center">
          <div className="card py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-400 mb-8">
              Connect your TikTok sandbox account and start posting videos today.
            </p>
            <Link href="/login" className="btn-tiktok text-lg px-8 py-4 inline-flex items-center gap-2">
              <Play className="w-5 h-5" />
              Login with TikTok
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 px-4 py-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
            <p>PM3K v1.0 - TikTok Content Posting Platform (Sandbox)</p>
            <p className="mt-2">Built for TikTok API Testing</p>
          </div>
        </footer>
      </div>
    </>
  );
}
